"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { CoreMemberEvaluationForm } from "@/components/features/demo-evaluations/core-member-evaluation-form";
import type { DemoEvaluation } from "@/types";
import { formatDate } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusStyles: Record<string, { color: string; bg: string }> = {
  draft: { color: "var(--gs-warning-alt)", bg: "rgba(var(--gs-warning-alt-rgb), 0.08)" },
  submitted: { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
};

export function CoreMemberEvaluationSection({
  groupId, volunteerId, tourId, evaluations,
}: {
  groupId: string;
  volunteerId: string;
  tourId?: string | null;
  evaluations: DemoEvaluation[];
}) {
  const [mode, setMode] = useState<"list" | "new" | string>("list");
  const editing = evaluations.find(e => e.id === mode);

  if (mode === "new" || editing) {
    return (
      <CoreMemberEvaluationForm
        groupId={groupId}
        volunteerId={volunteerId}
        tourId={tourId}
        evaluation={editing}
        onDone={() => setMode("list")}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button
          onClick={() => setMode("new")}
          size="sm"
          style={{ background: "var(--gs-accent)" }}
          className="text-white"
        >
          + New Evaluation
        </Button>
      </div>
      {evaluations.length === 0 ? (
        <Card>
<CardContent className="text-center">
          <Star className="w-7 h-7 mx-auto mb-2" style={{ color: "var(--border)" }} />
          <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No demo evaluations yet.</p>
        </CardContent>
</Card>
      ) : (
        <div className="space-y-2">
          {evaluations.map(ev => {
            const s = statusStyles[ev.status] ?? statusStyles.submitted;
            return (
              <Card key={ev.id}>
<CardContent className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Score: {ev.total_score ?? 0}/100</span>
                    <Badge style={{color: s.color, background: s.bg, textTransform: "capitalize"}}>{ev.status}</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>{formatDate(ev.evaluated_at)}{ev.tour?.title ? ` · ${ev.tour.title}` : ""}</p>
                  {ev.remarks && <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", marginTop: 6 }}>{ev.remarks}</p>}
                </div>
                <Button
                  onClick={() => setMode(ev.id)}
                  variant="outline"
                  size="sm"
                  style={{ color: "var(--gs-accent)", borderColor: "rgba(var(--gs-accent-rgb), 0.28)" }}
                  className="flex-shrink-0"
                >
                  Edit
                </Button>
              </CardContent>
</Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
