"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.10)" },
  submitted: { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
};

interface SchoolSession {
  standard?: string;
  division?: string;
  num_students?: number;
  theme_topic?: string;
  duration_minutes?: number;
  language_used?: string;
  combined_session?: boolean;
}

export interface SchoolReportRow {
  id: string;
  created_at: string;
  status: string;
  school_name: string;
  school_type?: string;
  location_category?: string;
  medium_of_instruction?: string;
  street_area?: string;
  village_town?: string;
  taluka_tehsil?: string;
  district?: string;
  state?: string;
  pincode?: string;
  principal_name?: string;
  principal_mobile?: string;
  coordinator_name?: string;
  coordinator_mobile?: string;
  visit_date?: string;
  volunteers_present_count?: number;
  volunteer_names?: string[];
  sessions?: SchoolSession[];
  student_response?: string;
  what_went_well?: string;
  challenges_faced?: string;
  suggestions_improvement?: string;
  memorable_moment?: string;
  overall_feedback?: string;
  overall_rating?: string;
  follow_up_required?: boolean;
  additional_remarks?: string;
}

const NARRATIVE_FIELDS: { key: keyof SchoolReportRow; label: string }[] = [
  { key: "student_response", label: "Student Response" },
  { key: "what_went_well", label: "What Went Well" },
  { key: "challenges_faced", label: "Challenges Faced" },
  { key: "suggestions_improvement", label: "Suggestions for Improvement" },
  { key: "memorable_moment", label: "Memorable Moment" },
  { key: "overall_feedback", label: "Overall Feedback" },
];

export function VolunteerReportRow({ name, email, reports }: { name: string; email?: string; reports: SchoolReportRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={reports.length === 0}
        className="flex items-center justify-between w-full"
        style={{ padding: "10px 14px", background: "none", border: "none", cursor: reports.length ? "pointer" : "default", textAlign: "left" }}
      >
        <div className="flex items-center gap-2">
          {reports.length > 0 ? (open ? <ChevronDown size={14} style={{ color: "var(--gs-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--gs-muted)" }} />) : <span style={{ width: 14 }} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{name}</div>
            {email && <div style={{ fontSize: 11, color: "var(--gs-muted)" }}>{email}</div>}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: reports.length ? "var(--gs-success)" : "var(--gs-muted)", background: reports.length ? "rgba(var(--gs-success-rgb), 0.08)" : "rgba(var(--gs-muted-rgb), 0.1)" }}>
          {reports.length === 0 ? "No reports" : `${reports.length} report${reports.length > 1 ? "s" : ""}`}
        </span>
      </button>

      {open && reports.length > 0 && (
        <div className="space-y-3" style={{ padding: "0 14px 14px" }}>
          {reports.map(r => {
            const s = statusColors[r.status] ?? statusColors.draft;
            const sessions = r.sessions ?? [];
            return (
              <div key={r.id} style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{r.school_name}</span>
                      {r.school_type && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.08)" }}>
                          {r.school_type}
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                        {r.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>
                      {[r.village_town, r.taluka_tehsil, r.district, r.state].filter(Boolean).join(", ")}
                      {r.pincode ? ` - ${r.pincode}` : ""}
                      {" · "}{new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-3" style={{ fontSize: 12, color: "var(--gs-text-secondary)" }}>
                  {r.visit_date && <span>Visit Date: <strong>{new Date(r.visit_date).toLocaleDateString()}</strong></span>}
                  {r.location_category && <span>Location: <strong>{r.location_category}</strong></span>}
                  {r.medium_of_instruction && <span>Medium: <strong>{r.medium_of_instruction}</strong></span>}
                  {r.volunteers_present_count != null && <span>Volunteers Present: <strong>{r.volunteers_present_count}</strong></span>}
                </div>

                {(r.principal_name || r.coordinator_name) && (
                  <div className="flex flex-wrap gap-4 mb-3" style={{ fontSize: 12, color: "var(--gs-text-secondary)" }}>
                    {r.principal_name && <span>Principal: <strong>{r.principal_name}</strong>{r.principal_mobile ? ` (${r.principal_mobile})` : ""}</span>}
                    {r.coordinator_name && <span>Coordinator: <strong>{r.coordinator_name}</strong>{r.coordinator_mobile ? ` (${r.coordinator_mobile})` : ""}</span>}
                  </div>
                )}

                {sessions.length > 0 && (
                  <div className="mb-3">
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 4 }}>Sessions Conducted</p>
                    <div className="space-y-1">
                      {sessions.map((sess, i) => (
                        <p key={i} style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                          {[sess.standard, sess.division].filter(Boolean).join("-") || "Class -"} · {sess.theme_topic || "-"} · {sess.num_students ?? "-"} students · {sess.duration_minutes ?? "-"} min{sess.language_used ? ` · ${sess.language_used}` : ""}{sess.combined_session ? " · Combined" : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {r.volunteer_names && r.volunteer_names.length > 0 && (
                  <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", margin: "0 0 12px" }}>
                    <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Volunteers: </span>{r.volunteer_names.join(", ")}
                  </p>
                )}

                <div className="space-y-2">
                  {NARRATIVE_FIELDS.map(f => {
                    const val = r[f.key] as string | undefined;
                    if (!val) return null;
                    return (
                      <div key={f.key}>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 2 }}>{f.label}</p>
                        <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>{val}</p>
                      </div>
                    );
                  })}

                  {r.overall_rating && (
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                      <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Overall Rating: </span>{r.overall_rating}
                    </p>
                  )}
                  {r.follow_up_required !== undefined && r.follow_up_required !== null && (
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                      <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Follow-up Required: </span>{r.follow_up_required ? "Yes" : "No"}
                    </p>
                  )}
                  {r.additional_remarks && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 2 }}>Additional Remarks</p>
                      <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>{r.additional_remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
