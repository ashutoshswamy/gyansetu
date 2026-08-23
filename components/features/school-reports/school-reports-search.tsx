"use client";

import { useMemo, useState } from "react";
import { Search, School } from "lucide-react";
import { VolunteerReportRow, type SchoolReportRow } from "@/components/features/school-reports/volunteer-report-row";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Member {
  id: string;
  name: string;
  email?: string;
  reports: SchoolReportRow[];
}

interface Group {
  id: string;
  name: string;
  members: Member[];
}

interface Tour {
  title: string;
  groups: Group[];
}

function matches(query: string, tourTitle: string, group: Group, member: Member) {
  const haystack = [
    tourTitle,
    group.name,
    member.name,
    member.email,
    ...member.reports.flatMap(r => [r.school_name, r.village_town, r.taluka_tehsil, r.district, r.state]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function SchoolReportsSearch({ byTour }: { byTour: Record<string, Tour> }) {
  const [query, setQuery] = useState("");

  const filteredByTour = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byTour;

    const result: Record<string, Tour> = {};
    for (const [tourId, tour] of Object.entries(byTour)) {
      const groups = tour.groups
        .map(group => ({ ...group, members: group.members.filter(m => matches(q, tour.title, group, m)) }))
        .filter(group => group.members.length > 0);
      if (groups.length > 0) result[tourId] = { title: tour.title, groups };
    }
    return result;
  }, [byTour, query]);

  const entries = Object.entries(filteredByTour);

  return (
    <>
      <div className="relative mb-6">
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gs-muted)" }} />
        <Input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by school, volunteer, location, tour, or group..."
          className="pl-9"
        />
      </div>

      {query.trim() && entries.length === 0 && (
        <Card>
<CardContent className="text-center">
          <School className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
          <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No reports match &quot;{query}&quot;.</p>
        </CardContent>
</Card>
      )}

      {entries.map(([tourId, tour]) => (
        <div key={tourId} className="mb-10">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginBottom: 14, paddingBottom: 8, borderBottom: "1.5px solid var(--border)" }}>
            {tour.title}
          </h2>
          {tour.groups.map(group => (
            <div key={group.id} className="mb-6">
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--gs-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {group.name} ({group.members.length} volunteer{group.members.length === 1 ? "" : "s"})
              </h3>
              {group.members.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No volunteers assigned to this group.</p>
              ) : (
                <div className="space-y-2">
                  {group.members.map(m => (
                    <VolunteerReportRow key={m.id} name={m.name} email={m.email} reports={m.reports} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
