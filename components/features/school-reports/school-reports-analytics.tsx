"use client";

import { useMemo, useState } from "react";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO } from "@/components/landing/theme";
import {
  fmt, count, sortBy, SectionEyebrow, SingleBar, DonutCard, LedgerStat, Ledger, bandSelectStyle,
} from "@/components/features/analytics/chart-kit";

const RATING_ORDER = ["Excellent", "Good", "Satisfactory", "Needs Improvement"];
const MONTH_FORMAT = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" });

interface SessionRow { num_students?: number }

export interface ReportForAnalytics {
  id: string;
  created_at: string;
  status: string;
  school_type?: string | null;
  location_category?: string | null;
  medium_of_instruction?: string | null;
  state?: string | null;
  overall_rating?: string | null;
  follow_up_required?: boolean | null;
  sessions?: SessionRow[] | null;
  submitted_by: string;
  group?: { tours?: { id: string; title: string } | null } | null;
}

export function SchoolReportsAnalytics({ reports }: { reports: ReportForAnalytics[] }) {
  const [tour, setTour] = useState("");
  const [status, setStatus] = useState("");
  const [state, setState] = useState("");

  const tours = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of reports) {
      const t = r.group?.tours;
      if (t?.id) m.set(t.id, t.title);
    }
    return sortBy([...m.entries()].map(([id, title]) => ({ id, title })), [], t => t.title);
  }, [reports]);
  const states = useMemo(() => [...new Set(reports.map(r => r.state).filter((s): s is string => !!s))].sort(), [reports]);

  const filtered = useMemo(() => reports.filter(r =>
    (!tour || r.group?.tours?.id === tour) &&
    (!status || r.status === status) &&
    (!state || r.state === state)
  ), [reports, tour, status, state]);

  const submittedCount = filtered.filter(r => r.status === "submitted").length;
  const draftCount = filtered.filter(r => r.status === "draft").length;
  const totalSessions = filtered.reduce((sum, r) => sum + (r.sessions?.length ?? 0), 0);
  const totalStudentsReached = filtered.reduce((sum, r) => sum + (r.sessions?.reduce((a, s) => a + (s.num_students ?? 0), 0) ?? 0), 0);
  const reportingVolunteers = useMemo(() => new Set(filtered.map(r => r.submitted_by)).size, [filtered]);
  const followUpCount = filtered.filter(r => r.follow_up_required).length;

  const byStatus = useMemo(() => count(filtered.map(r => r.status)), [filtered]);
  const bySchoolType = useMemo(() => count(filtered.map(r => r.school_type).filter((v): v is string => !!v)), [filtered]);
  const byLocation = useMemo(() => count(filtered.map(r => r.location_category).filter((v): v is string => !!v)), [filtered]);
  const byMedium = useMemo(() => count(filtered.map(r => r.medium_of_instruction).filter((v): v is string => !!v)), [filtered]);
  const byTour = useMemo(() => count(filtered.map(r => r.group?.tours?.title ?? "Unassigned")), [filtered]);
  const byRating = useMemo(
    () => sortBy(count(filtered.map(r => r.overall_rating).filter((v): v is string => !!v)), RATING_ORDER, r => r.name),
    [filtered]
  );
  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const key = MONTH_FORMAT.format(new Date(r.created_at));
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value, sortKey: new Date(name).getTime() || 0 }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ name, value }) => ({ name, value }));
  }, [filtered]);

  return (
    <div className={fontVars} style={{ ...pageVars, fontFamily: F_BODY }}>
      {/* Cover band — signature moment, shared visual language with the site's hero */}
      <div style={{ background: "var(--gs-ink)", borderRadius: 8, padding: "32px 36px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--gs-line-ink) 1px,transparent 1px),linear-gradient(90deg,var(--gs-line-ink) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} aria-hidden="true" />
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(184,73,46,.16) 0%,transparent 65%)", bottom: "-25%", left: "-8%", pointerEvents: "none" }} aria-hidden="true" />
        <div style={{ position: "relative" }}>
          <span style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: 15, letterSpacing: "0.02em", color: "var(--gs-marigold)", display: "block", marginBottom: 5 }}>
            Field Notes &middot; School Reports
          </span>
          <div style={{ height: 1, background: "linear-gradient(90deg, var(--gs-marigold), transparent 70%)", opacity: 0.6, marginBottom: 20 }} />

          <p style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: "clamp(40px, 6vw, 68px)", lineHeight: 1, color: "var(--gs-paper)", margin: "0 0 10px" }}>
            {fmt(reports.length)}
          </p>
          <p style={{ fontFamily: F_BODY, fontSize: 15, color: "rgba(251,247,236,.75)", margin: "0 0 24px", maxWidth: 520 }}>
            school visit reports filed by volunteers, across <strong style={{ color: "var(--gs-paper)" }}>{fmt(tours.length)} tours</strong>.
          </p>

          <div className="flex flex-wrap gap-2 items-center">
            <select value={tour} onChange={e => setTour(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All tours</option>
              {tours.map(t => <option key={t.id} value={t.id} style={{ color: "var(--gs-text)" }}>{t.title}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All statuses</option>
              <option value="submitted" style={{ color: "var(--gs-text)" }}>Submitted</option>
              <option value="draft" style={{ color: "var(--gs-text)" }}>Draft</option>
            </select>
            <select value={state} onChange={e => setState(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All states</option>
              {states.map(s => <option key={s} value={s} style={{ color: "var(--gs-text)" }}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <SectionEyebrow>Filtered summary</SectionEyebrow>
      <Ledger>
        <LedgerStat label="Reports" value={fmt(filtered.length)} first />
        <LedgerStat label="Submitted" value={fmt(submittedCount)} />
        <LedgerStat label="Draft" value={fmt(draftCount)} />
        <LedgerStat label="Sessions" value={fmt(totalSessions)} />
        <LedgerStat label="Students reached" value={fmt(totalStudentsReached)} />
        <LedgerStat label="Reporting volunteers" value={fmt(reportingVolunteers)} />
      </Ledger>
      <p style={{ fontFamily: F_MONO, fontSize: 11, color: "var(--gs-text-mute)", margin: "8px 0 24px" }}>
        {followUpCount > 0
          ? `${fmt(followUpCount)} report${followUpCount === 1 ? "" : "s"} flagged for follow-up.`
          : "No reports currently flagged for follow-up."}
      </p>

      <div className="mb-8">
        <SectionEyebrow>Report breakdown</SectionEyebrow>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutCard title="Reports by status" data={byStatus} />
          <SingleBar title="Reports by tour" data={byTour} />
          <DonutCard title="Schools by type" data={bySchoolType} />
          <DonutCard title="Schools by location" data={byLocation} />
          <DonutCard title="Medium of instruction" data={byMedium} />
          <SingleBar title="Overall rating" data={byRating} />
        </div>
      </div>

      <div>
        <SectionEyebrow>Reports over time</SectionEyebrow>
        <div className="grid grid-cols-1 gap-4">
          <SingleBar title="Reports filed by month" data={byMonth} />
        </div>
      </div>
    </div>
  );
}
