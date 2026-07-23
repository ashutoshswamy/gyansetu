"use client";

import { useEffect, useRef, useState } from "react";

type Volunteer = { id: string; name: string; email: string };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
};

export function VolunteerCombobox({
  volunteers,
  value,
  onChange,
  name,
  excludeIds,
  placeholder = "Search by name or email...",
}: {
  volunteers: Volunteer[];
  value: string;
  onChange: (id: string) => void;
  name?: string;
  excludeIds?: Set<string>;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const selected = volunteers.find(v => v.id === value);
  const pool = excludeIds ? volunteers.filter(v => !excludeIds.has(v.id)) : volunteers;
  const filtered = pool.filter(v => `${v.name} ${v.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      {name && <input type="hidden" name={name} value={value} />}
      <input
        type="text"
        value={open ? query : selected ? `${selected.name} (${selected.email})` : ""}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={e => setQuery(e.target.value)}
        style={inputStyle}
      />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, background: "white", border: "1px solid #E4DFD1", borderRadius: 6, maxHeight: 220, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "#9B9188" }}>No matches</div>
          )}
          {filtered.map(v => (
            <div
              key={v.id}
              onClick={() => { onChange(v.id); setOpen(false); setQuery(""); }}
              style={{ padding: "8px 12px", cursor: "pointer", background: v.id === value ? "#F5F3EC" : "transparent" }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: "#19140F" }}>{v.name}</div>
              <div style={{ fontSize: 12, color: "#9B9188" }}>{v.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
