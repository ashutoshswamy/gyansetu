import { getAllRegistrationFees } from "@/actions/registration-fees";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { MarkPaidButton } from "./mark-paid-button";

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:  { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  paid:     { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  waived:   { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  refunded: { color: "#9B9188", bg: "rgba(155,145,136,0.1)" },
};

export default async function AdminRegistrationFeesPage() {
  const fees = await getAllRegistrationFees();

  const counts = { pending: 0, paid: 0, waived: 0, refunded: 0 };
  for (const f of fees) counts[f.status as keyof typeof counts]++;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Registration Fees</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{fees.length} fee record{fees.length !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/admin/registration-fees/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + Record Fee
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(counts).map(([status, count]) => {
            const c = statusColors[status];
            return (
              <div key={status} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 18px" }}>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 6 }}>{status}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: c.color, margin: 0 }}>{count}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {fees.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No registration fee records yet.</p>
          )}
          {fees.map((fee) => {
            const c = statusColors[fee.status] ?? statusColors.pending;
            return (
              <div key={fee.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Wallet size={18} style={{ color: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }}>{fee.volunteer?.name ?? "Unknown"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: c.color, background: c.bg, textTransform: "capitalize" }}>
                      {fee.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9B9188" }}>
                    {fee.volunteer?.email} · ₹{fee.amount}
                    {fee.payment_reference ? ` · Ref: ${fee.payment_reference}` : ""}
                    {fee.paid_at ? ` · Paid ${new Date(fee.paid_at).toLocaleDateString()}` : ""}
                  </div>
                </div>
                {fee.status === "pending" && <MarkPaidButton feeId={fee.id} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
