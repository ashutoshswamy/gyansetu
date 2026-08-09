import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/features/export-button";
import { UserCheck, ClipboardList } from "lucide-react";

const appStatusStyles: Record<string, { color: string; background: string }> = {
  pending:     { color: "var(--gs-warning)", background: "rgba(var(--gs-warning-rgb), 0.08)" },
  shortlisted: { color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.08)" },
  selected:    { color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)" },
  rejected:    { color: "var(--gs-danger-alt)", background: "rgba(var(--gs-danger-alt-rgb), 0.08)" },
};

interface EnrollmentApplication {
  id: string;
  status: string;
  test_score?: number;
  submitted_at: string;
  tours?: { title: string; destination: string };
}

interface EnrollmentUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  tour_applications?: EnrollmentApplication[];
}

export default async function AdminEnrollmentsPage() {
  const db = createServerClient();

  const { data: enrollmentUsers } = await db
    .from("users")
    .select("*, tour_applications(id, status, test_score, submitted_at, tours(title, destination))")
    .is("role", null)
    .order("created_at", { ascending: false });

  const exportData = ((enrollmentUsers ?? []) as EnrollmentUser[]).map((u) => ({
    name: u.name,
    email: u.email,
    applications: u.tour_applications?.length ?? 0,
    shortlisted: u.tour_applications?.filter((a) => a.status === "shortlisted").length ?? 0,
    selected: u.tour_applications?.filter((a) => a.status === "selected").length ?? 0,
    best_score: u.tour_applications?.reduce(
      (max: number, a) => Math.max(max, a.test_score ?? 0),
      0
    ),
    registered: new Date(u.created_at).toLocaleDateString(),
  }));

  const summaryItems = [
    {
      label: "Total Enrolled",
      value: enrollmentUsers?.length ?? 0,
    },
    {
      label: "Applied to Tours",
      value: ((enrollmentUsers ?? []) as EnrollmentUser[]).filter(
        (u) => (u.tour_applications?.length ?? 0) > 0
      ).length,
    },
    {
      label: "Shortlisted",
      value: ((enrollmentUsers ?? []) as EnrollmentUser[]).filter((u) =>
        u.tour_applications?.some((a) => a.status === "shortlisted")
      ).length,
    },
    {
      label: "Selected",
      value: ((enrollmentUsers ?? []) as EnrollmentUser[]).filter((u) =>
        u.tour_applications?.some((a) => a.status === "selected")
      ).length,
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Enrollments</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
              {enrollmentUsers?.length ?? 0} registered enrollment users &middot; applications and test results
            </p>
          </div>
          <ExportButton
            data={exportData}
            filename="enrollments.csv"
            label="Export CSV"
          />
        </div>

        {/* Summary bar */}
        <Card className="mb-6 p-0">
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 p-0">
            {summaryItems.map((item, idx) => (
              <div
                key={item.label}
                className="py-4 px-5"
                style={{ borderRight: idx < summaryItems.length - 1 ? "1px solid var(--border)" : undefined }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gs-muted)", marginBottom: 4 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "var(--gs-accent)", fontFamily: "var(--font-geist-mono), monospace" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User list */}
        <div className="space-y-3">
          {(enrollmentUsers ?? []).length === 0 && (
            <Card>
              <CardContent className="text-center pt-16 pb-16">
                <UserCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>
                  No enrollment users registered yet.
                </p>
              </CardContent>
            </Card>
          )}

          {((enrollmentUsers ?? []) as EnrollmentUser[]).map((u) => {
            const apps = u.tour_applications ?? [];
            const bestScore = apps.reduce(
              (max: number, a) => Math.max(max, a.test_score ?? 0),
              0
            );

            return (
              <Card key={u.id}>
                {/* User row */}
                <div className="flex items-center gap-4 p-4">
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(var(--gs-accent-rgb), 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--gs-accent)", flexShrink: 0 }}>
                    {u.name?.charAt(0) ?? "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{u.name}</p>
                    <p style={{ fontSize: 12, color: "var(--gs-muted)" }}>{u.email}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0" style={{ fontSize: 12 }}>
                    <div className="text-center">
                      <p style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, color: "var(--gs-accent)", fontFamily: "var(--font-geist-mono), monospace" }}>
                        {apps.length}
                      </p>
                      <p style={{ marginTop: 2, color: "var(--gs-muted)" }}>applied</p>
                    </div>

                    {bestScore > 0 && (
                      <div className="text-center">
                        <p style={{
                          fontWeight: 700,
                          fontSize: 18,
                          lineHeight: 1,
                          color: bestScore >= 60 ? "var(--gs-success)" : "var(--gs-danger-alt)",
                          fontFamily: "var(--font-geist-mono), monospace",
                        }}>
                          {bestScore.toFixed(0)}%
                        </p>
                        <p style={{ marginTop: 2, color: "var(--gs-muted)" }}>best score</p>
                      </div>
                    )}

                    <Badge style={{ color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.08)" }}>
                      Enrolled
                    </Badge>
                  </div>
                </div>

                {/* Applications sub-rows */}
                {apps.length > 0 && (
                  <div
                    className="px-4 pb-3 pt-0"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gs-muted)", paddingTop: 12, paddingBottom: 8 }}>
                      Applications
                    </p>
                    <div className="space-y-1.5">
                      {apps.map((app) => {
                        const s = appStatusStyles[app.status] ?? appStatusStyles.pending;
                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between py-2 px-3 rounded"
                            style={{ background: "var(--gs-card)" }}
                          >
                            <div className="min-w-0">
                              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }} className="truncate">
                                {app.tours?.title ?? "-"}
                              </p>
                              <p style={{ fontSize: 11, color: "var(--gs-muted)" }}>
                                {app.tours?.destination}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                              {app.test_score != null && (
                                <div className="flex items-center gap-1">
                                  <ClipboardList className="w-3 h-3" style={{ color: "var(--gs-muted)" }} />
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontFamily: "monospace",
                                      color: app.test_score >= 60 ? "var(--gs-success)" : "var(--gs-danger-alt)",
                                    }}
                                  >
                                    {app.test_score.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              <Badge
                                style={{ color: s.color, background: s.background, textTransform: "capitalize" }}
                              >
                                {app.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
