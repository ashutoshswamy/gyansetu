"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { CoreMemberEvaluationForm } from "@/components/features/demo-evaluations/core-member-evaluation-form";
import type { DemoEvaluation } from "@/types";

const statusStyles: Record<string, { color: string; bg: string }> = {
  draft: { color: "#A8641C", bg: "rgba(168,100,28,0.08)" },
  submitted: { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
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
        <button
          onClick={() => setMode("new")}
          style={{ background: "#4A55BE", color: "white", fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 5, border: "none", cursor: "pointer" }}
        >
          + New Evaluation
        </button>
      </div>
      {evaluations.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "24px", textAlign: "center" }}>
          <Star className="w-7 h-7 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
          <p style={{ fontSize: 13, color: "#9B9188" }}>No demo evaluations yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {evaluations.map(ev => {
            const s = statusStyles[ev.status] ?? statusStyles.submitted;
            return (
              <div key={ev.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>Score: {ev.total_score ?? 0}/100</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>{ev.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>{new Date(ev.evaluated_at).toLocaleDateString()}{ev.tour?.title ? ` · ${ev.tour.title}` : ""}</p>
                  {ev.remarks && <p style={{ fontSize: 12, color: "#5A5247", marginTop: 6 }}>{ev.remarks}</p>}
                </div>
                <button
                  onClick={() => setMode(ev.id)}
                  style={{ background: "transparent", color: "#4A55BE", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer", flexShrink: 0 }}
                >
                  Edit
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
