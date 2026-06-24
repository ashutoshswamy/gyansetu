import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/features/dashboard/stat-card";
import Link from "next/link";
import { Plane, ClipboardList, ArrowRight, CheckCircle, Clock } from "lucide-react";

const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  shortlisted: { label: "Shortlisted", color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  selected:    { label: "Selected",    color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  rejected:    { label: "Rejected",    color: "#B8381E", bg: "rgba(184,56,30,0.08)" },
};

export default async function EnrollmentDashboard() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db
    .from("users")
    .select("id, name")
    .eq("clerk_id", userId!)
    .single();

  const [{ data: applications }, { data: openTours }, { data: availableTests }] =
    await Promise.all([
      db
        .from("tour_applications")
        .select("*, tours(title, destination, start_date, end_date)")
        .eq("student_id", user?.id ?? "")
        .order("submitted_at", { ascending: false }),
      db
        .from("tours")
        .select("id, title, destination, start_date, capacity, status")
        .eq("status", "open")
        .order("start_date")
        .limit(6),
      db
        .from("eligibility_tests")
        .select("id, title, duration_minutes, passing_score, tour_id")
        .eq("status", "active"),
    ]);

  const appliedTourIds = new Set((applications ?? []).map((a: any) => a.tour_id));
  const unappliedTours = (openTours ?? []).filter((t: any) => !appliedTourIds.has(t.id));

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Student Portal
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>
            Welcome, {user?.name ?? "Enrollee"}
          </h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Track your tour applications and eligibility tests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Applications"
            value={applications?.length ?? 0}
            icon={<Plane size={18} />}
            accent="indigo"
          />
          <StatCard
            label="Shortlisted"
            value={applications?.filter((a: any) => a.status === "shortlisted").length ?? 0}
            icon={<Clock size={18} />}
            accent="sky"
          />
          <StatCard
            label="Selected"
            value={applications?.filter((a: any) => a.status === "selected").length ?? 0}
            icon={<CheckCircle size={18} />}
            accent="emerald"
          />
          <StatCard
            label="Tests Available"
            value={availableTests?.length ?? 0}
            icon={<ClipboardList size={18} />}
            accent="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* My Applications */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>My Applications</h2>
              <Link href="/student/tours">
                <button className="flex items-center gap-1" style={{ fontSize: 12, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {(applications ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "#9B9188" }}>
                  No applications yet.
                </p>
                <p className="text-xs mt-1" style={{ color: "#9B9188" }}>
                  Browse open tours below to apply.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(applications ?? []).slice(0, 5).map((app: any) => {
                  const s = statusStyles[app.status] ?? statusStyles.pending;
                  return (
                    <div
                      key={app.id}
                      style={{ background: "#F3F0E8", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#19140F" }}>
                          {app.tours?.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#9B9188" }}>
                          {app.tours?.destination}
                          {app.test_score != null && ` · Score: ${app.test_score.toFixed(0)}%`}
                        </p>
                      </div>
                      <span
                        style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, color: s.color, background: s.bg, flexShrink: 0, marginLeft: 12 }}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Tests */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>Eligibility Tests</h2>
              <Link href="/student/tests">
                <button className="flex items-center gap-1" style={{ fontSize: 12, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {(availableTests ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "#9B9188" }}>
                  No active tests.
                </p>
                <p className="text-xs mt-1" style={{ color: "#9B9188" }}>
                  Apply for a tour to unlock its eligibility test.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(availableTests ?? []).slice(0, 5).map((test: any) => (
                  <div
                    key={test.id}
                    style={{ background: "#F3F0E8", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#19140F" }}>
                        {test.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#9B9188" }}>
                        {test.duration_minutes} min · Pass: {test.passing_score}%
                      </p>
                    </div>
                    <Link href={`/student/tests/${test.id}`}>
                      <button
                        style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer", flexShrink: 0, marginLeft: 12 }}
                      >
                        Take Test
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Open Tours */}
        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>Upcoming Open Tours</h2>
            <Link href="/student/tours">
              <button className="flex items-center gap-1" style={{ fontSize: 12, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                Browse all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>

          {unappliedTours.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "#9B9188" }}>
              {(openTours ?? []).length === 0
                ? "No open tours at this time."
                : "You've applied to all open tours."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unappliedTours.map((tour: any) => (
                <div
                  key={tour.id}
                  style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: 16 }}
                >
                  <p className="font-medium text-sm mb-1" style={{ color: "#19140F" }}>{tour.title}</p>
                  <p className="text-xs mb-3" style={{ color: "#9B9188" }}>
                    {tour.destination} · {new Date(tour.start_date).toLocaleDateString()}
                  </p>
                  <Link href={`/student/tours/${tour.id}`} style={{ display: "block" }}>
                    <button
                      style={{ width: "100%", background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}
                    >
                      Apply Now
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
