import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Tour } from "@/types";
import { ToursListClient } from "./tours-list-client";

export default async function AdminToursPage() {
  const db = createServerClient();
  const { data: tours } = await db
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
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

        <ToursListClient tours={(tours ?? []) as Tour[]} />
      </div>
    </div>
  );
}
