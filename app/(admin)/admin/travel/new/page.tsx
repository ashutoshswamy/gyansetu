"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTravelTicket } from "@/actions/travel";
import { createClientClient } from "@/lib/supabase/client";
import type { TravelTicketInput } from "@/lib/validations";

export default function NewTravelTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string; tours?: { title: string } | null }[]>([]);

  useEffect(() => {
    createClientClient()
      .from("tour_groups")
      .select("id, name, tours(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGroups((data as unknown as typeof groups) ?? []));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createTravelTicket({
        group_id: fd.get("group_id") as string,
        train_number: (fd.get("train_number") as string) || undefined,
        pnr: (fd.get("pnr") as string) || undefined,
        departure_station: (fd.get("departure_station") as string) || undefined,
        arrival_station: (fd.get("arrival_station") as string) || undefined,
        departure_at: (fd.get("departure_at") as string) || undefined,
        arrival_at: (fd.get("arrival_at") as string) || undefined,
        ticket_file_url: (fd.get("ticket_file_url") as string) || undefined,
        confirmation_status: fd.get("confirmation_status") as TravelTicketInput["confirmation_status"],
        itinerary_approved: fd.get("itinerary_approved") === "on",
      });
      router.push("/admin/travel");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create travel ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>New Travel Ticket</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Group <span style={{ color: "#DC2626" }}>*</span></label>
              <select name="group_id" required style={inputStyle}>
                <option value="">Select group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}{g.tours?.title ? ` — ${g.tours.title}` : ""}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Train Number</label>
                <input name="train_number" type="text" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>PNR</label>
                <input name="pnr" type="text" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Departure Station</label>
                <input name="departure_station" type="text" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Arrival Station</label>
                <input name="arrival_station" type="text" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Departure At</label>
                <input name="departure_at" type="datetime-local" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Arrival At</label>
                <input name="arrival_at" type="datetime-local" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Ticket File URL</label>
              <input name="ticket_file_url" type="text" placeholder="https://..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Confirmation Status</label>
              <select name="confirmation_status" defaultValue="pending" style={inputStyle}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <label className="flex items-center gap-2" style={{ fontSize: 13, color: "#5A5247" }}>
              <input name="itinerary_approved" type="checkbox" />
              Itinerary approved
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating..." : "Create Ticket"}
            </button>
            <button type="button" onClick={() => router.back()} style={{ background: "transparent", color: "#5A5247", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid #E4DFD1", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
