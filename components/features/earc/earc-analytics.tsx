"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";
import { STANDARDS } from "@/lib/constants/earc";

const BLUE = "#2a78d6";
const ORANGE = "#eb6834";
const GRID = "#E4DFD1";
const TICK = "#9B9188";

const INK = "#19140F";
const INK_SOFT = "#5A5247";
const MUTED = "#9B9188";
const LINE = "#E4DFD1";
const PAPER = "#FAFAF7";
const BRAND = "#2A5E3A";
const BRAND_DEEP = "#122E1B";
const GOLD = "#C29A4C";

const serif = "var(--font-cormorant), Georgia, serif";
const sans = "var(--font-poppins), sans-serif";
const mono = "var(--font-geist-mono), monospace";

interface StrengthRow { standard: string; boys: number; girls: number }
interface SchoolProfileRow {
  id: string;
  academic_year: string;
  project: string;
  district: string;
  school_type: string;
  location_type: string;
  medium_of_instruction: string;
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

function count(rows: string[]): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r, (m.get(r) ?? 0) + 1);
  return [...m.entries()].map(([name, value]) => ({ name, value }));
}

function sortBy<T>(rows: T[], order: readonly string[], key: (r: T) => string): T[] {
  return [...rows].sort((a, b) => {
    const ia = order.indexOf(key(a)); const ib = order.indexOf(key(b));
    if (ia === -1 && ib === -1) return key(a).localeCompare(key(b));
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

const tooltipStyle = { background: "white", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 12, color: INK, fontFamily: sans };

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ width: 18, height: 2, background: GOLD, display: "inline-block" }} />
      <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: INK_SOFT }}>
        {children}
      </span>
    </div>
  );
}

