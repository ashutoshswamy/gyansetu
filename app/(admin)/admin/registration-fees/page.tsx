import { getAllRegistrationFees } from "@/actions/registration-fees";
import { getPaymentSettings } from "@/actions/payment-settings";
import { formatDate } from "@/lib/format-date";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/features/export-button";
import { MarkPaidButton } from "./mark-paid-button";
import { RejectPaymentButton } from "./reject-payment-button";
import { PaymentSettingsForm } from "./payment-settings-form";

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:   { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  submitted: { color: "var(--gs-warning-alt)", bg: "rgba(var(--gs-warning-alt-rgb), 0.08)" },
  paid:      { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  waived:    { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  refunded:  { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.1)" },
  rejected:  { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)" },
};

export default async function AdminRegistrationFeesPage() {
  const [fees, paymentSettings] = await Promise.all([getAllRegistrationFees(), getPaymentSettings()]);

  const counts = { pending: 0, submitted: 0, paid: 0, waived: 0, refunded: 0, rejected: 0 };
  for (const f of fees) counts[f.status as keyof typeof counts]++;

  const exportData = fees.map(f => ({
    volunteer_name: f.volunteer?.name ?? "",
    volunteer_email: f.volunteer?.email ?? "",
    amount: f.amount,
    status: f.status,
    tour: f.tour?.title ?? "",
    group: f.group?.name ?? "",
    payment_reference: f.payment_reference ?? "",
    submitted_at: f.submitted_at ?? "",
    paid_at: f.paid_at ?? "",
    rejection_reason: f.rejection_reason ?? "",
    notes: f.notes ?? "",
  }));

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Registration Fees</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{fees.length} fee record{fees.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <PaymentSettingsForm settings={paymentSettings} />
            <ExportButton data={exportData} filename="registration-fees.csv" />
            <Link href="/admin/registration-fees/new">
              <Button>+ Record Fee</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Object.entries(counts).map(([status, count]) => {
            const c = statusColors[status];
            return (
              <Card key={status}>
                <CardContent className="pt-4">
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 6 }}>{status}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: c.color, margin: 0 }}>{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-3">
          {fees.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No registration fee records yet.</p>
          )}
          {fees.map((fee) => {
            const c = statusColors[fee.status] ?? statusColors.pending;
            return (
              <Card key={fee.id}>
                <CardContent className="flex items-center gap-4 pt-4">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Wallet size={18} style={{ color: c.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{fee.volunteer?.name ?? "Unknown"}</span>
                      <Badge style={{ color: c.color, background: c.bg, textTransform: "capitalize" }}>
                        {fee.status}
                      </Badge>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                      {fee.volunteer?.email} · ₹{fee.amount}
                      {fee.tour?.title ? ` · ${fee.tour.title}` : ""}
                      {fee.group?.name ? ` (${fee.group.name})` : ""}
                      {fee.payment_reference ? ` · Ref: ${fee.payment_reference}` : ""}
                      {fee.paid_at ? ` · Paid ${formatDate(fee.paid_at)}` : ""}
                    </div>
                    {fee.status === "rejected" && fee.rejection_reason && (
                      <p style={{ fontSize: 12, color: "var(--gs-danger)", marginTop: 6, padding: "6px 10px", background: "var(--gs-danger-bg)", borderRadius: 5 }}>
                        Rejected: {fee.rejection_reason}
                      </p>
                    )}
                  </div>
                  {fee.status === "pending" && <MarkPaidButton feeId={fee.id} />}
                  {fee.status === "submitted" && (
                    <div className="flex items-center gap-2">
                      <MarkPaidButton feeId={fee.id} label="Verify Payment" />
                      <RejectPaymentButton feeId={fee.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
