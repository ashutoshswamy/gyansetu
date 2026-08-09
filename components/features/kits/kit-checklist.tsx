"use client";

import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { toggleKitChecklistItem } from "@/actions/kits";
import { Badge } from "@/components/ui/badge";

interface ChecklistItem {
  id: string;
  name: string;
  material_type: "reusable" | "consumable";
  total_qty: number;
  checked: boolean;
}

const TYPE_BADGE: Record<ChecklistItem["material_type"], { bg: string; color: string; label: string }> = {
  reusable: { bg: "rgba(var(--gs-accent-rgb), 0.1)", color: "var(--gs-accent)", label: "Reusable" },
  consumable: { bg: "rgba(var(--gs-warning-rgb), 0.12)", color: "#B8860B", label: "Consumable" },
};

export function KitChecklist({ groupId, items }: { groupId: string; items: ChecklistItem[] }) {
  const [rows, setRows] = useState(items);

  async function handleToggle(id: string, checked: boolean) {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, checked } : r)));
    try {
      await toggleKitChecklistItem(groupId, id, checked);
    } catch {
      setRows(prev => prev.map(r => (r.id === id ? { ...r, checked: !checked } : r)));
    }
  }

  const packedCount = rows.filter(r => r.checked).length;

  return (
    <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)" }}>Packing Checklist</span>
        <span style={{ fontSize: 11, color: "var(--gs-muted)" }}>{packedCount}/{rows.length} packed</span>
      </div>
      <div className="space-y-1.5">
        {rows.map(item => {
          const badge = TYPE_BADGE[item.material_type];
          return (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id, !item.checked)}
              className="flex items-center justify-between gap-2 w-full text-left"
              style={{ background: "white", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", cursor: "pointer" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {item.checked ? <CheckSquare size={16} style={{ color: "var(--gs-success)", flexShrink: 0 }} /> : <Square size={16} style={{ color: "var(--gs-muted)", flexShrink: 0 }} />}
                <span style={{ fontSize: 13, color: item.checked ? "var(--gs-muted)" : "var(--foreground)", textDecoration: item.checked ? "line-through" : "none" }}>{item.name}</span>
                <Badge style={{color: badge.color, background: badge.bg, flexShrink: 0}}>{badge.label}</Badge>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gs-success)", flexShrink: 0 }}>{item.total_qty}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
