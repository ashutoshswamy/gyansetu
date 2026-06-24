import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Tour } from "@/types";
import { MapPin, Calendar, Users } from "lucide-react";

const statusStyles: Record<Tour["status"], { color: string; background: string }> = {
  draft:     { color: "#9B9188", background: "rgba(90,82,71,0.08)" },
  open:      { color: "#2A5E3A", background: "rgba(42,94,58,0.08)" },
  closed:    { color: "#F5A520", background: "rgba(245,165,32,0.08)" },
  completed: { color: "#4A55BE", background: "rgba(74,85,190,0.08)" },
};

export default async function AdminToursPage() {
  const db = createServerClient();
  const { data: tours } = await db
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Tours</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {tours?.length ?? 0} tours total
            </p>
          </div>
          <Link href="/admin/tours/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + New Tour
            </button>
          </Link>
        </div>

        <div className="space-y-3">
          {(tours ?? []).length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No tours yet. Create your first tour.
            </p>
          )}
          {(tours ?? []).map((tour: Tour) => {
            const s = statusStyles[tour.status];
            return (
              <div
                key={tour.id}
                className="flex items-center justify-between"
                style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }} className="truncate">{tour.title}</h3>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.background, flexShrink: 0, textTransform: "capitalize" }}>
                      {tour.status}
                    </span>
                  </div>
                  <div className="flex gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
                    <span className="flex items-center gap-1"><MapPin size={11} /> {tour.destination}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {tour.start_date} &rarr; {tour.end_date}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {tour.capacity} seats</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link href={`/admin/tours/${tour.id}`}>
                    <button style={{ background: "transparent", color: "#4A55BE", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}>
                      Manage
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
