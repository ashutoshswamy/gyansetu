import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/features/dashboard/stat-card";
import Link from "next/link";
import { Plane, ClipboardList, ArrowRight, CheckCircle, Clock } from "lucide-react";
import type { TourApplication, Tour, EligibilityTest } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";

type ApplicationRow = TourApplication & {
  tours: Pick<Tour, "title" | "destination" | "start_date" | "end_date"> | null;
};
type OpenTourRow = Pick<Tour, "id" | "title" | "destination" | "start_date" | "capacity" | "status">;
type AvailableTestRow = Pick<EligibilityTest, "id" | "title" | "duration_minutes" | "passing_score" | "tour_id">;

const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  shortlisted: { label: "Shortlisted", color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  selected:    { label: "Selected",    color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  rejected:    { label: "Rejected",    color: "var(--gs-danger-alt)", bg: "rgba(var(--gs-danger-alt-rgb), 0.08)" },
};

export default async function EnrollmentDashboard() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db
    .from("users")
    .select("id, name")
    .eq("clerk_id", userId!)
    .single();

  const [{ data: applications }, { data: openTours }] = await Promise.all([
    db
      .from("tour_applications")
      .select("*, tours(title, destination, start_date, end_date)")
      .eq("student_id", user?.id ?? "")
      .order("submitted_at", { ascending: false }),
    db
      .from("tours")
      .select("id, title, destination, start_date, capacity, status")
      .eq("status", "open")
      .eq("participant_visible", true)
      .order("start_date")
      .limit(6),
  ]);

  const appliedTourIds = new Set((applications ?? []).map((a: ApplicationRow) => a.tour_id));
  const unappliedTours = (openTours ?? []).filter((t: OpenTourRow) => !appliedTourIds.has(t.id));

  // Only tests for tours the student actually applied for — same scoping as /enrollee/tests.
  const { data: availableTests } = appliedTourIds.size > 0
    ? await db
        .from("eligibility_tests")
        .select("id, title, duration_minutes, passing_score, tour_id")
        .in("tour_id", Array.from(appliedTourIds))
        .eq("status", "active")
        .eq("is_template", false)
    : { data: [] as AvailableTestRow[] };

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Student Portal
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Welcome, {user?.name ?? "Enrollee"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
              Track your tour applications and eligibility tests
            </p>
          </div>
          <Link href="/enrollee/history">
            <Button variant="outline">Tour History</Button>
          </Link>
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
            value={applications?.filter((a: ApplicationRow) => a.status === "shortlisted").length ?? 0}
            icon={<Clock size={18} />}
            accent="sky"
          />
          <StatCard
            label="Selected"
            value={applications?.filter((a: ApplicationRow) => a.status === "selected").length ?? 0}
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
          <Card>
<CardContent>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>My Applications</h2>
              <Link href="/enrollee/tours">
                <Button variant="link" size="sm" className="h-auto p-0 flex items-center gap-1 text-xs text-accent font-medium hover:text-accent/90">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {(applications ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--gs-muted)" }}>
                  No applications yet.
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--gs-muted)" }}>
                  Browse open tours below to apply.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(applications ?? []).slice(0, 5).map((app: ApplicationRow) => {
                  const s = statusStyles[app.status] ?? statusStyles.pending;
                  return (
                    <div
                      key={app.id}
                      style={{ background: "var(--gs-card)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                          {app.tours?.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--gs-muted)" }}>
                          {app.tours?.destination}
                          {app.test_score != null && ` · Score: ${app.test_score.toFixed(0)}%`}
                        </p>
                      </div>
                      <Badge style={{color: s.color, background: s.bg, flexShrink: 0, marginLeft: 12}}>
                        {s.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
</Card>

          {/* Available Tests */}
          <Card>
<CardContent>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Eligibility Tests</h2>
              <Link href="/enrollee/tests">
                <Button variant="link" size="sm" className="h-auto p-0 flex items-center gap-1 text-xs text-accent font-medium hover:text-accent/90">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {(availableTests ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--gs-muted)" }}>
                  No active tests.
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--gs-muted)" }}>
                  Apply for a tour to unlock its eligibility test.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(availableTests ?? []).slice(0, 5).map((test: AvailableTestRow) => (
                  <div
                    key={test.id}
                    style={{ background: "var(--gs-card)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                        {test.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--gs-muted)" }}>
                        {test.duration_minutes} min · Pass: {test.passing_score}%
                      </p>
                    </div>
                    <Link href={`/enrollee/tests/${test.id}`}>
                      <Button>Take Test</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
</Card>
        </div>

        {/* Open Tours */}
        <Card>
<CardContent>
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Upcoming Open Tours</h2>
            <Link href="/enrollee/tours">
              <Button variant="link" size="sm" className="h-auto p-0 flex items-center gap-1 text-xs text-accent font-medium hover:text-accent/90">
                Browse all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {unappliedTours.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--gs-muted)" }}>
              {(openTours ?? []).length === 0
                ? "No open tours at this time."
                : "You've applied to all open tours."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unappliedTours.map((tour: OpenTourRow) => (
                <Card key={tour.id}>
<CardContent>
                  <p className="font-medium text-sm mb-1" style={{ color: "var(--foreground)" }}>{tour.title}</p>
                  <p className="text-xs mb-3" style={{ color: "var(--gs-muted)" }}>
                    {tour.destination} · {formatDate(tour.start_date)}
                  </p>
                  <Link href={`/enrollee/tours/${tour.id}`} style={{ display: "block" }}>
                    <Button className="w-full">
                      Apply Now
                    </Button>
                  </Link>
                </CardContent>
</Card>
              ))}
            </div>
          )}
        </CardContent>
</Card>
      </div>
    </div>
  );
}
