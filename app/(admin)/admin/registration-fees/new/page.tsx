"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createRegistrationFee } from "@/actions/registration-fees";
import type { RegistrationFeeInput } from "@/lib/validations";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const STATUSES = ["pending", "paid", "waived", "refunded"] as const;

export default function NewRegistrationFeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [volunteerId, setVolunteerId] = useState("");

  useEffect(() => {
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createRegistrationFee({
        volunteer_id: fd.get("volunteer_id") as string,
        amount: Number(fd.get("amount")),
        status: fd.get("status") as RegistrationFeeInput["status"],
        payment_reference: (fd.get("payment_reference") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      router.push("/admin/registration-fees");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record registration fee";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Record Registration Fee</h1>
        </div>
        <Card>
<CardContent>
<form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-danger)" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Volunteer <span style={{ color: "var(--gs-danger)" }}>*</span></label>
              <VolunteerCombobox volunteers={volunteers} value={volunteerId} onChange={setVolunteerId} name="volunteer_id" />
            </div>
            <div>
              <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Amount (₹) <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
              <Input type="number" name="amount" min={0} step="0.01" required placeholder="Enter amount" />
            </div>
            <div>
              <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Status <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
              <Select
                name="status"
                required
                defaultValue="pending"
                items={STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Payment Reference</Label>
              <Input type="text" name="payment_reference" placeholder="Transaction ID / UPI ref..." />
            </div>
            <div>
              <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Notes</Label>
              <Textarea name="notes" rows={3} placeholder="Additional notes..." />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Record Fee"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
</CardContent>
</Card>
      </div>
    </div>
  );
}
