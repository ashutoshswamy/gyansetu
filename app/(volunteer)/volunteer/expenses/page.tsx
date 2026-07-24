import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { getMyExpenses } from "@/actions/finance";
import { Receipt } from "lucide-react";
import { ExpenseForm } from "./expense-form";
import { ReceiptButton } from "@/components/features/expenses/receipt-button";

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
  pending:  { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  approved: { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  rejected: { color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
};

export default async function VolunteerExpensesPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: currentUser } = await db.from("users").select("id").eq("clerk_id", userId!).single();
  const { data: membership } = await db
    .from("tour_group_members")
    .select("tour_groups(id, name)")
    .eq("user_id", currentUser?.id ?? "")
    .limit(1)
    .maybeSingle();
  const group = membership?.tour_groups as unknown as { id: string; name: string } | null;

  const expenses = await getMyExpenses();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Expenses</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Submit bills and track approval status{group ? ` for ${group.name}` : ""}</p>
        </div>

        <ExpenseForm groupId={group?.id ?? null} />

        <div className="space-y-3">
          {expenses.length === 0 && (
            <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 15, color: "#5A5247" }}>No expenses submitted yet.</p>
            </div>
          )}
          {expenses.map((ex) => {
            const cat = categoryColors[ex.category] ?? categoryColors.miscellaneous;
            const st = statusColors[ex.status] ?? statusColors.pending;
            return (
              <div key={ex.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: cat.color, background: cat.bg }}>
                        {categoryLabels[ex.category] ?? ex.category}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: st.color, background: st.bg, textTransform: "capitalize" }}>
                        {ex.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 4px" }}>
                      {ex.group?.name ?? "No group"} · {new Date(ex.expense_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                      {ex.subcategory ? ` · ${ex.subcategory}` : ""}
                      {ex.volunteer_count ? ` · ${ex.volunteer_count} volunteer${ex.volunteer_count !== 1 ? "s" : ""}` : ""}
                      {ex.vendor_name ? ` · ${ex.vendor_name}` : ""}
                    </p>
                    {ex.description && <p style={{ fontSize: 13, color: "#5A5247", margin: "4px 0" }}>{ex.description}</p>}
                    <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 4 }}>
                      {ex.bill_url && (
                        <a href={ex.bill_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4A55BE", display: "inline-block" }}>
                          View bill
                        </a>
                      )}
                      <ReceiptButton expense={ex} />
                    </div>
                    {ex.rejection_reason && (
                      <p style={{ fontSize: 12, color: "#DC2626", margin: "6px 0 0" }}>Rejected: {ex.rejection_reason}</p>
                    )}
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#19140F", margin: 0, flexShrink: 0 }}>₹{Number(ex.amount).toLocaleString("en-IN")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
