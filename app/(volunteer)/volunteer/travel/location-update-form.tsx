"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { postLocationUpdate } from "@/actions/travel";
import type { LocationUpdateInput } from "@/lib/validations";

const STATUS_OPTIONS: { value: NonNullable<LocationUpdateInput["status_type"]>; label: string }[] = [
  { value: "current_location", label: "Current Location" },
  { value: "train_delay", label: "Train Delay" },
  { value: "arrival_estimate", label: "Arrival Estimate" },
  { value: "other", label: "Other" },
];

export function LocationUpdateForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await postLocationUpdate({
        group_id: groupId,
        note: (fd.get("note") as string) || undefined,
        status_type: (fd.get("status_type") as LocationUpdateInput["status_type"]) || undefined,
        from_location: (fd.get("from_location") as string) || undefined,
        to_location: (fd.get("to_location") as string) || undefined,
      });
      (e.target as HTMLFormElement).reset();
      toast.success("Location updated successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to post update";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-5 mb-5">
      <h2 className="text-sm font-semibold text-foreground mb-3.5">Post Location Update</h2>
      {error && (
        <Alert variant="destructive" className="mb-3.5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="status_type" className="text-xs mb-1.5">Status Type</Label>
            <Select name="status_type">
              <SelectTrigger id="status_type">
                <SelectValue placeholder="Select...">
                  {(value: string | null) => STATUS_OPTIONS.find(o => o.value === value)?.label ?? "Select..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div />
          <div>
            <Label htmlFor="from_location" className="text-xs mb-1.5">From</Label>
            <Input id="from_location" name="from_location" type="text" placeholder="e.g. New Delhi" />
          </div>
          <div>
            <Label htmlFor="to_location" className="text-xs mb-1.5">To</Label>
            <Input id="to_location" name="to_location" type="text" placeholder="e.g. Mumbai Central" />
          </div>
        </div>
        <div>
          <Label htmlFor="note" className="text-xs mb-1.5">Note</Label>
          <Textarea id="note" name="note" rows={2} placeholder="e.g. Train running 40 min late" />
        </div>
      </div>
      <Button type="submit" disabled={saving} className="mt-3.5">
        {saving ? "Posting..." : "Post Update"}
      </Button>
    </form>
  );
}
