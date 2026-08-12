import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { getMyExpenses } from "@/actions/finance";
import { Receipt } from "lucide-react";
import { ExpenseForm } from "./expense-form";
import { ExpenseItem } from "./expense-item";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Expenses</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Submit bills and track approval status{group ? ` for ${group.name}` : ""}</p>
        </div>

        <ExpenseForm groupId={group?.id ?? null} />

        <div className="space-y-3 mt-8">
          {expenses.length === 0 && (
            <Card>
              <CardContent className="text-center">
                <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No expenses submitted yet.</p>
              </CardContent>
            </Card>
          )}
          {expenses.map((ex) => (
            <ExpenseItem key={ex.id} expense={ex} />
          ))}
        </div>
      </div>
    </div>
  );
}
