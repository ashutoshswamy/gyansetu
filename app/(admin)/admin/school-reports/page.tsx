import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getAllSchoolReports } from "@/actions/school-reports";
import { School, LayoutDashboard } from "lucide-react";
import { type SchoolReportRow } from "@/components/features/school-reports/volunteer-report-row";
import { SchoolReportsSearch } from "@/components/features/school-reports/school-reports-search";
import { Card, CardContent } from "@/components/ui/card";

interface GroupMemberRow {
  user_id: string;
  users?: { id: string; name: string; email: string } | null;
}

interface GroupRow {
  id: string;
  name: string;
  tour_id: string;
  tours?: { id: string; title: string } | null;
  tour_group_members?: GroupMemberRow[];
}

interface RawReportRow extends SchoolReportRow {
  group?: { id: string; tour_id: string } | null;
  submitted_by: string;
  submitter?: { id: string; name: string; email?: string } | null;
}

export default async function AdminSchoolReportsPage() {
  const db = createServerClient();

  const [{ data: groupRows }, reports] = await Promise.all([
    db
      .from("tour_groups")
      .select("id, name, tour_id, tours(id, title), tour_group_members(user_id, users(id, name, email))")
      .order("created_at", { ascending: false }),
    getAllSchoolReports() as unknown as Promise<RawReportRow[]>,
  ]);

  const groups = (groupRows ?? []) as unknown as GroupRow[];

  // reports keyed by `${group_id}:${submitted_by}`
  const reportsByMember: Record<string, SchoolReportRow[]> = {};
  for (const r of reports) {
    const key = `${r.group?.id ?? "unassigned"}:${r.submitted_by}`;
    if (!reportsByMember[key]) reportsByMember[key] = [];
    reportsByMember[key].push(r);
  }

  const byTour: Record<string, { title: string; groups: { id: string; name: string; members: { id: string; name: string; email?: string; reports: SchoolReportRow[] }[] }[] }> = {};

  for (const g of groups) {
    const tourKey = g.tour_id ?? "unassigned";
    const tourTitle = g.tours?.title ?? "Unassigned Tour";
    if (!byTour[tourKey]) byTour[tourKey] = { title: tourTitle, groups: [] };

    const memberIds = new Set<string>();
    const members: { id: string; name: string; email?: string; reports: SchoolReportRow[] }[] = (g.tour_group_members ?? [])
      .filter(m => m.users)
      .map(m => {
        memberIds.add(m.user_id);
        return {
          id: m.user_id,
          name: m.users!.name,
          email: m.users!.email,
          reports: reportsByMember[`${g.id}:${m.user_id}`] ?? [],
        };
      });

    // Reports from someone who submitted for this group but is no longer a listed member
    for (const r of reports) {
      if (r.group?.id !== g.id || memberIds.has(r.submitted_by)) continue;
      memberIds.add(r.submitted_by);
      members.push({
        id: r.submitted_by,
        name: r.submitter?.name ?? "Unknown volunteer",
        email: r.submitter?.email,
        reports: reportsByMember[`${g.id}:${r.submitted_by}`] ?? [],
      });
    }

    byTour[tourKey].groups.push({ id: g.id, name: g.name, members });
  }

  const totalReports = reports.length;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>School Reports</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{totalReports} school visit reports</p>
          </div>
          <Link
            href="/admin/school-reports/dashboard"
            className="flex items-center gap-1.5"
            style={{ fontSize: 13, fontWeight: 600, color: "white", background: "var(--foreground)", padding: "9px 16px", borderRadius: 6, textDecoration: "none" }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
        </div>

        {groups.length === 0 ? (
          <Card>
<CardContent>
            <School className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No groups yet.</p>
          </CardContent>
</Card>
        ) : (
          <SchoolReportsSearch byTour={byTour} />
        )}
      </div>
    </div>
  );
}
