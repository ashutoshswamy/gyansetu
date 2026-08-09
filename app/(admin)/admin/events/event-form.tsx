"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEvent, updateEvent } from "@/actions/events";
import type { EventType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EVENT_TYPES = ["katta", "melawa", "training", "workshop", "meeting", "demo", "presentation", "celebration", "other"] as const;
const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;

type Tour = { id: string; title: string };

interface InitialData {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  tour_id?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  status: string;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "var(--gs-danger)", marginLeft: 2 }}>*</span>}
      </Label>
      {children}
    </div>
  );
}

export function EventForm({ tours, initialData }: { tours: Tour[]; initialData?: InitialData }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      event_type: fd.get("event_type") as EventType,
      tour_id: (fd.get("tour_id") as string) || undefined,
      event_date: fd.get("event_date") as string,
      event_time: (fd.get("event_time") as string) || undefined,
      location: (fd.get("location") as string) || undefined,
      status: fd.get("status") as "upcoming" | "ongoing" | "completed" | "cancelled",
    };
    try {
      if (isEdit) {
        await updateEvent(initialData!.id, payload);
      } else {
        await createEvent(payload);
      }
      toast.success(isEdit ? "Event updated successfully" : "Event created successfully");
      router.push("/admin/events");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save event";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <Card>
<CardContent>
<form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-danger)" }}>
          {error}
        </div>
      )}

      <div className="space-y-5">
        <Field label="Title" required>
          <Input name="title" required defaultValue={initialData?.title} placeholder="e.g. Gyan Setu Katta – Pre-Visit Orientation" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Event Type" required>
            <Select name="event_type" defaultValue={initialData?.event_type ?? "katta"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select event type..." />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Status" required>
            <Select name="status" defaultValue={initialData?.status ?? "upcoming"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {EVENT_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date" required>
            <Input name="event_date" type="date" required defaultValue={initialData?.event_date} />
          </Field>

          <Field label="Time">
            <Input name="event_time" type="time" defaultValue={initialData?.event_time ?? ""} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location">
            <Input name="location" defaultValue={initialData?.location ?? ""} placeholder="e.g. Pune / Online / School Hall" />
          </Field>

          <Field label="Linked Tour">
            <Select name="tour_id" defaultValue={initialData?.tour_id ?? undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No tour" />
              </SelectTrigger>
              <SelectContent>
                {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Description">
          <Textarea name="description" rows={4} defaultValue={initialData?.description ?? ""} placeholder="Agenda, objectives, notes..." />
        </Field>
      </div>

      <div className="flex gap-3 mt-6">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/events")}>
          Cancel
        </Button>
      </div>
    </form>
</CardContent>
</Card>
  );
}
