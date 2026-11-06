import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { routeKm } from "@/lib/journey";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import { getClientIp } from "@/lib/rate-limit";
import { formatDate, istDateKey } from "@/lib/format-date";
import { JourneyMap } from "@/components/features/locations/journey-map";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Group Journey | Gyan Setu", robots: { index: false, follow: false } };

const NO_ID = "00000000-0000-0000-0000-000000000000"; // .in() needs a non-empty list
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
    .select("group_id")
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();
  if (!link) notFound();

  const { data: group } = await db
    .from("tour_groups")
    .select("id, name, state_allocated, tours(title, start_date, end_date), tour_group_members(user_id, users(name))")
    .eq("id", link.group_id)
    .single();
  if (!group) notFound();

  const tour = group.tours as unknown as { title: string; start_date: string; end_date: string } | null;
  const members = ((group.tour_group_members ?? []) as unknown as { user_id: string; users: { name: string } | null }[]);
  const vids = members.map((m) => m.user_id);
  const ids = vids.length ? vids : [NO_ID];

  // Route is limited to the tour's dates so earlier trips don't pile onto the map.
  let pointsQ = db.from("location_points").select("user_id, latitude, longitude, recorded_at").in("user_id", ids).order("recorded_at").limit(20000);
  if (tour) pointsQ = pointsQ.gte("recorded_at", `${tour.start_date}T00:00:00+05:30`).lte("recorded_at", `${tour.end_date}T23:59:59.999+05:30`);

  const [{ data: points }, { data: lives }, { data: schools }, { data: photos }, { data: tickets }] = await Promise.all([
    pointsQ,
    db.from("volunteer_locations").select("user_id, is_sharing, updated_at").in("user_id", ids),
    db.from("school_reports").select("school_name, village_town, district, state, visit_date").eq("group_id", group.id).order("visit_date", { ascending: false }),
    db.from("media_gallery").select("file_url, caption").in("uploaded_by", ids).eq("media_type", "photo").order("created_at", { ascending: false }).limit(24),
    db.from("travel_tickets").select("departure_station, arrival_station, departure_at").eq("group_id", group.id).order("departure_at", { ascending: false }),
  ]);

  const byUser = new Map<string, NonNullable<typeof points>>();
  for (const p of points ?? []) byUser.set(p.user_id, [...(byUser.get(p.user_id) ?? []), p]);
  const perMember = [...byUser.values()];
  const km = Math.max(0, ...perMember.map(routeKm)); // group travels together: longest member route
  const paths = perMember.map((pts) => {
    const step = Math.max(1, Math.ceil(pts.length / (MAX_PATH / perMember.length)));
    return pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map((p) => [p.latitude, p.longitude] as [number, number]);
  });
  const days = new Set((points ?? []).map((p) => istDateKey(p.recorded_at))).size;
  const liveFor = (id: string) => {
    const l = lives?.find((x) => x.user_id === id);
    return !!l?.is_sharing && Date.now() - new Date(l.updated_at).getTime() < 10 * 60_000;
  };
  const liveCount = vids.filter(liveFor).length;

  const stats = [
    { label: "Distance", value: `${km.toFixed(1)} km` },
    { label: "Days on road", value: String(days) },
    { label: "Schools visited", value: String(schools?.length ?? 0) },
    { label: "Volunteers", value: String(members.length) },
  ];

  const card = { background: "var(--card, #fff)", border: "1px solid rgba(90,82,71,0.15)", borderRadius: 12, padding: 16 } as const;

  return (
    <main className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <header>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)" }}>Gyan Setu · Journey</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0" }}>{group.name}</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)" }}>
            {[tour?.title, group.state_allocated].filter(Boolean).join(" · ")}
          </p>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)" }}>
            {liveCount ? `🟢 ${liveCount} of ${members.length} sharing live` : "No one is sharing live right now"}
          </p>
        </header>

        <div style={{ ...card, padding: 0, height: 360, overflow: "hidden" }}>
          <JourneyMap paths={paths} />
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

        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Volunteers</h2>
          {members.map((m) => (
            <p key={m.user_id} style={{ fontSize: 14, margin: "4px 0" }}>
              {liveFor(m.user_id) ? "🟢" : "⚪"} {m.users?.name}
            </p>
          ))}
        </section>

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
