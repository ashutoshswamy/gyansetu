"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { createKitItem, updateKitItem, deleteKitItem } from "@/actions/kits";
import { Card, CardContent } from "@/components/ui/card";

type MaterialType = "reusable" | "consumable";

interface KitItemRow {
  id: string;
  name: string;
  category?: string | null;
  material_type: MaterialType;
  quantity_per_school: number;
  notes?: string | null;
}

interface Row {
  key: string;
  id: string | null;
  name: string;
  material_type: MaterialType;
  quantity_per_school: number;
  saving: boolean;
}

const TYPE_BADGE: Record<MaterialType, { bg: string; color: string }> = {
  reusable: { bg: "rgba(var(--gs-accent-rgb), 0.1)", color: "var(--gs-accent)" },
  consumable: { bg: "rgba(var(--gs-warning-rgb), 0.12)", color: "#B8860B" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13.5,
  border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
  background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
};

function toRow(item: KitItemRow): Row {
  return { key: item.id, id: item.id, name: item.name, material_type: item.material_type, quantity_per_school: item.quantity_per_school, saving: false };
}

function EditableRow({
  row, expectedSchools, onChange, onDelete,
}: {
  row: Row;
  expectedSchools: number;
  onChange: (key: string, patch: Partial<Row>) => void;
  onDelete: (key: string) => void;
}) {
  const first = useRef(true);

  // Debounced auto-save: creates the row on first meaningful edit, updates it after.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!row.name.trim() || Number.isNaN(row.quantity_per_school)) return;

    const timeout = setTimeout(async () => {
      onChange(row.key, { saving: true });
      try {
        if (row.id) {
          await updateKitItem(row.id, { name: row.name, material_type: row.material_type, quantity_per_school: row.quantity_per_school });
          onChange(row.key, { saving: false });
        } else {
          const created = await createKitItem({ name: row.name, material_type: row.material_type, quantity_per_school: row.quantity_per_school });
          onChange(row.key, { id: created.id, saving: false });
        }
      } catch {
        onChange(row.key, { saving: false });
      }
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on the editable fields, not on every row-object identity change
  }, [row.name, row.material_type, row.quantity_per_school]);

  const qty = Number.isNaN(row.quantity_per_school) ? 0 : row.quantity_per_school;
  const totalQty = row.material_type === "reusable" ? qty : qty * expectedSchools;

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td className="p-3">
        <input
          value={row.name}
          onChange={e => onChange(row.key, { name: e.target.value })}
          placeholder="e.g. Bag"
          style={inputStyle}
        />
      </td>
      <td className="p-3" style={{ minWidth: 130 }}>
        <select
          value={row.material_type}
          onChange={e => onChange(row.key, { material_type: e.target.value as MaterialType })}
          style={{ ...inputStyle, minWidth: 116, appearance: "none", fontWeight: 600, color: TYPE_BADGE[row.material_type].color, background: TYPE_BADGE[row.material_type].bg, border: "none" }}
        >
          <option value="reusable">Reusable</option>
          <option value="consumable">Consumable</option>
        </select>
      </td>
      <td className="p-3">
        <input
          type="number" min={1}
          value={Number.isNaN(row.quantity_per_school) ? "" : row.quantity_per_school}
          onChange={e => {
            const v = e.target.value;
            onChange(row.key, { quantity_per_school: v === "" ? NaN : Math.max(1, Number(v) || 1) });
          }}
          onBlur={() => { if (Number.isNaN(row.quantity_per_school)) onChange(row.key, { quantity_per_school: 1 }); }}
          style={inputStyle}
        />
      </td>
      <td className="p-3">
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)", padding: "8px 12px", borderRadius: 6, textAlign: "center" }}>
          {totalQty}
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          {row.saving && <span style={{ fontSize: 11, color: "var(--gs-muted)" }}>Saving…</span>}
          <button
            onClick={() => onDelete(row.key)}
            aria-label="Delete material"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gs-danger)", padding: 4 }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function KitMaterialsTable({ items }: { items: KitItemRow[] }) {
  const [expectedSchools, setExpectedSchools] = useState(1);
  const [rows, setRows] = useState<Row[]>(() => items.map(toRow));

  function handleChange(key: string, patch: Partial<Row>) {
    setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleAddRow() {
    setRows(prev => [...prev, { key: `new-${Date.now()}`, id: null, name: "", material_type: "consumable", quantity_per_school: 1, saving: false }]);
  }

  async function handleDelete(key: string) {
    const row = rows.find(r => r.key === key);
    setRows(prev => prev.filter(r => r.key !== key));
    if (row?.id) {
      try { await deleteKitItem(row.id); } catch { /* row already removed from view; catalog stays authoritative on next load */ }
    }
  }

  return (
    <div>
      <div className="flex items-end gap-3 flex-wrap" style={{ marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Expected Number of Schools</label>
          <input
            type="number" min={1}
            value={expectedSchools}
            onChange={e => setExpectedSchools(Math.max(1, Number(e.target.value) || 1))}
            style={{ ...inputStyle, width: 140 }}
          />
        </div>
        <p style={{ fontSize: 12, color: "var(--gs-muted)", marginBottom: 8 }}>Drives the Total Qty Required column below for consumable materials.</p>
      </div>

      <Card>
<CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--gs-card)", borderBottom: "1px solid var(--border)" }}>
                <th className="p-3 font-semibold text-[var(--gs-text-secondary)]">Material Name</th>
                <th className="p-3 font-semibold text-[var(--gs-text-secondary)]">Material Type</th>
                <th className="p-3 font-semibold text-[var(--gs-text-secondary)]">Qty Per School</th>
                <th className="p-3 font-semibold text-[var(--gs-text-secondary)]">Total Qty Required</th>
                <th className="p-3 font-semibold text-[var(--gs-text-secondary)]"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "24px 0", textAlign: "center", color: "var(--gs-muted)" }}>No materials yet.</td></tr>
              ) : (
                rows.map(row => (
                  <EditableRow key={row.key} row={row} expectedSchools={expectedSchools} onChange={handleChange} onDelete={handleDelete} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
</Card>

      <button
        onClick={handleAddRow}
        style={{ marginTop: 12, background: "var(--gs-accent)", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 6, border: "none", cursor: "pointer" }}
      >
        + Add Material
      </button>
    </div>
  );
}
