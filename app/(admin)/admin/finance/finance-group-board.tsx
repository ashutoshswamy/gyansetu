"use client";

import { useState } from "react";
import { ExpenseActions } from "./expense-actions";
import { ReceiptButton } from "@/components/features/expenses/receipt-button";
import type { GroupLedger, ExpenseRow } from "./page";

const ALL = "all";

const categoryLabels: Record<string, string> = {
  travel: "Travel & Transportation",
  accommodation: "Accommodation",
  food: "Food & Refreshments",
  materials: "Program Materials & Printing",
  miscellaneous: "Miscellaneous",
};

const categoryColors: Record<string, { color: string; bg: string }> = {
  travel:        { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  accommodation: { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  food:          { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  materials:     { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  miscellaneous: { color: "#5A5247", bg: "rgba(90,82,71,0.08)" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:    { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  approved:   { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  rejected:   { color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  sent_back:  { color: "#B8381E", bg: "rgba(184,56,30,0.08)" },
};

const statusLabels: Record<string, string> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  sent_back: "sent back",
};

const selectStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: "#19140F",
  background: "white", border: "1.5px solid #E4DFD1", borderRadius: 7,
  padding: "9px 14px", outline: "none", cursor: "pointer",
};

function GroupSection({ g }: { g: GroupLedger }) {
  const over = g.remaining < 0;
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#19140F", margin: "0 0 14px" }}>{g.groupName}</h3>

        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: g.advances.length > 0 ? 14 : 0 }}>
          <div style={{ background: "#FBF7EC", border: "1px solid #E4DFD1", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9B9188", margin: "0 0 4px" }}>Advance Given</p>
            <p style={{ fontSize: 19, fontWeight: 700, color: "#4A55BE", margin: 0 }}>₹{g.advanceTotal.toLocaleString("en-IN")}</p>
          </div>
          <div style={{ background: over ? "rgba(220,38,38,0.06)" : "rgba(42,94,58,0.06)", border: `1px solid ${over ? "rgba(220,38,38,0.2)" : "rgba(42,94,58,0.2)"}`, borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9B9188", margin: "0 0 4px" }}>Gyan Setu Balance</p>
            <p style={{ fontSize: 19, fontWeight: 700, color: over ? "#DC2626" : "#2A5E3A", margin: 0 }}>
              {over ? "−" : "+"}₹{Math.abs(g.remaining).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {g.advances.length > 0 && (
          <div className="space-y-1.5" style={{ marginBottom: 10 }}>
            {g.advances.map((a) => (
              <div key={a.id} className="flex items-baseline justify-between gap-3" style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px dashed #E4DFD1" }}>
                <span style={{ color: "#5A5247", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 700, color: "#19140F" }}>₹{Number(a.amount).toLocaleString("en-IN")}</span>
                  {a.notes && <span> · {a.notes}</span>}
                </span>
                <span style={{ color: "#9B9188", flexShrink: 0 }}>{new Date(a.given_at).toLocaleDateString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 11, color: over ? "#DC2626" : "#9B9188", margin: 0 }}>
          {over
            ? "Approved expenses exceed the advance — this much is owed back to the group."
            : "Remaining with the group against approved expenses."}
          {g.pendingSpent > 0 && ` ₹${g.pendingSpent.toLocaleString("en-IN")} more is pending approval and not yet counted here.`}
        </p>
      </div>

      <div className="space-y-3">
        {g.expenses.length === 0 && (
          <p style={{ fontSize: 13, color: "#9B9188", padding: "0 4px" }}>No receipts submitted for this group yet.</p>
        )}
        {g.expenses.map((ex: ExpenseRow) => {
          const cat = categoryColors[ex.category] ?? categoryColors.miscellaneous;
          const st = statusColors[ex.status] ?? statusColors.pending;
          return (
            <div key={ex.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#19140F" }}>{ex.submitter?.name ?? "Unknown"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: cat.color, background: cat.bg }}>
                      {categoryLabels[ex.category] ?? ex.category}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: st.color, background: st.bg, textTransform: "capitalize" }}>
                      {statusLabels[ex.status] ?? ex.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 4px" }}>
                    {ex.submitter?.email} · {new Date(ex.expense_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    {ex.subcategory ? ` · ${ex.subcategory}` : ""}
                    {ex.volunteer_count ? ` · ${ex.volunteer_count} volunteer${ex.volunteer_count !== 1 ? "s" : ""}` : ""}
                    {ex.vendor_name ? ` · ${ex.vendor_name}` : ""}
                  </p>
                  {ex.description && <p style={{ fontSize: 13, color: "#5A5247", margin: "4px 0" }}>{ex.description}</p>}
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 2 }}>
                    {ex.bill_url && (
                      <a href={ex.bill_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4A55BE", display: "inline-block" }}>
                        View bill
                      </a>
                    )}
                    <ReceiptButton expense={ex} />
                  </div>
                  {ex.rejection_reason && (
                    <p style={{ fontSize: 12, color: ex.status === "sent_back" ? "#B8381E" : "#DC2626", margin: "6px 0 0" }}>
                      {ex.status === "sent_back" ? "Sent back" : "Rejected"}: {ex.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#19140F", margin: 0 }}>₹{Number(ex.amount).toLocaleString("en-IN")}</p>
                  {ex.status === "pending" && <ExpenseActions id={ex.id} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FinanceGroupBoard({ ledgers }: { ledgers: GroupLedger[] }) {
  const [selected, setSelected] = useState(ALL);

  if (ledgers.length === 0) {
    return <p style={{ fontSize: 13, color: "#9B9188" }}>No advances or expenses recorded yet.</p>;
  }

  const visible = selected === ALL ? ledgers : ledgers.filter((g) => g.groupId === selected);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5A5247", marginBottom: 6 }}>Group</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} style={selectStyle}>
          <option value={ALL}>All Groups</option>
          {ledgers.map((g) => (
            <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
          ))}
        </select>
      </div>

      {visible.map((g) => <GroupSection key={g.groupId} g={g} />)}
    </div>
  );
}
