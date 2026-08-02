"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { F_BODY, F_MONO } from "@/components/landing/theme";

// Shared chart primitives for internal analytics dashboards (EARC impact,
// school reports, ...) — built on the site's --gs-* tokens (see
// components/landing/theme.tsx) so an admin-facing dashboard reads as the
// same product as the public site, not a bolted-on BI tool.

export const CHART_SPECTRUM = ["#E8A33D", "#B8492E", "#6B7A3A", "#8C6E4A", "#5C7A8A", "#9B6B9E"];

export const tooltipStyle = { background: "var(--gs-paper)", border: "1px solid var(--gs-line)", borderRadius: 6, fontSize: 12, color: "var(--gs-text)", fontFamily: F_BODY };
export const legendStyle: React.CSSProperties = { fontSize: 11.5, color: "var(--gs-text-soft)", fontFamily: F_BODY };
export const gridProps = { stroke: "var(--gs-line)" };
export const axisTick = { fill: "var(--gs-text-mute)", fontSize: 11, fontFamily: F_BODY };
export const axisTickMono = { fill: "var(--gs-text-mute)", fontSize: 11, fontFamily: F_MONO };

export function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

export function count(rows: string[]): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r, (m.get(r) ?? 0) + 1);
  return [...m.entries()].map(([name, value]) => ({ name, value }));
}

export function sortBy<T>(rows: T[], order: readonly string[], key: (r: T) => string): T[] {
  return [...rows].sort((a, b) => {
    const ia = order.indexOf(key(a)); const ib = order.indexOf(key(b));
    if (ia === -1 && ib === -1) return key(a).localeCompare(key(b));
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

// Caps a breakdown to its top N slices, folding the remainder into "Others" —
// keeps a breakdown legible when a facet has many distinct values.
export function topNWithOthers(data: { name: string; value: number }[], n: number): { name: string; value: number }[] {
  if (data.length <= n) return data;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, n);
  const othersValue = sorted.slice(n).reduce((a, d) => a + d.value, 0);
  return othersValue > 0 ? [...top, { name: "Others", value: othersValue }] : top;
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ width: 18, height: 2, background: "var(--gs-marigold)", display: "inline-block" }} />
      <span style={{ fontFamily: F_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gs-text-soft)" }}>
        {children}
      </span>
    </div>
  );
}

// Shared card chrome — dashed paper border + title — used by every card in
// the dashboards (real charts, breakdown ledgers, stat callouts) so they
// read as one system regardless of what's inside.
function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--gs-paper)", border: "1px dashed var(--gs-line)", borderRadius: 6, padding: "16px 16px 8px" }}>
      <p style={{ fontFamily: F_BODY, fontSize: 13, fontWeight: 600, color: "var(--gs-text)", margin: "0 0 12px" }}>{title}</p>
      {children}
    </div>
  );
}

