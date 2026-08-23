"use client";

import { useState } from "react";
import Link from "next/link";
import type { Tour } from "@/types";
import { MapPin, Calendar, Users } from "lucide-react";
import { DeleteTourButton } from "@/components/features/tours/delete-tour-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/format-date";

const statusStyles: Record<Tour["status"], { color: string; background: string }> = {
  draft:     { color: "var(--gs-muted)", background: "rgba(90,82,71,0.08)" },
  open:      { color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)" },
  closed:    { color: "var(--gs-warning)", background: "rgba(var(--gs-warning-rgb), 0.08)" },
  completed: { color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.08)" },
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
          <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
            No tours in this view.
          </p>
        )}
        {filtered.map((tour) => {
          const s = statusStyles[tour.status];
          return (
            <Card key={tour.id}>
<CardContent>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }} className="truncate">{tour.title}</h3>
                  <Badge style={{color: s.color, background: s.background, flexShrink: 0, textTransform: "capitalize"}}>
                    {tour.status}
                  </Badge>
                  {!tour.participant_visible && (
                    <Badge style={{color: "var(--gs-warning-alt)", background: "rgba(var(--gs-warning-alt-rgb), 0.08)", flexShrink: 0}}>
                      Admin only
                    </Badge>
                  )}
                </div>
                <div className="flex gap-4" style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {tour.destination}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} /> {formatDateRange(tour.start_date, tour.end_date)}</span>
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
            </CardContent>
</Card>
          );
        })}
      </div>
    </>
  );
}
