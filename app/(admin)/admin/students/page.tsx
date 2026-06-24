import { createServerClient } from "@/lib/supabase/server";
import { ExportButton } from "@/components/features/export-button";
import { UserCheck, ClipboardList } from "lucide-react";

const appStatusStyles: Record<string, { color: string; background: string }> = {
  pending:     { color: "#F5A520", background: "rgba(245,165,32,0.08)" },
  shortlisted: { color: "#4A55BE", background: "rgba(74,85,190,0.08)" },
  selected:    { color: "#2A5E3A", background: "rgba(42,94,58,0.08)" },
  rejected:    { color: "#B8381E", background: "rgba(184,56,30,0.08)" },
};

export default async function AdminEnrollmentsPage() {
  const db = createServerClient();

  const { data: enrollmentUsers } = await db
    .from("users")
    .select("*, tour_applications(id, status, test_score, submitted_at, tours(title, destination))")
    .or("role.eq.enrollment_user,role.is.null")
    .order("created_at", { ascending: false });

  const exportData = (enrollmentUsers ?? []).map((u: any) => ({
    name: u.name,
    email: u.email,
    applications: u.tour_applications?.length ?? 0,
    shortlisted: u.tour_applications?.filter((a: any) => a.status === "shortlisted").length ?? 0,
    selected: u.tour_applications?.filter((a: any) => a.status === "selected").length ?? 0,
    best_score: u.tour_applications?.reduce(
      (max: number, a: any) => Math.max(max, a.test_score ?? 0),
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
      value: (enrollmentUsers ?? []).filter(
        (u: any) => (u.tour_applications?.length ?? 0) > 0
      ).length,
    },
    {
      label: "Shortlisted",
      value: (enrollmentUsers ?? []).filter((u: any) =>
        u.tour_applications?.some((a: any) => a.status === "shortlisted")
      ).length,
    },
    {
      label: "Selected",
      value: (enrollmentUsers ?? []).filter((u: any) =>
        u.tour_applications?.some((a: any) => a.status === "selected")
      ).length,
    },
  ];

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Enrollments</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
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
        <div
          className="grid grid-cols-4 mb-6 rounded-xl overflow-hidden"
          style={{ border: "1px solid #E4DFD1", background: "white" }}
        >
          {summaryItems.map((item, idx) => (
            <div
              key={item.label}
              className="py-4 px-5"
              style={{ borderRight: idx < summaryItems.length - 1 ? "1px solid #E4DFD1" : undefined }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9188", marginBottom: 4 }}>
                {item.label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#4A55BE", fontFamily: "var(--font-geist-mono), monospace" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* User list */}
        <div className="space-y-3">
          {(enrollmentUsers ?? []).length === 0 && (
            <div
              className="py-16 text-center rounded-xl"
              style={{ background: "white", border: "1px solid #E4DFD1" }}
            >
              <UserCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 14, color: "#9B9188" }}>
                No enrollment users registered yet.
              </p>
            </div>
          )}

          {(enrollmentUsers ?? []).map((u: any) => {
            const apps = u.tour_applications ?? [];
            const bestScore = apps.reduce(
              (max: number, a: any) => Math.max(max, a.test_score ?? 0),
              0
            );

            return (
              <div
                key={u.id}
                className="rounded-xl overflow-hidden"
                style={{ background: "white", border: "1px solid #E4DFD1" }}
              >
                {/* User row */}
                <div className="flex items-center gap-4 p-4">
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(74,85,190,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#4A55BE", flexShrink: 0 }}>
                    {u.name?.charAt(0) ?? "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#19140F" }}>{u.name}</p>
                    <p style={{ fontSize: 12, color: "#9B9188" }}>{u.email}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0" style={{ fontSize: 12 }}>
                    <div className="text-center">
                      <p style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, color: "#4A55BE", fontFamily: "var(--font-geist-mono), monospace" }}>
                        {apps.length}
                      </p>
                      <p style={{ marginTop: 2, color: "#9B9188" }}>applied</p>
                    </div>

                    {bestScore > 0 && (
                      <div className="text-center">
                        <p style={{
                          fontWeight: 700,
                          fontSize: 18,
                          lineHeight: 1,
                          color: bestScore >= 60 ? "#2A5E3A" : "#B8381E",
                          fontFamily: "var(--font-geist-mono), monospace",
                        }}>
                          {bestScore.toFixed(0)}%
                        </p>
                        <p style={{ marginTop: 2, color: "#9B9188" }}>best score</p>
                      </div>
                    )}

                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>
                      Enrolled
                    </span>
                  </div>
                </div>

                {/* Applications sub-rows */}
                {apps.length > 0 && (
                  <div
                    className="px-4 pb-3 pt-0"
                    style={{ borderTop: "1px solid #E4DFD1" }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9188", paddingTop: 12, paddingBottom: 8 }}>
                      Applications
                    </p>
                    <div className="space-y-1.5">
                      {apps.map((app: any) => {
                        const s = appStatusStyles[app.status] ?? appStatusStyles.pending;
                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between py-2 px-3 rounded"
                            style={{ background: "#F3F0E8" }}
                          >
                            <div className="min-w-0">
                              <p style={{ fontSize: 12, fontWeight: 500, color: "#19140F" }} className="truncate">
                                {app.tours?.title ?? "-"}
                              </p>
                              <p style={{ fontSize: 11, color: "#9B9188" }}>
                                {app.tours?.destination}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                              {app.test_score != null && (
                                <div className="flex items-center gap-1">
                                  <ClipboardList className="w-3 h-3" style={{ color: "#9B9188" }} />
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontFamily: "monospace",
                                      color: app.test_score >= 60 ? "#2A5E3A" : "#B8381E",
                                    }}
                                  >
                                    {app.test_score.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              <span
                                style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.background, textTransform: "capitalize" }}
                              >
                                {app.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
