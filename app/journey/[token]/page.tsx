import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { routeKm } from "@/lib/journey";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import { getClientIp } from "@/lib/rate-limit";
import { formatDate, formatDateTime, istDateKey } from "@/lib/format-date";
import { JourneyMap } from "@/components/features/locations/journey-map";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Volunteer Journey | Gyan Setu", robots: { index: false, follow: false } };

const NO_GROUP = "00000000-0000-0000-0000-000000000000"; // .in() needs a non-empty list
const MAX_PATH = 800; // polyline vertices sent to the browser

// Tighter than the global 200/min: slows token guessing and scrapers.
const journeyRatelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:journey" });

export default async function JourneyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { success } = await journeyRatelimit.limit(await getClientIp());
  if (!success) {
    return <main className="p-8 text-center">Too many requests. Please try again in a minute.</main>;
  }
  const db = createServerClient();

  const { data: link } = await db
    .from("parent_share_links")
    .select("volunteer_id, tour_id")
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();
  if (!link) notFound();
  const vid = link.volunteer_id;

  // Optional tour scope: restrict every section to that tour.
  const tourId: string | null = link.tour_id;
  const { data: tour } = tourId
    ? await db.from("tours").select("start_date, end_date").eq("id", tourId).single()
    : { data: null };
  const { data: tourGroups } = tourId
    ? await db.from("tour_groups").select("id").eq("tour_id", tourId)
    : { data: null };

  const { data: memberships } = await db.from("tour_group_members").select("group_id").eq("user_id", vid);
  const scopeIds = new Set((tourGroups ?? []).map((g) => g.id));
  const groupIds = (memberships ?? []).map((m) => m.group_id).filter((id) => !tourId || scopeIds.has(id));

  let pointsQ = db.from("location_points").select("latitude, longitude, recorded_at").eq("user_id", vid).order("recorded_at").limit(20000);
  let logsQ = db.from("daily_logs").select("log_date, activities_conducted, key_achievements").eq("volunteer_id", vid).order("log_date", { ascending: false });
  let schoolsQ = db.from("school_reports").select("school_name, village_town, district, state, visit_date").eq("submitted_by", vid).order("visit_date", { ascending: false });
  let photosQ = db.from("media_gallery").select("file_url, caption, created_at").eq("uploaded_by", vid).eq("media_type", "photo").order("created_at", { ascending: false }).limit(24);
  if (tourId) {
    if (tour) pointsQ = pointsQ.gte("recorded_at", `${tour.start_date}T00:00:00+05:30`).lte("recorded_at", `${tour.end_date}T23:59:59.999+05:30`);
    logsQ = logsQ.eq("tour_id", tourId);
    photosQ = photosQ.eq("tour_id", tourId);
    schoolsQ = schoolsQ.in("group_id", groupIds.length ? groupIds : [NO_GROUP]);
  }

  const [{ data: user }, { data: points }, { data: live }, { data: logs }, { data: schools }, { data: photos }] = await Promise.all([
    db.from("users").select("name, avatar_url").eq("id", vid).single(),
    pointsQ,
    db.from("volunteer_locations").select("is_sharing, updated_at").eq("user_id", vid).maybeSingle(),
    logsQ,
    schoolsQ,
    photosQ,
  ]);

  const { data: tickets } = groupIds.length
    ? await db
        .from("travel_tickets")
        .select("departure_station, arrival_station, departure_at, arrival_at")
        .in("group_id", groupIds)
        .order("departure_at", { ascending: false })
    : { data: [] };

  const pts = points ?? [];
  const km = routeKm(pts);
  const step = Math.max(1, Math.ceil(pts.length / MAX_PATH));
  const path = pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map((p) => [p.latitude, p.longitude] as [number, number]);
  const days = new Set(pts.map((p) => istDateKey(p.recorded_at))).size;
  const isLive = !!live?.is_sharing && Date.now() - new Date(live.updated_at).getTime() < 10 * 60_000;

  const stats = [
    { label: "Distance", value: `${km.toFixed(1)} km` },
    { label: "Days on road", value: String(days) },
    { label: "Schools visited", value: String(schools?.length ?? 0) },
    { label: "Daily logs", value: String(logs?.length ?? 0) },
  ];

  const card = { background: "var(--card, #fff)", border: "1px solid rgba(90,82,71,0.15)", borderRadius: 12, padding: 16 } as const;

  return (
    <main className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <header>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)" }}>Gyan Setu · Journey</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0" }}>{user?.name ?? "Volunteer"}</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)" }}>
            {isLive ? "🟢 Live now" : live?.updated_at ? `Last seen ${formatDateTime(live.updated_at)}` : "No location shared yet"}
          </p>
        </header>

        <div style={{ ...card, padding: 0, height: 360, overflow: "hidden" }}>
          <JourneyMap path={path} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {!!tickets?.length && (
          <section style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Travel</h2>
            {tickets.map((t, i) => (
              <p key={i} style={{ fontSize: 14, margin: "4px 0" }}>
                🚆 {t.departure_station} → {t.arrival_station}
                {t.departure_at && <span style={{ color: "var(--gs-muted)" }}> · {formatDate(t.departure_at)}</span>}
              </p>
            ))}
          </section>
        )}

        {!!schools?.length && (
          <section style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Schools visited</h2>
            {schools.map((s, i) => (
              <p key={i} style={{ fontSize: 14, margin: "4px 0" }}>
                🏫 <strong>{s.school_name}</strong>
                <span style={{ color: "var(--gs-muted)" }}>
                  {" "}· {[s.village_town, s.district, s.state].filter(Boolean).join(", ")}
                  {s.visit_date && ` · ${formatDate(s.visit_date)}`}
                </span>
              </p>
            ))}
          </section>
        )}

        {!!logs?.length && (
          <section style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Daily highlights</h2>
            {logs.map((l, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i ? "1px solid rgba(90,82,71,0.1)" : undefined }}>
                <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>{formatDate(l.log_date)}</div>
                {l.activities_conducted && <p style={{ fontSize: 14, margin: "4px 0" }}>{l.activities_conducted}</p>}
                {l.key_achievements && <p style={{ fontSize: 14, margin: "4px 0", color: "var(--gs-text-secondary)" }}>⭐ {l.key_achievements}</p>}
              </div>
            ))}
          </section>
        )}

        {!!photos?.length && (
          <section style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Photos</h2>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p.file_url} alt={p.caption ?? "Tour photo"} loading="lazy" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
