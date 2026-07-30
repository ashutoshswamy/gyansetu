import { getAllExpenseAdvances, getAllExpenses } from "@/actions/finance";
import { Wallet } from "lucide-react";
import { AdvanceForm } from "./advance-form";
import { FinanceGroupBoard } from "./finance-group-board";

export type AdvanceRow = Awaited<ReturnType<typeof getAllExpenseAdvances>>[number];
export type ExpenseRow = Awaited<ReturnType<typeof getAllExpenses>>[number];

export type GroupLedger = {
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

        <FinanceGroupBoard ledgers={ledgers} />
      </div>
    </div>
  );
}
