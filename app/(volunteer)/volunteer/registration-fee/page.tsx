import { getMyRegistrationFee } from "@/actions/registration-fees";
import { getMyCurrentTourGroup } from "@/actions/groups";
import { Wallet, CheckCircle2 } from "lucide-react";
import { RecordFeeForm } from "./submit-payment-form";

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
  pending:   { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.05)", border: "rgba(var(--gs-warning-rgb), 0.2)" },
  submitted: { color: "var(--gs-warning-alt)", bg: "rgba(var(--gs-warning-alt-rgb), 0.05)", border: "rgba(var(--gs-warning-alt-rgb), 0.2)" },
  paid:      { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.05)", border: "rgba(var(--gs-success-rgb), 0.2)" },
  waived:    { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.05)", border: "rgba(var(--gs-accent-rgb), 0.2)" },
  refunded:  { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.08)", border: "rgba(var(--gs-muted-rgb), 0.2)" },
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  submitted: "Pending",
  paid: "Approved",
  waived: "Waived",
  refunded: "Refunded",
};

export default async function VolunteerRegistrationFeePage() {
  const fee = await getMyRegistrationFee();
  const tourGroup = fee ? null : await getMyCurrentTourGroup();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Registration Fee</h1>
        </div>

        {!fee ? (
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 26px" }}>
            <div className="flex items-start gap-4">
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(var(--gs-warning-rgb), 0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Wallet size={22} style={{ color: "var(--gs-warning)" }} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 15, color: "var(--gs-text-secondary)", margin: "0 0 4px" }}>You haven&apos;t recorded a registration fee payment yet.</p>
                <p style={{ fontSize: 13, color: "var(--gs-muted)", margin: 0 }}>Already paid? Fill in the details below.</p>
                <RecordFeeForm tour={tourGroup?.tour ?? null} group={tourGroup?.group ?? null} />
              </div>
            </div>
          </div>
        ) : (
          (() => {
            const c = statusColors[fee.status] ?? statusColors.pending;
            return (
              <div style={{ background: "white", border: `1.5px solid ${c.border}`, borderRadius: 12, padding: "24px 26px" }}>
                <div className="flex items-start gap-4">
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {fee.status === "paid" ? <CheckCircle2 size={22} style={{ color: c.color }} /> : <Wallet size={22} style={{ color: c.color }} />}
                  </div>
                  <div className="flex-1">
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: c.color }}>{statusLabels[fee.status] ?? fee.status}</span>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: "4px 0 10px" }}>₹{fee.amount}</h3>
                    <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "0 0 4px" }}>Tour: {fee.tour?.title ?? "Not assigned"}</p>
                    <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "0 0 4px" }}>Group: {fee.group?.name ?? "Not assigned"}</p>
                    {fee.payment_reference && (
                      <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "0 0 4px" }}>Transaction ID: {fee.payment_reference}</p>
                    )}
                    {fee.paid_at && (
                      <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "0 0 4px" }}>Paid on {new Date(fee.paid_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
                    )}
                    {fee.notes && (
                      <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", marginTop: 8, padding: "6px 10px", background: c.bg, borderRadius: 5 }}>{fee.notes}</p>
                    )}
                    {fee.status === "pending" && <RecordFeeForm tour={fee.tour ?? null} group={fee.group ?? null} presetAmount={fee.amount} />}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
