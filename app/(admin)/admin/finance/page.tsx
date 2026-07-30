import { getAllExpenseAdvances, getAllExpenses } from "@/actions/finance";
import { Wallet } from "lucide-react";
import { AdvanceForm } from "./advance-form";
import { ExpenseActions } from "./expense-actions";
import { ReceiptButton } from "@/components/features/expenses/receipt-button";

type AdvanceRow = Awaited<ReturnType<typeof getAllExpenseAdvances>>[number];
type ExpenseRow = Awaited<ReturnType<typeof getAllExpenses>>[number];

type GroupLedger = {
  groupId: string;
  groupName: string;
  advances: AdvanceRow[];
  expenses: ExpenseRow[];
  advanceTotal: number;
  approvedSpent: number;
  pendingSpent: number;
  remaining: number;
};

const UNASSIGNED = "unassigned";

// One section per group — nothing in the DB tracks this rollup, so it's derived here
// from the same two lists the page already fetches. "Remaining" (the Gyan Setu balance)
// is measured against approved expenses only; pending expenses are called out separately
// since they could still eat into that balance once approved.
function buildGroupLedgers(advances: AdvanceRow[], expenses: ExpenseRow[]): GroupLedger[] {
  const map = new Map<string, GroupLedger>();
  function ledgerFor(groupId: string, groupName: string) {
    let g = map.get(groupId);
    if (!g) { g = { groupId, groupName, advances: [], expenses: [], advanceTotal: 0, approvedSpent: 0, pendingSpent: 0, remaining: 0 }; map.set(groupId, g); }
    return g;
  }
  for (const a of advances) {
    const g = ledgerFor(a.group_id ?? UNASSIGNED, a.group?.name ?? "Unassigned / No Group");
    g.advances.push(a);
    g.advanceTotal += Number(a.amount);
  }
  for (const ex of expenses) {
    const g = ledgerFor(ex.group_id ?? UNASSIGNED, ex.group?.name ?? "Unassigned / No Group");
    g.expenses.push(ex);
    if (ex.status === "approved") g.approvedSpent += Number(ex.amount);
    else if (ex.status === "pending") g.pendingSpent += Number(ex.amount);
  }
  for (const g of map.values()) g.remaining = g.advanceTotal - g.approvedSpent;
  return Array.from(map.values()).sort((a, b) => {
    if (a.groupId === UNASSIGNED) return 1;
    if (b.groupId === UNASSIGNED) return -1;
    return a.groupName.localeCompare(b.groupName);
  });
}

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

export default async function AdminFinancePage() {
  const [advances, expenses] = await Promise.all([getAllExpenseAdvances(), getAllExpenses()]);
  const ledgers = buildGroupLedgers(advances, expenses);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Finance</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Advances, expenses and bill approvals — grouped by tour group</p>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <Wallet size={17} style={{ color: "#4A55BE" }} /> Record an Advance
        </h2>
        <AdvanceForm />

        {ledgers.length === 0 && (
          <p style={{ fontSize: 13, color: "#9B9188" }}>No advances or expenses recorded yet.</p>
        )}

        {ledgers.map((g) => {
          const over = g.remaining < 0;
          return (
            <section key={g.groupId} style={{ marginBottom: 36 }}>
              <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#19140F", margin: 0 }}>{g.groupName}</h3>
                    {g.advances.length > 0 && (
                      <p style={{ fontSize: 11.5, color: "#9B9188", margin: "4px 0 0" }}>
                        {g.advances.map((a, i) => (
                          <span key={a.id}>
                            {i > 0 && " · "}
                            ₹{Number(a.amount).toLocaleString("en-IN")}{a.notes ? ` (${a.notes})` : ""} on {new Date(a.given_at).toLocaleDateString("en-IN")}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-right">
                      <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9B9188", margin: 0 }}>Advance Given</p>
                      <p style={{ fontSize: 19, fontWeight: 700, color: "#4A55BE", margin: 0 }}>₹{g.advanceTotal.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9B9188", margin: 0 }}>Gyan Setu Balance</p>
                      <p style={{ fontSize: 19, fontWeight: 700, color: over ? "#DC2626" : "#2A5E3A", margin: 0 }}>
                        {over ? "−" : "+"}₹{Math.abs(g.remaining).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: over ? "#DC2626" : "#9B9188", margin: "8px 0 0" }}>
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
                {g.expenses.map((ex) => {
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
        })}
      </div>
    </div>
  );
}
