import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Tour } from "@/types";

export default async function StudentToursPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const [{ data: tours }, { data: user }] = await Promise.all([
    db.from("tours").select("*").eq("status", "open").order("start_date"),
    db.from("users").select("id").eq("clerk_id", userId!).single(),
  ]);

  const { data: myApplications } = await db
    .from("tour_applications")
    .select("tour_id")
    .eq("student_id", user?.id ?? "");

  const appliedSet = new Set((myApplications ?? []).map((a) => a.tour_id));

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Student Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Open Tours</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Browse and apply for upcoming Jnana Pravas tours</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tours ?? []).length === 0 && (
            <p style={{ fontSize: 14, color: "#9B9188", textAlign: "center", padding: "48px 0" }} className="col-span-2">
              No open tours at the moment. Check back later.
            </p>
          )}
          {(tours ?? [] as Tour[]).map((tour) => (
            <div key={tour.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", margin: 0, lineHeight: 1.3 }} className="truncate pr-2">{tour.title}</h3>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#2A5E3A", background: "rgba(42,94,58,0.08)", flexShrink: 0 }}>Open</span>
              </div>
              <p style={{ fontSize: 13.5, color: "#5A5247", marginBottom: 14, lineHeight: 1.5 }} className="line-clamp-2">{tour.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#9B9188", marginBottom: 14 }}>
                <span>{tour.destination}</span>
                <span>·</span>
                <span>{tour.start_date} → {tour.end_date}</span>
                <span>·</span>
                <span>{tour.capacity} seats</span>
              </div>
              {appliedSet.has(tour.id) ? (
                <button disabled style={{ width: "100%", background: "transparent", color: "#9B9188", fontSize: 13, fontWeight: 500, padding: "8px 0", borderRadius: 5, border: "1px solid #E4DFD1", cursor: "default" }}>
                  Applied
                </button>
              ) : (
                <Link href={`/student/tours/${tour.id}`} style={{ display: "block" }}>
                  <button style={{ width: "100%", background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 0", borderRadius: 5, border: "none", cursor: "pointer" }}>
                    View &amp; Apply
                  </button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
