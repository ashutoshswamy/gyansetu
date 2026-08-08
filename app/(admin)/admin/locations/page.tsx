import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Tour } from "@/types";
import { MapPin, Calendar } from "lucide-react";

export default async function AdminLocationsPage() {
  const db = createServerClient();
  const { data: tours } = await db
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Volunteer Locations</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
            Select a tour to view live volunteer locations by group
          </p>
        </div>

        <div className="space-y-3">
          {(tours ?? []).length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No tours yet.
            </p>
          )}
          {(tours ?? []).map((tour: Tour) => (
            <Link key={tour.id} href={`/admin/locations/${tour.id}`}>
              <div
                className="flex items-center justify-between"
                style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", cursor: "pointer" }}
              >
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }} className="truncate">{tour.title}</h3>
                  <div className="flex gap-4 mt-1" style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                    <span className="flex items-center gap-1"><MapPin size={11} /> {tour.destination}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {tour.start_date} &rarr; {tour.end_date}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
