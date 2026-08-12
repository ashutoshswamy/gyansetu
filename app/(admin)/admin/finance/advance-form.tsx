"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createExpenseAdvance } from "@/actions/finance";
import { getAllGroups } from "@/actions/groups";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function AdvanceForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getAllGroups().then(data => setGroups(data as unknown as typeof groups)).catch(() => setGroups([]));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createExpenseAdvance({
        group_id: fd.get("group_id") as string,
        amount: Number(fd.get("amount")),
        notes: (fd.get("notes") as string) || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      (e.target as HTMLFormElement).reset();
      toast.success("Advance recorded successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record advance";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-5">
<CardContent>
<form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--gs-danger)" }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Group <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
          <Select name="group_id" items={groups.map(g => ({ value: g.id, label: g.name }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select group..." />
            </SelectTrigger>
            <SelectContent>
              {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Amount (₹) <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
          <Input name="amount" type="number" min="0" step="0.01" required placeholder="Enter amount" />
        </div>
        <Button type="submit" disabled={saving} className="h-[37px]">
          {saving ? "Saving..." : "Record Advance"}
        </Button>
      </div>
      <div style={{ marginTop: 12 }}>
        <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Notes</Label>
        <Input name="notes" type="text" placeholder="Enter notes" />
      </div>
    </form>
</CardContent>
</Card>
  );
}
