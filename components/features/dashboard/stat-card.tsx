interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "indigo" | "sky" | "emerald" | "amber" | "rose";
}

const accentMap = {
  indigo: {
    border: "#4A55BE",
    glow: "rgba(74,85,190,0.06)",
    iconColor: "#4A55BE",
  },
  sky: {
    border: "#1E5A8A",
    glow: "rgba(30,90,138,0.06)",
    iconColor: "#1E5A8A",
  },
  emerald: {
    border: "#2A5E3A",
    glow: "rgba(42,94,58,0.06)",
    iconColor: "#2A5E3A",
  },
  amber: {
    border: "#F5A520",
    glow: "rgba(245,165,32,0.06)",
    iconColor: "#F5A520",
  },
  rose: {
    border: "#B8381E",
    glow: "rgba(184,56,30,0.06)",
    iconColor: "#B8381E",
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "indigo",
}: StatCardProps) {
  const a = accentMap[accent];

  return (
    <div
      className="relative p-5 rounded-[10px] overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E4DFD1",
        borderLeft: `3px solid ${a.border}`,
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
              color: "#9B9188",
              fontFamily: "'Poppins', var(--font-poppins), sans-serif",
            }}
          >
            {label}
          </p>
          <p
            className="text-3xl font-bold leading-none"
            style={{
              color: "#4A55BE",
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
                color: "#9B9188",
                fontFamily: "'Poppins', var(--font-poppins), sans-serif",
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
}
