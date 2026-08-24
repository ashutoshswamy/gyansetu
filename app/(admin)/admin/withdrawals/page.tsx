import { createServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import { WithdrawalActions } from "./withdrawal-actions";

interface WithdrawalRow {
  id: string;
  status: string;
  withdrawal_reason?: string;
  withdrawal_requested_at?: string;
  updated_at: string;
  student?: { name: string; email: string };
  tour?: { title: string };
}

export default async function AdminWithdrawalsPage() {
  const db = createServerClient();

  const { data } = await db
    .from("tour_applications")
    .select("id, status, withdrawal_reason, withdrawal_requested_at, updated_at, student:users(name, email), tour:tours(title)")
    .in("status", ["withdrawal_requested", "withdrawn"])
    .order("withdrawal_requested_at", { ascending: false });

  const requests = (data ?? []) as unknown as WithdrawalRow[];
  const pending = requests.filter((r) => r.status === "withdrawal_requested");
  const resolved = requests.filter((r) => r.status === "withdrawn");

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Withdrawal Requests</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{pending.length} pending approval</p>
        </div>

        <div className="space-y-3">
          {requests.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No withdrawal requests yet.</p>
          )}
          {[...pending, ...resolved].map((r) => {
            const isPending = r.status === "withdrawal_requested";
            const c = isPending
              ? { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" }
              : { color: "var(--gs-muted)", bg: "rgba(90,82,71,0.08)" };
            return (
              <Card key={r.id}>
                <CardContent className="flex items-center gap-4 pt-4">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <LogOut size={18} style={{ color: c.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{r.student?.name ?? "Unknown"}</span>
                      <Badge style={{ color: c.color, background: c.bg, textTransform: "capitalize" }}>
                        {isPending ? "Pending" : "Withdrawn"}
                      </Badge>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                      {r.student?.email}
                      {r.tour?.title ? ` · ${r.tour.title}` : ""}
                      {r.withdrawal_requested_at ? ` · Requested ${formatDate(r.withdrawal_requested_at)}` : ""}
                    </div>
                    {r.withdrawal_reason && (
                      <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", marginTop: 6, padding: "6px 10px", background: "var(--gs-card)", border: "1px solid var(--border)", borderRadius: 5 }}>
                        {r.withdrawal_reason}
                      </p>
                    )}
                  </div>
                  {isPending && <WithdrawalActions applicationId={r.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
