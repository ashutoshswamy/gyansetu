import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Tour } from "@/types";
import { ToursListClient } from "./tours-list-client";
import { Button } from "@/components/ui/button";

export default async function AdminToursPage() {
  const db = createServerClient();
  const { data: tours } = await db
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Tours</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
              {tours?.length ?? 0} tours total
            </p>
          </div>
          <Link href="/admin/tours/new">
            <Button>+ New Tour</Button>
          </Link>
        </div>

        <ToursListClient tours={(tours ?? []) as Tour[]} />
      </div>
    </div>
  );
}
