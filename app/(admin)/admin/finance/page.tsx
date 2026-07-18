import { getAllExpenseAdvances, getAllExpenses } from "@/actions/finance";
import { Receipt, Wallet } from "lucide-react";
import { AdvanceForm } from "./advance-form";
import { ExpenseActions } from "./expense-actions";

const categoryColors: Record<string, { color: string; bg: string }> = {
  travel:        { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  accommodation: { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  food:          { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  materials:     { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  miscellaneous: { color: "#5A5247", bg: "rgba(90,82,71,0.08)" },
  other:         { color: "#5A5247", bg: "rgba(90,82,71,0.08)" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:  { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  approved: { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  rejected: { color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
};

export default async function AdminFinancePage() {
  const [advances, expenses] = await Promise.all([getAllExpenseAdvances(), getAllExpenses()]);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Finance</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Advances, expenses and bill approvals</p>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <Wallet size={17} style={{ color: "#4A55BE" }} /> Advances
        </h2>
        <AdvanceForm />
        <div className="space-y-2 mb-10">
          {advances.length === 0 && (
            <p style={{ fontSize: 13, color: "#9B9188" }}>No advances recorded yet.</p>
          )}
          {advances.map((a) => (
            <div key={a.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#19140F" }}>{a.group?.name ?? "Unknown group"}</span>
                {a.notes && <span style={{ fontSize: 13, color: "#9B9188", marginLeft: 8 }}>{a.notes}</span>}
              </div>
              <div className="text-right">
                <p style={{ fontSize: 15, fontWeight: 700, color: "#4A55BE", margin: 0 }}>₹{Number(a.amount).toLocaleString("en-IN")}</p>
                <p style={{ fontSize: 11, color: "#9B9188", margin: 0 }}>{new Date(a.given_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <Receipt size={17} style={{ color: "#4A55BE" }} /> Expenses & Bills
        </h2>
        <div className="space-y-3">
          {expenses.length === 0 && (
            <p style={{ fontSize: 13, color: "#9B9188" }}>No expenses submitted yet.</p>
          )}
          {expenses.map((ex) => {
            const cat = categoryColors[ex.category] ?? categoryColors.other;
            const st = statusColors[ex.status] ?? statusColors.pending;
            return (
              <div key={ex.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#19140F" }}>{ex.submitter?.name ?? "Unknown"}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: cat.color, background: cat.bg, textTransform: "capitalize" }}>
                        {ex.category}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: st.color, background: st.bg, textTransform: "capitalize" }}>
                        {ex.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 4px" }}>{ex.group?.name ?? "No group"} · {ex.submitter?.email}</p>
                    {ex.description && <p style={{ fontSize: 13, color: "#5A5247", margin: "4px 0" }}>{ex.description}</p>}
                    {ex.bill_url && (
                      <a href={ex.bill_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4A55BE", display: "inline-block", marginTop: 2 }}>
                        View bill
                      </a>
                    )}
                    {ex.rejection_reason && (
                      <p style={{ fontSize: 12, color: "#DC2626", margin: "6px 0 0" }}>Rejected: {ex.rejection_reason}</p>
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
      </div>
    </div>
  );
}