function TableFooter({ data, tableColumns }: { data: Record<string, string | number>[]; tableColumns: { key: string; label: string }[] }) {
  if (data.length === 0) return null;
  return (
    <details style={{ margin: "8px 0 4px" }}>
      <summary style={{ fontFamily: F_BODY, fontSize: 11, color: "var(--gs-text-mute)", cursor: "pointer" }}>View as table</summary>
      <div style={{ overflowX: "auto", marginTop: 8 }}>
      <table style={{ width: "100%", fontFamily: F_MONO, fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--gs-line)" }}>
            {tableColumns.map(c => <th key={c.key} className="text-left p-1" style={{ color: "var(--gs-text-soft)", fontWeight: 500 }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--gs-line)" }}>
              {tableColumns.map(c => <td key={c.key} className="p-1" style={{ color: "var(--gs-text)" }}>{row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </details>
  );
}

const BREAKDOWN_TABLE_COLUMNS = [{ key: "name", label: "Category" }, { key: "value", label: "Count" }];

export function ChartCard({
  title, data, children, tableColumns, centerLabel, centerLabelLeft = "50%", maxWidth,
}: {
  title: string;
  data: Record<string, string | number>[];
  children: React.ReactNode;
  tableColumns: { key: string; label: string }[];
  centerLabel?: React.ReactNode;
  /** Horizontal position of centerLabel — matches the donut's cx when a side legend pushes it off-center. */
  centerLabelLeft?: string;
  /** Caps the chart+legend area's width so a small donut doesn't strand its legend
   *  far off in empty space on a wide grid cell. */
  maxWidth?: number;
}) {
  return (
    <CardShell title={title}>
      {data.length === 0 ? (
        <p style={{ fontFamily: F_BODY, fontSize: 12, color: "var(--gs-text-mute)", padding: "24px 0", textAlign: "center" }}>No data yet.</p>
      ) : (
        <div style={{ width: "100%", maxWidth, height: 220, position: "relative", margin: maxWidth ? "0 auto" : undefined }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
          {centerLabel && (
            <div style={{ position: "absolute", top: "50%", left: centerLabelLeft, transform: "translate(-50%, calc(-50% - 12px))", textAlign: "center", pointerEvents: "none" }}>
              {centerLabel}
            </div>
          )}
        </div>
      )}
      <TableFooter data={data} tableColumns={tableColumns} />
    </CardShell>
  );
}

// Ordered/trend bar charts (a year axis, a month axis, a ranked scale) — where
// the x-position itself carries meaning, so it stays a real chart even when
// there's only a couple of points on it.
export function SingleBar({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <ChartCard title={title} data={data} tableColumns={BREAKDOWN_TABLE_COLUMNS}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} {...gridProps} />
        <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: "var(--gs-line)" }} tickLine={false} interval={0} angle={data.length > 6 ? -30 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 50 : 24} />
        <YAxis tick={axisTickMono} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--gs-paper-deep)", opacity: 0.6 }} />
        <Bar dataKey="value" fill="var(--gs-marigold)" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ChartCard>
  );
}

// Multi-series stacked bar — e.g. counts broken down by a second dimension
// (standard, gender, ...) within each top-level category.
export function StackedBar({
  title, data, series, tableColumns,
}: {
  title: string;
  data: Record<string, string | number>[];
  series: { key: string; name: string; color?: string }[];
  tableColumns: { key: string; label: string }[];
}) {
  return (
    <ChartCard title={title} data={data} tableColumns={tableColumns}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} {...gridProps} />
        <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: "var(--gs-line)" }} tickLine={false} />
        <YAxis tick={axisTickMono} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--gs-paper-deep)", opacity: 0.6 }} />
        <Legend wrapperStyle={legendStyle} />
        {series.map((s, i) => (
          <Bar
            key={s.key} dataKey={s.key} stackId="s" name={s.name} fill={s.color ?? CHART_SPECTRUM[i % CHART_SPECTRUM.length]} maxBarSize={72}
            radius={i === series.length - 1 ? [3, 3, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ChartCard>
  );
}

// Proportion-of-whole facets read as a solid pie. cx is fixed (not the
// recharts default 50%) — with a side legend, letting recharts auto-center
// the pie against the full plot width leaves it hugging the left edge with
// a dead gap before the legend. A fixed cx plus a capped chart width keep
// the pie in a stable, predictable spot regardless of legend width or how
// wide the surrounding grid cell is.
export function PieCard({ title, data, cap = 6 }: { title: string; data: { name: string; value: number }[]; cap?: number }) {
  const capped = topNWithOthers(data, cap);
  return (
    <ChartCard
      title={title}
      data={capped}
      tableColumns={BREAKDOWN_TABLE_COLUMNS}
      maxWidth={380}
    >
      <PieChart>
        <Pie data={capped} dataKey="value" nameKey="name" cx="38%" cy="50%" outerRadius="82%" paddingAngle={2} strokeWidth={0}>
          {capped.map((d, i) => <Cell key={d.name} fill={d.name === "Others" ? "var(--gs-line)" : CHART_SPECTRUM[i % CHART_SPECTRUM.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={legendStyle} layout="vertical" verticalAlign="middle" align="right" iconSize={8} />
      </PieChart>
    </ChartCard>
  );
}

export function LedgerStat({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <div className="flex-1 min-w-[120px]" style={{ padding: "14px 20px", borderLeft: first ? "none" : "1px solid var(--gs-line)" }}>
      <p style={{ fontFamily: F_BODY, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gs-text-mute)", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontFamily: F_BODY, fontSize: 24, fontWeight: 700, color: "var(--gs-text)", margin: 0 }}>{value}</p>
    </div>
  );
}

export function Ledger({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap" style={{ background: "var(--gs-paper)", border: "1px dashed var(--gs-line)", borderRadius: 6 }}>
      {children}
    </div>
  );
}

export const bandSelectStyle: React.CSSProperties = {
  fontFamily: F_BODY, fontSize: 12.5, padding: "7px 12px", borderRadius: 4,
  background: "rgba(251,247,236,0.1)", border: "1px solid rgba(251,247,236,0.28)",
  color: "var(--gs-paper)", outline: "none",
};
