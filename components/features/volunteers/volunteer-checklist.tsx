"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

type Volunteer = { id: string; name: string; email: string };

export function VolunteerChecklist({
  volunteers,
  selected,
  onChange,
}: {
  volunteers: Volunteer[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const allSelected = volunteers.length > 0 && volunteers.every(v => selected.has(v.id));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  }

  function toggleAll() {
    onChange(allSelected ? new Set() : new Set(volunteers.map(v => v.id)));
  }

  return (
    <Card className="py-0 gap-0 max-h-80 overflow-y-auto">
      <Label style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)" }}>
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
        Select all ({volunteers.length})
      </Label>
      {volunteers.length === 0 && (
        <div style={{ padding: "12px", fontSize: 13, color: "var(--gs-muted)" }}>No volunteers found.</div>
      )}
      {volunteers.map(v => (
        <Label key={v.id} style={{ padding: "7px 12px", fontSize: 13, fontWeight: 400, color: "var(--foreground)", cursor: "pointer", borderBottom: "1px solid #F0EEE6" }}>
          <Checkbox checked={selected.has(v.id)} onCheckedChange={() => toggle(v.id)} />
          <span>{v.name} <span style={{ color: "var(--gs-muted)" }}>({v.email})</span></span>
        </Label>
      ))}
    </Card>
  );
}