function ChartCard({
  title, data, children, tableColumns,
}: {
  title: string;
  data: Record<string, string | number>[];
  children: React.ReactNode;
  tableColumns: { key: string; label: string }[];
}) {
  return (
    <div style={{ background: "white", border: `1px solid ${LINE}`, borderRadius: 12, padding: "16px 16px 8px" }}>
      <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: INK, margin: "0 0 12px" }}>{title}</p>
      {data.length === 0 ? (
        <p style={{ fontFamily: sans, fontSize: 12, color: MUTED, padding: "24px 0", textAlign: "center" }}>No data yet.</p>
      ) : (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
      {data.length > 0 && (
        <details style={{ margin: "8px 0 4px" }}>
          <summary style={{ fontFamily: sans, fontSize: 11, color: MUTED, cursor: "pointer" }}>View as table</summary>
          <table style={{ width: "100%", fontFamily: mono, fontSize: 12, marginTop: 8, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                {tableColumns.map(c => <th key={c.key} className="text-left p-1" style={{ color: INK_SOFT, fontWeight: 500 }}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F3F0E8" }}>
                  {tableColumns.map(c => <td key={c.key} className="p-1" style={{ color: INK }}>{row[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

function SingleBar({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <ChartCard title={title} data={data} tableColumns={[{ key: "name", label: "Category" }, { key: "value", label: "Count" }]}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="name" tick={{ fill: TICK, fontSize: 11, fontFamily: sans }} axisLine={{ stroke: GRID }} tickLine={false} interval={0} angle={data.length > 6 ? -30 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 50 : 24} />
        <YAxis tick={{ fill: TICK, fontSize: 11, fontFamily: mono }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F3F0E8" }} />
        <Bar dataKey="value" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ChartCard>
  );
}

function LedgerStat({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <div className="flex-1 min-w-[120px]" style={{ padding: "14px 20px", borderLeft: first ? "none" : `1px solid ${LINE}` }}>
      <p style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: INK, margin: 0 }}>{value}</p>
    </div>
  );
}

const bandSelectStyle: React.CSSProperties = {
  fontFamily: sans, fontSize: 12.5, padding: "7px 12px", borderRadius: 6,
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.24)",
  color: "#F4F1E8", outline: "none",
};

export function EarcAnalytics({
  schoolProfiles, studentProfiles,
}: {
  schoolProfiles: SchoolProfileRow[];
  studentProfiles: StudentProfileRow[];
}) {
  const [academicYear, setAcademicYear] = useState("");
  const [project, setProject] = useState("");
  const [district, setDistrict] = useState("");
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
  const districts = useMemo(() => [...new Set(schoolProfiles.map(s => s.district))].sort(), [schoolProfiles]);

  const filtered = useMemo(() => schoolProfiles.filter(s =>
    (!academicYear || s.academic_year === academicYear) &&
    (!project || s.project === project) &&
    (!district || s.district === district)
  ), [schoolProfiles, academicYear, project, district]);

  const totalStudents = filtered.reduce((sum, s) => sum + s.student_strength.reduce((a, r) => a + r.boys + r.girls, 0), 0);
  const totalSessions = filtered.reduce((sum, s) => sum + s.num_sessions_conducted, 0);
  const totalHours = filtered.reduce((sum, s) => sum + (s.total_input_hours ?? 0), 0);
  const totalTeachers = filtered.reduce((sum, s) => sum + s.num_teachers_involved, 0);

  const allTimeStudents = schoolProfiles.reduce((sum, s) => sum + s.student_strength.reduce((a, r) => a + r.boys + r.girls, 0), 0);
  const allTimeSchools = schoolProfiles.length;

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

  const schoolsByProject = useMemo(() => count(filtered.map(s => s.project)), [filtered]);
  const schoolsByType = useMemo(() => count(filtered.map(s => s.school_type)), [filtered]);
  const schoolsByLocation = useMemo(() => count(filtered.map(s => s.location_type)), [filtered]);
  const schoolsByMedium = useMemo(() => count(filtered.map(s => s.medium_of_instruction)), [filtered]);

  const sessionsByYear = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of filtered) m.set(s.academic_year, (m.get(s.academic_year) ?? 0) + s.num_sessions_conducted);
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
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
      style={presenting ? { position: "fixed", inset: 0, zIndex: 100, background: PAPER, overflowY: "auto", padding: "28px 32px 48px" } : undefined}
    >
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={presenting ? exitPresent : enterPresent}
          className="flex items-center gap-1.5"
          style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: INK_SOFT, background: "white", border: `1px solid ${LINE}`, padding: "7px 14px", borderRadius: 6, cursor: "pointer" }}
        >
          {presenting ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {presenting ? "Exit presentation" : "Present"}
        </button>
      </div>

      {/* Cover band — signature moment */}
      <div style={{ background: BRAND_DEEP, borderRadius: 14, padding: "32px 36px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top right, ${BRAND} 0%, transparent 55%)`, opacity: 0.35, pointerEvents: "none" }} aria-hidden="true" />
        <div style={{ position: "relative" }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
            <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 15, letterSpacing: "0.06em", color: GOLD }}>
              EARC &middot; Impact Report
            </span>
            <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(244,241,232,0.55)" }}>as of {generatedAt}</span>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent 70%)`, opacity: 0.5, marginBottom: 20 }} />

          <p style={{ fontFamily: sans, fontWeight: 800, fontSize: "clamp(40px, 6vw, 68px)", lineHeight: 1, color: "#FFFFFF", margin: "0 0 10px" }}>
            {fmt(allTimeStudents)}
          </p>
          <p style={{ fontFamily: sans, fontSize: 15, color: "rgba(244,241,232,0.75)", margin: "0 0 24px", maxWidth: 480 }}>
            students reached across <strong style={{ color: "#F4F1E8" }}>{fmt(allTimeSchools)} schools</strong>, cumulative across all programme years.
          </p>

          <div className="flex flex-wrap gap-2 items-center">
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: INK }}>All academic years</option>
              {years.map(y => <option key={y} value={y} style={{ color: INK }}>{y}</option>)}
            </select>
            <select value={project} onChange={e => setProject(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: INK }}>All projects</option>
              {projects.map(p => <option key={p} value={p} style={{ color: INK }}>{p}</option>)}
            </select>
            <select value={district} onChange={e => setDistrict(e.target.value)} style={bandSelectStyle}>
              <option value="" style={{ color: INK }}>All districts</option>
              {districts.map(d => <option key={d} value={d} style={{ color: INK }}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <SectionEyebrow>Filtered summary</SectionEyebrow>
      <div className="flex flex-wrap mb-3" style={{ background: "white", border: `1px solid ${LINE}`, borderRadius: 12 }}>
        <LedgerStat label="Schools" value={fmt(filtered.length)} first />
        <LedgerStat label="Students" value={fmt(totalStudents)} />
        <LedgerStat label="Sessions" value={fmt(totalSessions)} />
        <LedgerStat label="Input hours" value={fmt(totalHours)} />
        <LedgerStat label="Teachers" value={fmt(totalTeachers)} />
      </div>
      <p style={{ fontFamily: sans, fontSize: 11, color: MUTED, margin: "0 0 24px" }}>
        Filters scope school-reported figures above and the charts below. Individual student records carry no school link, so gender and blood-group figures reflect all records.
      </p>

      <div className="mb-8">
        <SectionEyebrow>Programme reach</SectionEyebrow>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Student strength by standard (boys vs girls)"
            data={studentsByStandard}
            tableColumns={[{ key: "name", label: "Standard" }, { key: "boys", label: "Boys" }, { key: "girls", label: "Girls" }]}
          >
            <BarChart data={studentsByStandard} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={{ fill: TICK, fontSize: 11, fontFamily: sans }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fill: TICK, fontSize: 11, fontFamily: mono }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F3F0E8" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: INK_SOFT, fontFamily: sans }} />
              {/* ponytail: recharts stacked bars render segments flush; skipping the 2px inter-segment gap spec, low visual cost at this scale */}
              <Bar dataKey="boys" stackId="s" name="Boys" fill={BLUE} maxBarSize={24} />
              <Bar dataKey="girls" stackId="s" name="Girls" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ChartCard>

          <SingleBar title="Schools by project" data={schoolsByProject} />
          <SingleBar title="Schools by type" data={schoolsByType} />
          <SingleBar title="Schools by location type" data={schoolsByLocation} />
          <SingleBar title="Schools by medium of instruction" data={schoolsByMedium} />
        </div>
      </div>

      <div className="mb-8">
        <SectionEyebrow>Programme activity</SectionEyebrow>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SingleBar title="Sessions conducted by academic year" data={sessionsByYear} />
        </div>
      </div>

      <div>
        <SectionEyebrow>Student demographics</SectionEyebrow>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SingleBar title="Gender distribution" data={genderDistribution} />
          <SingleBar title="Blood group distribution" data={bloodGroupDistribution} />
        </div>
      </div>
    </div>
  );
}
