"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Bar, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";
import { STANDARDS } from "@/lib/constants/earc";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO } from "@/components/landing/theme";
import {
  CHART_SPECTRUM, tooltipStyle, legendStyle, gridProps, axisTick, axisTickMono,
  fmt, count, sortBy, SectionEyebrow, ChartCard, SingleBar, DonutCard, LedgerStat, Ledger, bandSelectStyle,
} from "@/components/features/analytics/chart-kit";

const MODULE_ORDER = ["Teacher Training", "Facilitator"];

interface StrengthRow { standard: string; boys: number; girls: number }
interface SchoolProfileRow {
  id: string;
  academic_year: string;
  project: string;
  state: string;
  district: string;
  taluka_block: string;
  school_type: string;
  location_type: string;
  medium_of_instruction: string;
  module: string;
  mode: string;
  student_strength: StrengthRow[];
  num_teachers_involved: number;
  num_sessions_conducted: number;
  total_input_hours?: number | null;
  total_students?: number | null;
}
interface StudentProfileRow {
  id: string;
  gender: string;
  blood_group?: string | null;
}

export function EarcAnalytics({
  schoolProfiles, studentProfiles,
}: {
  schoolProfiles: SchoolProfileRow[];
  studentProfiles: StudentProfileRow[];
}) {
  const [academicYear, setAcademicYear] = useState("");
  const [project, setProject] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [presenting, setPresenting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setPresenting(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPresenting(false);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function enterPresent() {
    setPresenting(true);
    try { await containerRef.current?.requestFullscreen(); } catch { /* fullscreen denied — overlay still hides chrome */ }
  }
  function exitPresent() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setPresenting(false);
  }

  const years = useMemo(() => [...new Set(schoolProfiles.map(s => s.academic_year))].sort(), [schoolProfiles]);
  const projects = useMemo(() => [...new Set(schoolProfiles.map(s => s.project))].sort(), [schoolProfiles]);
  const modules = useMemo(() => [...new Set(schoolProfiles.map(s => s.module))].sort(), [schoolProfiles]);

  // Geography cascades — each level's options are scoped by the facets and
  // geo-levels above it, so District only ever lists districts that actually
  // exist within the selected State (and so on down to Block).
  const upperMatch = useMemo(() => (s: SchoolProfileRow) =>
    (!academicYear || s.academic_year === academicYear) &&
    (!project || s.project === project) &&
    (!moduleFilter || s.module === moduleFilter),
  [academicYear, project, moduleFilter]);

  const states = useMemo(() => [...new Set(schoolProfiles.filter(upperMatch).map(s => s.state))].sort(),
    [schoolProfiles, upperMatch]);
  const districts = useMemo(() => [...new Set(schoolProfiles.filter(s => upperMatch(s) && (!state || s.state === state)).map(s => s.district))].sort(),
    [schoolProfiles, upperMatch, state]);
  const blocks = useMemo(() => [...new Set(schoolProfiles.filter(s => upperMatch(s) && (!state || s.state === state) && (!district || s.district === district)).map(s => s.taluka_block))].sort(),
    [schoolProfiles, upperMatch, state, district]);

  function onStateChange(v: string) { setState(v); setDistrict(""); setBlock(""); }
  function onDistrictChange(v: string) { setDistrict(v); setBlock(""); }

  const filtered = useMemo(() => schoolProfiles.filter(s =>
    upperMatch(s) &&
    (!state || s.state === state) &&
    (!district || s.district === district) &&
    (!block || s.taluka_block === block)
  ), [schoolProfiles, upperMatch, state, district, block]);

  const totalStudents = filtered.reduce((sum, s) => sum + s.student_strength.reduce((a, r) => a + r.boys + r.girls, 0), 0);
  const totalSessions = filtered.reduce((sum, s) => sum + s.num_sessions_conducted, 0);
  const totalHours = filtered.reduce((sum, s) => sum + (s.total_input_hours ?? 0), 0);
  const totalTeachers = filtered.reduce((sum, s) => sum + s.num_teachers_involved, 0);

  const allTimeStudents = schoolProfiles.reduce((sum, s) => sum + s.student_strength.reduce((a, r) => a + r.boys + r.girls, 0), 0);
  const allTimeSchools = schoolProfiles.length;
  const allTimeStates = useMemo(() => new Set(schoolProfiles.map(s => s.state)).size, [schoolProfiles]);
  const allTimeDistricts = useMemo(() => new Set(schoolProfiles.map(s => s.district)).size, [schoolProfiles]);
  const allTimeBlocks = useMemo(() => new Set(schoolProfiles.map(s => s.taluka_block)).size, [schoolProfiles]);

  const studentsByStandard = useMemo(() => {
    const m = new Map<string, { boys: number; girls: number }>();
    for (const s of filtered) {
      for (const row of s.student_strength) {
        const cur = m.get(row.standard) ?? { boys: 0, girls: 0 };
        m.set(row.standard, { boys: cur.boys + row.boys, girls: cur.girls + row.girls });
      }
    }
    const rows = [...m.entries()].map(([standard, v]) => ({ name: standard, boys: v.boys, girls: v.girls }));
    return sortBy(rows, STANDARDS, r => r.name);
  }, [filtered]);

  // Flagship breakdown: students reached per module, split by standard —
  // stacked (not grouped) to keep reading as "total per module" at a glance.
  const studentsByModule = useMemo(() => {
    const perModule = new Map<string, Map<string, number>>();
    for (const s of filtered) {
      const inner = perModule.get(s.module) ?? new Map<string, number>();
      for (const row of s.student_strength) inner.set(row.standard, (inner.get(row.standard) ?? 0) + row.boys + row.girls);
      perModule.set(s.module, inner);
    }
    const standardsPresent = sortBy([...new Set(filtered.flatMap(s => s.student_strength.map(r => r.standard)))], STANDARDS, x => x);
    const rows = sortBy(
      [...perModule.entries()].map(([name, inner]) => {
        const row: Record<string, string | number> = { name };
        for (const std of standardsPresent) row[std] = inner.get(std) ?? 0;
        return row;
      }),
      MODULE_ORDER, r => r.name as string
    );
    return { rows, standards: standardsPresent };
  }, [filtered]);

  const schoolsByState = useMemo(() => count(filtered.map(s => s.state)), [filtered]);
  const schoolsByProject = useMemo(() => count(filtered.map(s => s.project)), [filtered]);
  const schoolsByType = useMemo(() => count(filtered.map(s => s.school_type)), [filtered]);
  const schoolsByLocation = useMemo(() => count(filtered.map(s => s.location_type)), [filtered]);
  const schoolsByMedium = useMemo(() => count(filtered.map(s => s.medium_of_instruction)), [filtered]);
  const schoolsByMode = useMemo(() => count(filtered.map(s => s.mode)), [filtered]);

  // Two metrics, two very different scales (dozens of sessions vs. hundreds of
  // students) — a dual-axis line+area reads their trends together where a bar
  // chart forced onto one axis would flatten the smaller series to nothing.
  const activityByYear = useMemo(() => {
    const m = new Map<string, { sessions: number; students: number }>();
    for (const s of filtered) {
      const cur = m.get(s.academic_year) ?? { sessions: 0, students: 0 };
      cur.sessions += s.num_sessions_conducted;
      cur.students += s.student_strength.reduce((a, r) => a + r.boys + r.girls, 0);
      m.set(s.academic_year, cur);
    }
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const genderDistribution = useMemo(() => count(studentProfiles.map(s => s.gender)), [studentProfiles]);
  const bloodGroupDistribution = useMemo(
    () => count(studentProfiles.map(s => s.blood_group || "Not provided")),
    [studentProfiles]
  );

  const generatedAt = useMemo(() => new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }), []);

  return (
    <div
      ref={containerRef}
      className={fontVars}
      style={{
        ...pageVars, fontFamily: F_BODY,
        ...(presenting ? { position: "fixed", inset: 0, zIndex: 100, background: "var(--gs-paper-deep)", overflowY: "auto", padding: "28px 32px 48px" } : {}),
      }}
    >
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={presenting ? exitPresent : enterPresent}
          className="flex items-center gap-1.5"
          style={{ fontFamily: F_BODY, fontSize: 12, fontWeight: 600, color: "var(--gs-text-soft)", background: "var(--gs-paper)", border: "1px solid var(--gs-line)", padding: "7px 14px", borderRadius: 4, cursor: "pointer" }}
        >
          {presenting ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {presenting ? "Exit presentation" : "Present"}
        </button>
      </div>

      {/* Cover band — signature moment, shared visual language with the site's hero */}
      <div style={{ background: "var(--gs-ink)", borderRadius: 8, padding: "32px 36px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--gs-line-ink) 1px,transparent 1px),linear-gradient(90deg,var(--gs-line-ink) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} aria-hidden="true" />
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,163,61,.14) 0%,transparent 65%)", top: "-20%", right: "-8%", pointerEvents: "none" }} aria-hidden="true" />
        <div style={{ position: "relative" }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
            <span style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: 15, letterSpacing: "0.02em", color: "var(--gs-marigold)" }}>
              EARC &middot; Impact Report
            </span>
            <span style={{ fontFamily: F_MONO, fontSize: 11, color: "rgba(251,247,236,.5)" }}>as of {generatedAt}</span>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, var(--gs-marigold), transparent 70%)", opacity: 0.6, marginBottom: 20 }} />

          <p style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: "clamp(40px, 6vw, 68px)", lineHeight: 1, color: "var(--gs-paper)", margin: "0 0 10px" }}>
            {fmt(allTimeStudents)}
          </p>
          <p style={{ fontFamily: F_BODY, fontSize: 15, color: "rgba(251,247,236,.75)", margin: "0 0 24px", maxWidth: 480 }}>
            students reached across <strong style={{ color: "var(--gs-paper)" }}>{fmt(allTimeSchools)} schools</strong>, cumulative across all programme years.
          </p>

          <div className="flex flex-wrap gap-2 items-center">
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All academic years</option>
              {years.map(y => <option key={y} value={y} style={{ color: "var(--gs-text)" }}>{y}</option>)}
            </select>
            <select value={project} onChange={e => setProject(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All projects</option>
              {projects.map(p => <option key={p} value={p} style={{ color: "var(--gs-text)" }}>{p}</option>)}
            </select>
            <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All modules</option>
              {modules.map(m => <option key={m} value={m} style={{ color: "var(--gs-text)" }}>{m}</option>)}
            </select>
            <select value={state} onChange={e => onStateChange(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All states</option>
              {states.map(s => <option key={s} value={s} style={{ color: "var(--gs-text)" }}>{s}</option>)}
            </select>
            <select value={district} onChange={e => onDistrictChange(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All districts</option>
              {districts.map(d => <option key={d} value={d} style={{ color: "var(--gs-text)" }}>{d}</option>)}
            </select>
            <select value={block} onChange={e => setBlock(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: "var(--gs-text)" }}>All blocks</option>
              {blocks.map(b => <option key={b} value={b} style={{ color: "var(--gs-text)" }}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      <SectionEyebrow>Programme coverage &middot; all years, all projects</SectionEyebrow>
      <Ledger>
        <LedgerStat label="States" value={fmt(allTimeStates)} first />
        <LedgerStat label="Districts" value={fmt(allTimeDistricts)} />
        <LedgerStat label="Blocks" value={fmt(allTimeBlocks)} />
        <LedgerStat label="Schools" value={fmt(allTimeSchools)} />
      </Ledger>

      <div className="mt-6" />
      <SectionEyebrow>Filtered summary</SectionEyebrow>
      <Ledger>
        <LedgerStat label="Schools" value={fmt(filtered.length)} first />
        <LedgerStat label="Students" value={fmt(totalStudents)} />
        <LedgerStat label="Sessions" value={fmt(totalSessions)} />
        <LedgerStat label="Input hours" value={fmt(totalHours)} />
        <LedgerStat label="Teachers" value={fmt(totalTeachers)} />
      </Ledger>
      <p style={{ fontFamily: F_BODY, fontSize: 11, color: "var(--gs-text-mute)", margin: "8px 0 24px" }}>
        Filters scope school-reported figures above and the charts below. Individual student records carry no school link, so gender and blood-group figures reflect all records.
      </p>

      <div className="mb-8">
        <SectionEyebrow>Programme reach</SectionEyebrow>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Students by module (by standard)"
            data={studentsByModule.rows}
            tableColumns={[{ key: "name", label: "Module" }, ...studentsByModule.standards.map(s => ({ key: s, label: s }))]}
          >
            <BarChart data={studentsByModule.rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} {...gridProps} />
              <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: "var(--gs-line)" }} tickLine={false} />
              <YAxis tick={axisTickMono} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--gs-paper-deep)", opacity: 0.6 }} />
              <Legend wrapperStyle={legendStyle} />
              {studentsByModule.standards.map((std, i) => (
                <Bar
                  key={std} dataKey={std} stackId="m" name={std} fill={CHART_SPECTRUM[i % CHART_SPECTRUM.length]} maxBarSize={72}
                  radius={i === studentsByModule.standards.length - 1 ? [3, 3, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ChartCard>

          <ChartCard
            title="Student strength by standard (boys vs girls)"
            data={studentsByStandard}
            tableColumns={[{ key: "name", label: "Standard" }, { key: "boys", label: "Boys" }, { key: "girls", label: "Girls" }]}
          >
            <BarChart data={studentsByStandard} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} {...gridProps} />
              <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: "var(--gs-line)" }} tickLine={false} />
              <YAxis tick={axisTickMono} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--gs-paper-deep)", opacity: 0.6 }} />
              <Legend wrapperStyle={legendStyle} />
              {/* ponytail: recharts stacked bars render segments flush; skipping the 2px inter-segment gap spec, low visual cost at this scale */}
              <Bar dataKey="boys" stackId="s" name="Boys" fill="var(--gs-marigold)" maxBarSize={24} />
              <Bar dataKey="girls" stackId="s" name="Girls" fill="var(--gs-rust)" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ChartCard>

          <DonutCard title="Schools by state" data={schoolsByState} />
          <SingleBar title="Schools by project" data={schoolsByProject} />
          <DonutCard title="Schools by type" data={schoolsByType} />
          <SingleBar title="Schools by location type" data={schoolsByLocation} />
          <DonutCard title="Schools by medium of instruction" data={schoolsByMedium} />
          <SingleBar title="Schools by mode" data={schoolsByMode} />
        </div>
      </div>

      <div className="mb-8">
        <SectionEyebrow>Programme activity</SectionEyebrow>
        <div className="grid grid-cols-1 gap-4">
          <ChartCard
            title="Sessions & students reached by academic year"
            data={activityByYear}
            tableColumns={[{ key: "name", label: "Year" }, { key: "sessions", label: "Sessions" }, { key: "students", label: "Students" }]}
          >
            <ComposedChart data={activityByYear} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} {...gridProps} />
              <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: "var(--gs-line)" }} tickLine={false} />
              <YAxis yAxisId="sessions" tick={axisTickMono} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="students" orientation="right" tick={axisTickMono} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--gs-paper-deep)", opacity: 0.6 }} />
              <Legend wrapperStyle={legendStyle} />
              <Area yAxisId="students" type="monotone" dataKey="students" name="Students reached" fill="var(--gs-marigold)" fillOpacity={0.18} stroke="var(--gs-marigold)" strokeWidth={2} />
              <Line yAxisId="sessions" type="monotone" dataKey="sessions" name="Sessions conducted" stroke="var(--gs-rust)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--gs-rust)" }} />
            </ComposedChart>
          </ChartCard>
        </div>
      </div>

      <div>
        <SectionEyebrow>Student demographics</SectionEyebrow>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutCard title="Gender distribution" data={genderDistribution} />
          <SingleBar title="Blood group distribution" data={bloodGroupDistribution} />
        </div>
      </div>
    </div>
  );
}
