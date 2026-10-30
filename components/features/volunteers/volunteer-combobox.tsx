"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";

type Volunteer = { id: string; name: string; email: string };

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
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Portal + fixed position so ancestor `overflow-hidden` (e.g. Card) can't clip the list.
  useEffect(() => {
    if (!open) return;
    const update = () => setRect(rootRef.current?.getBoundingClientRect() ?? null);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const selected = volunteers.find(v => v.id === value);
  const pool = excludeIds ? volunteers.filter(v => !excludeIds.has(v.id)) : volunteers;
  const filtered = pool.filter(v => `${v.name} ${v.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      {name && <input type="hidden" name={name} value={value} />}
      <Input
        type="text"
        value={open ? query : selected ? `${selected.name} (${selected.email})` : ""}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={e => setQuery(e.target.value)}
      />
      {open && rect && createPortal(
        <div ref={listRef} style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 60, background: "white", border: "1px solid var(--border)", borderRadius: 6, maxHeight: 220, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--gs-muted)" }}>No matches</div>
          )}
          {filtered.map(v => (
            <div
              key={v.id}
              onClick={() => { onChange(v.id); setOpen(false); setQuery(""); }}
              style={{ padding: "8px 12px", cursor: "pointer", background: v.id === value ? "#F5F3EC" : "transparent" }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{v.name}</div>
              <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>{v.email}</div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
