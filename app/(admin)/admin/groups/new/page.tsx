"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGroup } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createGroup({
        tour_id: fd.get("tour_id") as string,
        name: fd.get("name") as string,
        state_allocated: fd.get("state_allocated") as string || undefined,
        notes: fd.get("notes") as string || undefined,
      });
      router.push("/admin/groups");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create group";
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>New Group</h1>
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
              <Label className="mb-1.5">Tour <span className="text-destructive">*</span></Label>
              <Select name="tour_id" required items={tours.map(t => ({ value: t.id, label: t.title }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tour..." />
                </SelectTrigger>
                <SelectContent>
                  {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Group Name <span className="text-destructive">*</span></Label>
              <Input name="name" required placeholder="e.g. Team Rajasthan" />
            </div>
            <div>
              <Label className="mb-1.5">State/Union Territory Allocated</Label>
              <Input name="state_allocated" placeholder="e.g. Rajasthan" />
            </div>
            <div>
              <Label className="mb-1.5">Notes</Label>
              <Textarea name="notes" rows={3} placeholder="Enter notes" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
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
