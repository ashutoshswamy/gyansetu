"use client";

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
    <div style={{ border: "1.5px solid var(--border)", borderRadius: 6, maxHeight: 320, overflowY: "auto", background: "var(--background)" }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--border)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)" }}>
        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
        Select all ({volunteers.length})
      </label>
      {volunteers.length === 0 && (
        <div style={{ padding: "12px", fontSize: 13, color: "var(--gs-muted)" }}>No volunteers found.</div>
      )}
      {volunteers.map(v => (
        <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", fontSize: 13, color: "var(--foreground)", cursor: "pointer", borderBottom: "1px solid #F0EEE6" }}>
          <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} />
          <span>{v.name} <span style={{ color: "var(--gs-muted)" }}>({v.email})</span></span>
        </label>
      ))}
    </div>
  );
}
