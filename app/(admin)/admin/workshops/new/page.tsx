"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createWorkshop } from "@/actions/workshops";
import { getAllGroups } from "@/actions/groups";
import type { WorkshopType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WORKSHOP_TYPES: { value: WorkshopType; label: string }[] = [
  { value: "science", label: "Science" },
  { value: "mathematics", label: "Mathematics" },
  { value: "exhibition_country", label: "Exhibition- Know our Country" },
  { value: "cultural_survey", label: "Cultural and Survey" },
  { value: "other", label: "Other" },
];

export default function NewWorkshopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [trainerChoice, setTrainerChoice] = useState<"none" | "gs_team_other">("none");
  const [workshopType, setWorkshopType] = useState<WorkshopType>("science");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  const [kitReady, setKitReady] = useState(false);

  useEffect(() => {
    getAllGroups().then(data => setGroups(data.map(g => ({ id: g.id, name: g.name }))));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const date = fd.get("workshop_date") as string;
    const time = (fd.get("workshop_time") as string) || undefined;
    const hall_location = (fd.get("hall_location") as string) || undefined;
    const plan_notes = (fd.get("plan_notes") as string) || undefined;
    const trainer_name = trainerChoice === "gs_team_other" ? (fd.get("trainer_name") as string) || undefined : undefined;

    try {
      await createWorkshop({
        title,
        workshop_type: workshopType,
        workshop_date: date,
        workshop_time: time,
        hall_location,
        trainer_name,
        plan_notes,
        kit_ready: kitReady,
        status,
        group_ids: selectedGroupIds,
      });

      toast.success("Workshop created successfully");
      router.push("/admin/workshops");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create workshop";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">New Workshop</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive" className="mb-5">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Title <span className="text-destructive">*</span></Label>
                  <Input name="title" required placeholder="e.g. Science Workshop - Solar System" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Type <span className="text-destructive">*</span></Label>
                    <Select value={workshopType} onValueChange={(v) => setWorkshopType(v as WorkshopType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKSHOP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Status <span className="text-destructive">*</span></Label>
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as "scheduled" | "completed" | "cancelled")}
                      items={[
                        { value: "scheduled", label: "Scheduled" },
                        { value: "completed", label: "Completed" },
                        { value: "cancelled", label: "Cancelled" },
                      ]}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Date <span className="text-destructive">*</span></Label>
                    <Input name="workshop_date" type="date" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Time</Label>
                    <Input name="workshop_time" type="time" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Hall / Location</Label>
                  <Input name="hall_location" placeholder="e.g. Main Hall" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Trainer</Label>
                  <Select
                    value={trainerChoice}
                    onValueChange={(v) => setTrainerChoice(v as "none" | "gs_team_other")}
                    items={[
                      { value: "none", label: "No trainer assigned" },
                      { value: "gs_team_other", label: "GS Team / Other" },
                    ]}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select trainer choice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No trainer assigned</SelectItem>
                      <SelectItem value="gs_team_other">GS Team / Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {trainerChoice === "gs_team_other" && (
                    <Input name="trainer_name" placeholder="Trainer Name" className="mt-2" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Assign to Group</Label>
                  <div className="border border-input rounded-md p-2 max-h-35 overflow-y-auto space-y-1">
                    {groups.map(g => {
                      const checked = selectedGroupIds.includes(g.id);
                      return (
                        <Label key={g.id} className="flex items-center gap-2 p-1 rounded hover:bg-accent/10 cursor-pointer text-xs">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => setSelectedGroupIds(c ? [...selectedGroupIds, g.id] : selectedGroupIds.filter(id => id !== g.id))}
                          />
                          {g.name}
                        </Label>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Plan Notes</Label>
                  <Textarea name="plan_notes" rows={3} placeholder="Preparation notes, agenda, materials needed..." />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="kit_ready" checked={kitReady} onCheckedChange={(c) => setKitReady(!!c)} />
                  <Label htmlFor="kit_ready" className="text-xs font-normal text-muted-foreground cursor-pointer">Kit is ready</Label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="submit" disabled={loading} className="font-semibold">
                  {loading ? "Creating..." : "Create Workshop"}
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
