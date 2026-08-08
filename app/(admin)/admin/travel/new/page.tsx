"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTravelTicket } from "@/actions/travel";
import { getAllGroups } from "@/actions/groups";
import type { TravelTicketInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewTravelTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string; tours?: { title: string } | null }[]>([]);

  useEffect(() => {
    getAllGroups().then(data => setGroups(data as unknown as typeof groups)).catch(() => setGroups([]));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createTravelTicket({
        group_id: fd.get("group_id") as string,
        train_number: (fd.get("train_number") as string) || undefined,
        train_name: (fd.get("train_name") as string) || undefined,
        pnr: (fd.get("pnr") as string) || undefined,
        departure_station: (fd.get("departure_station") as string) || undefined,
        arrival_station: (fd.get("arrival_station") as string) || undefined,
        departure_at: (fd.get("departure_at") as string) || undefined,
        arrival_at: (fd.get("arrival_at") as string) || undefined,
        ticket_file_url: (fd.get("ticket_file_url") as string) || undefined,
        note: (fd.get("note") as string) || undefined,
        confirmation_status: fd.get("confirmation_status") as TravelTicketInput["confirmation_status"],
        itinerary_approved: fd.get("itinerary_approved") === "on",
      });
      router.push("/admin/travel");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create travel ticket";
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>New Travel Ticket</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 28 }}>
          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-5">
            <div>
              <Label className="mb-1.5">Group <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
              <Select name="group_id" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}{g.tours?.title ? ` — ${g.tours.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">Train Number</Label>
                <Input name="train_number" type="text" placeholder="Enter train number" />
              </div>
              <div>
                <Label className="mb-1.5">Train Name</Label>
                <Input name="train_name" type="text" placeholder="Enter train name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">From</Label>
                <Input name="departure_station" type="text" placeholder="Departure station" />
              </div>
              <div>
                <Label className="mb-1.5">Time</Label>
                <Input name="departure_at" type="datetime-local" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">To</Label>
                <Input name="arrival_station" type="text" placeholder="Arrival station" />
              </div>
              <div>
                <Label className="mb-1.5">Time</Label>
                <Input name="arrival_at" type="datetime-local" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5">PNR Number</Label>
              <Input name="pnr" type="text" placeholder="Enter PNR" />
            </div>
            <div>
              <Label className="mb-1.5">Current Status</Label>
              <Select name="confirmation_status" defaultValue="pending">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Note</Label>
              <Textarea name="note" rows={3} placeholder="Any additional notes..." />
            </div>
            <div>
              <Label className="mb-1.5">Ticket File URL</Label>
              <Input name="ticket_file_url" type="text" placeholder="https://..." />
            </div>
            <Label className="text-[13px] font-normal" style={{ color: "var(--gs-text-secondary)" }}>
              <Checkbox name="itinerary_approved" />
              Itinerary approved
            </Label>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Ticket"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
