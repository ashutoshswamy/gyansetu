"use client";

import { useState } from "react";
import Link from "next/link";
import type { Tour } from "@/types";
import { MapPin, Calendar, Users } from "lucide-react";
import { DeleteTourButton } from "@/components/features/tours/delete-tour-button";
import { Button } from "@/components/ui/button";

const statusStyles: Record<Tour["status"], { color: string; background: string }> = {
  draft:     { color: "#9B9188", background: "rgba(90,82,71,0.08)" },
  open:      { color: "#2A5E3A", background: "rgba(42,94,58,0.08)" },
  closed:    { color: "#F5A520", background: "rgba(245,165,32,0.08)" },
  completed: { color: "#4A55BE", background: "rgba(74,85,190,0.08)" },
};

const TABS = ["All", "Active", "History"] as const;

export function ToursListClient({ tours }: { tours: Tour[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const filtered = tours.filter((tour) => {
    if (tab === "Active") return tour.status !== "completed";
    if (tab === "History") return tour.status === "completed";
    return true;
  });

  return (
    <>
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
            No tours in this view.
          </p>
        )}
        {filtered.map((tour) => {
          const s = statusStyles[tour.status];
          return (
            <div
              key={tour.id}
              className="flex items-center justify-between"
              style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }} className="truncate">{tour.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.background, flexShrink: 0, textTransform: "capitalize" }}>
                    {tour.status}
                  </span>
                  {!tour.participant_visible && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#A8641C", background: "rgba(168,100,28,0.08)", flexShrink: 0 }}>
                      Admin only
                    </span>
                  )}
                </div>
                <div className="flex gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {tour.destination}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} /> {tour.start_date} &rarr; {tour.end_date}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {tour.capacity} seats</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Link href={`/admin/tours/${tour.id}`}>
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
                <Link href={`/admin/tours/${tour.id}/edit`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <DeleteTourButton tourId={tour.id} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
