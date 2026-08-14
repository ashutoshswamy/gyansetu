"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertKitAssignment } from "@/actions/kits";
import { getAllGroups } from "@/actions/groups";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NewAssignmentForm({ assignedGroupIds }: { assignedGroupIds: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string; tours?: { title: string }[] | null }[]>([]);
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    getAllGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  const availableGroups = groups.filter(g => !assignedGroupIds.includes(g.id));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!groupId) {
      setError("Please select a group");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await upsertKitAssignment({
        group_id: groupId,
        school_count: Number(fd.get("school_count")) || 1,
        packed: false,
        distributed: false,
      });
      (e.target as HTMLFormElement).reset();
      setGroupId("");
      toast.success("Kit assigned successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create assignment";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (availableGroups.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Group *</Label>
              <Select
                value={groupId}
                onValueChange={(val) => setGroupId(val ?? "")}
                items={availableGroups.map(g => ({
                  value: g.id,
                  label: `${g.name}${g.tours?.[0]?.title ? ` — ${g.tours[0].title}` : ""}`,
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}{g.tours?.[0]?.title ? ` — ${g.tours[0].title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">School Count *</Label>
              <Input name="school_count" type="number" min={1} defaultValue={1} required placeholder="Enter number of schools" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="mt-4 font-semibold">
            {loading ? "Saving..." : "+ Assign Kit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
