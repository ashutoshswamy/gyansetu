"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Client-side search box that filters an already-rendered list.
 * Wrap the list container; rows are its element children, or pass
 * `rowSelector` (e.g. "tbody tr") for a different shape.
 * ponytail: filters by visible text — no per-row wiring, no server round-trip.
 */
export function SearchList({
  placeholder = "Search…",
  rowSelector,
  children,
}: {
  placeholder?: string;
  rowSelector?: string;
  children: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [empty, setEmpty] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const rows = rowSelector
      ? Array.from(root.querySelectorAll<HTMLElement>(rowSelector))
      : (Array.from(root.firstElementChild?.children ?? []) as HTMLElement[]);
    const needle = q.trim().toLowerCase();
    let shown = 0;
    for (const row of rows) {
      const hit = !needle || (row.textContent ?? "").toLowerCase().includes(needle);
      row.hidden = !hit;
      if (hit) shown++;
    }
    // Grouped lists: hide a section header wrapper with no visible rows left.
    for (const section of Array.from(root.querySelectorAll<HTMLElement>("[data-search-section]"))) {
      section.hidden = !section.querySelector(":scope [data-search-row]:not([hidden])");
    }
    setEmpty(needle !== "" && rows.length > 0 && shown === 0);
  }, [q, rowSelector, children]);

  return (
    <>
      <div className="relative mb-4">
        <Search
          size={15}
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gs-muted)" }}
        />
        <Input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      <div ref={ref}>{children}</div>
      {empty && (
        <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
          No matches for &ldquo;{q.trim()}&rdquo;.
        </p>
      )}
    </>
  );
}
