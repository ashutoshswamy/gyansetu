"use client";

import { useState } from "react";
import { ExpenseActions } from "./expense-actions";
import { ReceiptButton } from "@/components/features/expenses/receipt-button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { GroupLedger, ExpenseRow, AdvanceRow } from "./page";

const ALL = "all";

const categoryLabels: Record<string, string> = {
  travel: "Travel & Transportation",
  accommodation: "Accommodation",
  food: "Food & Refreshments",
  materials: "Program Materials & Printing",
  miscellaneous: "Miscellaneous",
};

const categoryColors: Record<string, { color: string; bg: string }> = {
  travel:        { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  accommodation: { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  food:          { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  materials:     { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  miscellaneous: { color: "var(--gs-text-secondary)", bg: "rgba(90,82,71,0.08)" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:    { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  approved:   { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  rejected:   { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)" },
  sent_back:  { color: "var(--gs-danger-alt)", bg: "rgba(var(--gs-danger-alt-rgb), 0.08)" },
};

const statusLabels: Record<string, string> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  sent_back: "sent back",
};

function GroupSection({ g }: { g: GroupLedger }) {
  const over = g.remaining < 0;
  const [selectedAdvance, setSelectedAdvance] = useState<AdvanceRow | null>(null);

  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", margin: "0 0 14px" }}>{g.groupName}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: g.advances.length > 0 ? 14 : 0 }}>
          <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gs-muted)", margin: "0 0 4px" }}>Advance Given</p>
            <p style={{ fontSize: 19, fontWeight: 700, color: "var(--gs-accent)", margin: 0 }}>₹{g.advanceTotal.toLocaleString("en-IN")}</p>
          </div>
          <div style={{ background: over ? "rgba(var(--gs-danger-rgb), 0.06)" : "rgba(var(--gs-success-rgb), 0.06)", border: `1px solid ${over ? "rgba(var(--gs-danger-rgb), 0.2)" : "rgba(var(--gs-success-rgb), 0.2)"}`, borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gs-muted)", margin: "0 0 4px" }}>Gyan Setu Balance</p>
            <p style={{ fontSize: 19, fontWeight: 700, color: over ? "var(--gs-danger)" : "var(--gs-success)", margin: 0 }}>
              {over ? "−" : "+"}₹{Math.abs(g.remaining).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {g.advances.length > 0 && (
          <div className="space-y-1.5" style={{ marginBottom: 10 }}>
            {g.advances.map((a) => (
              <div
                key={a.id}
                className="flex items-baseline justify-between gap-3 cursor-pointer hover:opacity-70 transition-opacity"
                style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px dashed var(--border)" }}
                onClick={() => setSelectedAdvance(a)}
              >
                <span style={{ color: "var(--gs-text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 700, color: "var(--foreground)" }}>₹{Number(a.amount).toLocaleString("en-IN")}</span>
                  {a.notes && <span> · {a.notes}</span>}
                </span>
                <span style={{ color: "var(--gs-muted)", flexShrink: 0 }}>{new Date(a.given_at).toLocaleDateString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 11, color: over ? "var(--gs-danger)" : "var(--gs-muted)", margin: 0 }}>
          {over
            ? "Approved expenses exceed the advance — this much is owed back to the group."
            : "Remaining with the group against approved expenses."}
          {g.pendingSpent > 0 && ` ₹${g.pendingSpent.toLocaleString("en-IN")} more is pending approval and not yet counted here.`}
        </p>
      </div>

      <div className="space-y-3">
        {g.expenses.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--gs-muted)", padding: "0 4px" }}>No receipts submitted for this group yet.</p>
        )}
        {g.expenses.map((ex: ExpenseRow) => {
          const cat = categoryColors[ex.category] ?? categoryColors.miscellaneous;
          const st = statusColors[ex.status] ?? statusColors.pending;
          return (
            <div key={ex.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{ex.submitter?.name ?? "Unknown"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: cat.color, background: cat.bg }}>
                      {categoryLabels[ex.category] ?? ex.category}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: st.color, background: st.bg, textTransform: "capitalize" }}>
                      {statusLabels[ex.status] ?? ex.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 4px" }}>
                    {ex.submitter?.email} · {new Date(ex.expense_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    {ex.subcategory ? ` · ${ex.subcategory}` : ""}
                    {ex.volunteer_count ? ` · ${ex.volunteer_count} volunteer${ex.volunteer_count !== 1 ? "s" : ""}` : ""}
                    {ex.vendor_name ? ` · ${ex.vendor_name}` : ""}
                  </p>
                  {ex.description && <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "4px 0" }}>{ex.description}</p>}
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 2 }}>
                    {ex.bill_url && (
                      <a href={ex.bill_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--gs-accent)", display: "inline-block" }}>
                        View bill
                      </a>
                    )}
                    <ReceiptButton expense={ex} />
                  </div>
                  {ex.rejection_reason && (
                    <p style={{ fontSize: 12, color: ex.status === "sent_back" ? "var(--gs-danger-alt)" : "var(--gs-danger)", margin: "6px 0 0" }}>
                      {ex.status === "sent_back" ? "Sent back" : "Rejected"}: {ex.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>₹{Number(ex.amount).toLocaleString("en-IN")}</p>
                  {ex.status === "pending" && <ExpenseActions id={ex.id} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={selectedAdvance !== null} onOpenChange={(open) => !open && setSelectedAdvance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advance Details</DialogTitle>
          </DialogHeader>
          {selectedAdvance && (
            <div className="space-y-4">
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gs-muted)", margin: "0 0 4px" }}>Amount</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--gs-accent)", margin: 0 }}>₹{Number(selectedAdvance.amount).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gs-muted)", margin: "0 0 4px" }}>Group</p>
                <p style={{ fontSize: 14, color: "var(--foreground)", margin: 0 }}>{g.groupName}</p>
              </div>
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gs-muted)", margin: "0 0 4px" }}>Date</p>
                <p style={{ fontSize: 14, color: "var(--foreground)", margin: 0 }}>{new Date(selectedAdvance.given_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              {selectedAdvance.notes && (
                <div>
                  <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gs-muted)", margin: "0 0 4px" }}>Notes</p>
                  <p style={{ fontSize: 14, color: "var(--foreground)", margin: 0 }}>{selectedAdvance.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function FinanceGroupBoard({ ledgers }: { ledgers: GroupLedger[] }) {
  const [selected, setSelected] = useState(ALL);

  if (ledgers.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No advances or expenses recorded yet.</p>;
  }

  const visible = selected === ALL ? ledgers : ledgers.filter((g) => g.groupId === selected);

  return (
    <div>
      <div className="mb-5">
        <Label className="mb-1.5 text-[var(--gs-text-secondary)]">Group</Label>
        <Select value={selected} onValueChange={(v) => setSelected(v ?? ALL)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Groups</SelectItem>
            {ledgers.map((g) => (
              <SelectItem key={g.groupId} value={g.groupId}>{g.groupName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.map((g) => <GroupSection key={g.groupId} g={g} />)}
    </div>
  );
}
