import { getMyRegistrationFee } from "@/actions/registration-fees";
import { getMyCurrentTourGroup } from "@/actions/groups";
import { Wallet, CheckCircle2 } from "lucide-react";
import { RecordFeeForm } from "./submit-payment-form";

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
  pending:   { color: "#F5A520", bg: "rgba(245,165,32,0.05)", border: "rgba(245,165,32,0.2)" },
  submitted: { color: "#A8641C", bg: "rgba(168,100,28,0.05)", border: "rgba(168,100,28,0.2)" },
  paid:      { color: "#2A5E3A", bg: "rgba(42,94,58,0.05)", border: "rgba(42,94,58,0.2)" },
  waived:    { color: "#4A55BE", bg: "rgba(74,85,190,0.05)", border: "rgba(74,85,190,0.2)" },
  refunded:  { color: "#9B9188", bg: "rgba(155,145,136,0.08)", border: "rgba(155,145,136,0.2)" },
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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Registration Fee</h1>
        </div>

        {!fee ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "28px 26px" }}>
            <div className="flex items-start gap-4">
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(245,165,32,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Wallet size={22} style={{ color: "#F5A520" }} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 15, color: "#5A5247", margin: "0 0 4px" }}>You haven&apos;t recorded a registration fee payment yet.</p>
                <p style={{ fontSize: 13, color: "#9B9188", margin: 0 }}>Already paid? Fill in the details below.</p>
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
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: "4px 0 10px" }}>₹{fee.amount}</h3>
                    <p style={{ fontSize: 13, color: "#5A5247", margin: "0 0 4px" }}>Tour: {fee.tour?.title ?? "Not assigned"}</p>
                    <p style={{ fontSize: 13, color: "#5A5247", margin: "0 0 4px" }}>Group: {fee.group?.name ?? "Not assigned"}</p>
                    {fee.payment_reference && (
                      <p style={{ fontSize: 13, color: "#5A5247", margin: "0 0 4px" }}>Transaction ID: {fee.payment_reference}</p>
                    )}
                    {fee.paid_at && (
                      <p style={{ fontSize: 13, color: "#5A5247", margin: "0 0 4px" }}>Paid on {new Date(fee.paid_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
                    )}
                    {fee.notes && (
                      <p style={{ fontSize: 12, color: "#5A5247", marginTop: 8, padding: "6px 10px", background: c.bg, borderRadius: 5 }}>{fee.notes}</p>
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
