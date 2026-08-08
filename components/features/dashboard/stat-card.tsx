import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "indigo" | "sky" | "emerald" | "amber" | "rose";
  href?: string;
}

const accentMap = {
  indigo: {
    border: "var(--gs-accent)",
    glow: "rgba(var(--gs-accent-rgb), 0.06)",
    iconColor: "var(--gs-accent)",
  },
  sky: {
    border: "#1E5A8A",
    glow: "rgba(30,90,138,0.06)",
    iconColor: "#1E5A8A",
  },
  emerald: {
    border: "var(--gs-success)",
    glow: "rgba(var(--gs-success-rgb), 0.06)",
    iconColor: "var(--gs-success)",
  },
  amber: {
    border: "var(--gs-warning)",
    glow: "rgba(var(--gs-warning-rgb), 0.06)",
    iconColor: "var(--gs-warning)",
  },
  rose: {
    border: "var(--gs-danger-alt)",
    glow: "rgba(var(--gs-danger-alt-rgb), 0.06)",
    iconColor: "var(--gs-danger-alt)",
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "indigo",
  href,
}: StatCardProps) {
  const a = accentMap[accent];

  const card = (
    <div
      className="relative p-5 rounded-[10px] overflow-hidden h-full"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${a.border}`,
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, ${a.glow} 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p
            className="text-[11px] font-semibold tracking-widest uppercase mb-2"
            style={{
              color: "var(--gs-muted)",
              fontFamily: "'IBM Plex Sans', var(--font-plex-sans), sans-serif",
            }}
          >
            {label}
          </p>
          <p
            className="text-3xl font-bold leading-none"
            style={{
              color: "var(--gs-accent)",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "var(--font-geist-mono), 'Cormorant Garamond', monospace",
            }}
          >
            {value}
          </p>
          {sub && (
            <p
              className="text-xs mt-2"
              style={{
                color: "var(--gs-muted)",
                fontFamily: "'IBM Plex Sans', var(--font-plex-sans), sans-serif",
              }}
            >
              {sub}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="mt-0.5"
            style={{ color: a.iconColor }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block h-full hover:shadow-md hover:-translate-y-0.5 transition-transform" style={{ transitionDuration: "0.15s" }}>
      {card}
    </Link>
  );
}
