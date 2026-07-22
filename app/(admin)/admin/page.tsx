import { createServerClient } from "@/lib/supabase/server";
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/client";
import { StatCard } from "@/components/features/dashboard/stat-card";
import Link from "next/link";
import type { DashboardStats, Tour } from "@/types";
import { Plane, Users, UserCheck, ClipboardList, Clock, ArrowRight } from "lucide-react";

async function getStats(): Promise<DashboardStats> {
  const cached = await getCached<DashboardStats>(CACHE_KEYS.dashboardStats);
  if (cached) return cached;

  const db = createServerClient();

  const [tours, enrollmentUsers, volunteers, applications, tests] = await Promise.all([
    db.from("tours").select("id, status"),
    db.from("users").select("id").is("role", null),
    db.from("users").select("id").eq("role", "volunteer"),
    db.from("tour_applications").select("id, status").eq("status", "pending"),
    db.from("test_attempts").select("id").eq("status", "pending_approval"),
  ]);

  const stats: DashboardStats = {
    total_tours: tours.data?.length ?? 0,
    active_tours: tours.data?.filter((t) => t.status === "open").length ?? 0,
    total_enrollees: enrollmentUsers.data?.length ?? 0,
    total_volunteers: volunteers.data?.length ?? 0,
    pending_applications: applications.data?.length ?? 0,
    completed_tests: tests.data?.length ?? 0,  // count of pending_approval attempts
  };

  await setCached(CACHE_KEYS.dashboardStats, stats, CACHE_TTL.medium);
  return stats;
}

async function getActiveTours(): Promise<Tour[]> {
  const cached = await getCached<Tour[]>(CACHE_KEYS.activeTours);
  if (cached) return cached;

  const db = createServerClient();
  const { data } = await db
    .from("tours")
    .select("*")
    .eq("status", "open")
    .order("start_date", { ascending: true })
    .limit(6);

  const tours = (data ?? []) as Tour[];
  await setCached(CACHE_KEYS.activeTours, tours, CACHE_TTL.medium);
  return tours;
}

interface RecentApplication {
  id: string;
  users?: { name: string; email: string };
  tours?: { title: string };
}

async function getRecentApplications(): Promise<RecentApplication[]> {
  const db = createServerClient();
  const { data } = await db
    .from("tour_applications")
    .select("*, users(name, email), tours(title)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

const appStatusStyles: Record<string, { color: string; background: string }> = {
  pending:     { color: "#F5A520", background: "rgba(245,165,32,0.08)" },
  shortlisted: { color: "#4A55BE", background: "rgba(74,85,190,0.08)" },
  selected:    { color: "#2A5E3A", background: "rgba(42,94,58,0.08)" },
  rejected:    { color: "#B8381E", background: "rgba(184,56,30,0.08)" },
};

export default async function AdminDashboard() {
  const [stats, activeTours, recentApplications] = await Promise.all([
    getStats(),
    getActiveTours(),
    getRecentApplications(),
  ]);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Platform Overview</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Real-time summary of all platform activity
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Tours"
            value={stats.total_tours}
            icon={<Plane size={18} />}
            accent="indigo"
            href="/admin/tours"
          />
          <StatCard
            label="Active Tours"
            value={stats.active_tours}
            sub="currently open"
            icon={<Plane size={18} />}
            accent="sky"
            href="/admin/tours"
          />
          <StatCard
            label="Enrolled Users"
            value={stats.total_enrollees}
            icon={<UserCheck size={18} />}
            accent="sky"
            href="/admin/students"
          />
          <StatCard
            label="Volunteers"
            value={stats.total_volunteers}
            icon={<Users size={18} />}
            accent="emerald"
            href="/admin/volunteers"
          />
          <StatCard
            label="Pending Reviews"
            value={stats.pending_applications}
            sub="awaiting admin"
            icon={<Clock size={18} />}
            accent="amber"
            href="/admin/students"
          />
          <StatCard
            label="Awaiting Approval"
            value={stats.completed_tests}
            sub="test results"
            icon={<ClipboardList size={18} />}
            accent="amber"
            href="/admin/tests"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Tours */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>Active Tours</h2>
              <Link href="/admin/tours">
                <button
                  className="flex items-center gap-1"
                  style={{ fontSize: 12, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                >
                  Manage <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {activeTours.length === 0 ? (
              <p style={{ fontSize: 14, color: "#9B9188", textAlign: "center", padding: "24px 0" }}>
                No active tours.
              </p>
            ) : (
              <div className="space-y-2">
                {activeTours.map((tour) => (
                  <div
                    key={tour.id}
                    className="flex items-center justify-between"
                    style={{ background: "#F3F0E8", borderRadius: 8, padding: "10px 12px" }}
                  >
                    <div className="min-w-0">
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#19140F" }} className="truncate">{tour.title}</p>
                      <p style={{ fontSize: 12, color: "#9B9188", marginTop: 2 }}>
                        {tour.destination} &middot; {new Date(tour.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 ml-3"
                      style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#2A5E3A", background: "rgba(42,94,58,0.08)" }}
                    >
                      Open
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Applications */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>Pending Applications</h2>
              <Link href="/admin/students">
                <button
                  className="flex items-center gap-1"
                  style={{ fontSize: 12, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                >
                  Review <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <p style={{ fontSize: 14, color: "#9B9188", textAlign: "center", padding: "24px 0" }}>
                No pending applications.
              </p>
            ) : (
              <div className="space-y-2">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between"
                    style={{ background: "#F3F0E8", borderRadius: 8, padding: "10px 12px" }}
                  >
                    <div className="min-w-0">
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#19140F" }} className="truncate">
                        {app.users?.name ?? "Unknown"}
                      </p>
                      <p style={{ fontSize: 12, color: "#9B9188", marginTop: 2 }}>
                        {app.tours?.title ?? "-"}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 ml-3"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: appStatusStyles.pending.color,
                        background: appStatusStyles.pending.background,
                      }}
                    >
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
