import Link from "next/link";
import { getAllWorkshops } from "@/actions/workshops";
import { formatDate } from "@/lib/format-date";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const typeColors: Record<string, { color: string; bg: string; label: string }> = {
  science:            { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)", label: "Science" },
  mathematics:        { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Mathematics" },
  exhibition_country: { color: "#6B21A8", bg: "rgba(107, 33, 168, 0.08)", label: "Exhibition- Know our Country" },
  cultural_survey:    { color: "var(--gs-warning-alt)", bg: "rgba(var(--gs-warning-alt-rgb), 0.08)", label: "Cultural and Survey" },
  other:              { color: "var(--gs-text-secondary)", bg: "rgba(var(--gs-muted-rgb), 0.08)", label: "Other" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  scheduled: { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.1)" },
  completed: { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  cancelled: { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)" },
};

export default async function AdminWorkshopsPage() {
  const workshops = await getAllWorkshops();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Workshops</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{workshops.length} workshops scheduled</p>
          </div>
          <Link href="/admin/workshops/new">
            <Button>+ New Workshop</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {workshops.length === 0 && (
            <Card>
<CardContent className="text-center">
              <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
              <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No workshops scheduled yet.</p>
            </CardContent>
</Card>
          )}
          {workshops.map((w: Awaited<ReturnType<typeof getAllWorkshops>>[number]) => {
            const t = typeColors[w.workshop_type] ?? typeColors.other;
            const s = statusColors[w.status] ?? statusColors.scheduled;
            return (
              <Link key={w.id} href={`/admin/workshops/${w.id}`} style={{ textDecoration: "none", display: "block" }}>
                <Card>
<CardContent className="flex items-center gap-4">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <GraduationCap size={18} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{w.title}</span>
                      <Badge style={{color: t.color, background: t.bg}}>
                        {t.label}
                      </Badge>
                      <Badge style={{color: s.color, background: s.bg, textTransform: "capitalize"}}>
                        {w.status}
                      </Badge>
                      <span style={{ fontSize: 11, fontWeight: 600, color: w.kit_ready ? "var(--gs-success)" : "var(--gs-muted)" }}>
                        {w.kit_ready ? "✓ Kit Ready" : "✗ Kit Not Ready"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                      {formatDate(w.workshop_date)}
                      {w.workshop_time ? ` · ${w.workshop_time}` : ""}
                      {w.hall_location ? ` · ${w.hall_location}` : ""}
                      {w.trainer_name ? ` · Trainer: ${w.trainer_name}` : ""}
                      {w.groups?.length ? ` · Groups: ${w.groups.map((g: { name: string }) => g.name).join(", ")}` : ""}
                    </div>
                  </div>
                </CardContent>
</Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
