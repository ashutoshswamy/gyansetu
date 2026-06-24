import { CheckCircle, Circle, ArrowRight } from "lucide-react";

export interface JourneyStep {
  number: number;
  title: string;
  description: string;
  status: "completed" | "current" | "pending";
  detail?: string; // e.g. tour name, state name
}

const STEP_COLORS = {
  completed: { circle: "#2A5E3A", bg: "rgba(42,94,58,0.08)", text: "#2A5E3A", border: "rgba(42,94,58,0.2)" },
  current:   { circle: "#4A55BE", bg: "rgba(74,85,190,0.10)", text: "#4A55BE", border: "rgba(74,85,190,0.3)" },
  pending:   { circle: "#D4CFC6", bg: "#F3F0E8", text: "#9B9188", border: "#E4DFD1" },
};

export function JourneyProgress({ steps, currentStep }: { steps: JourneyStep[]; currentStep: number }) {
  // Zigzag layout: 3, 3, 2
  const rows = [
    steps.slice(0, 3),
    steps.slice(3, 6),
    steps.slice(6, 8),
  ];

  return (
    <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "24px 28px" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", margin: 0 }}>
          Your Journey
        </p>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#19140F", margin: "4px 0 0" }}>
          Gyan Setu Journey — Step {currentStep} of {steps.length}
        </h2>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#F0EDE4", borderRadius: 2, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, #2A5E3A, #4A55BE)", borderRadius: 2, width: `${(currentStep / steps.length) * 100}%`, transition: "width 0.5s ease" }} />
      </div>

      <div className="space-y-4">
        {rows.map((row, rowIdx) => {
          const reversed = rowIdx % 2 === 1;
          const displayRow = reversed ? [...row].reverse() : row;
          return (
            <div key={rowIdx}>
              <div className="flex items-stretch gap-2">
                {displayRow.map((step, i) => {
                  const c = STEP_COLORS[step.status];
                  const isLast = i === displayRow.length - 1;
                  return (
                    <div key={step.number} className="flex items-center" style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{ flex: 1, minWidth: 0, border: `1.5px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", background: c.bg, position: "relative" }}
                      >
                        <div className="flex items-start gap-3">
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.circle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {step.status === "completed" ? (
                              <CheckCircle size={16} color="white" fill="white" strokeWidth={0} />
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, color: step.status === "current" ? "white" : "#9B9188" }}>
                                {step.number.toString().padStart(2, "0")}
                              </span>
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: step.status === "pending" ? "#9B9188" : "#19140F", margin: 0, lineHeight: 1.3 }}>
                              {step.title}
                            </p>
                            <p style={{ fontSize: 11, color: "#9B9188", margin: "3px 0 0", lineHeight: 1.4 }}>
                              {step.description}
                            </p>
                            {step.detail && step.status !== "pending" && (
                              <p style={{ fontSize: 11, fontWeight: 600, color: c.text, margin: "4px 0 0", background: "rgba(255,255,255,0.6)", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>
                                {step.detail}
                              </p>
                            )}
                          </div>
                        </div>
                        {step.status === "current" && (
                          <span style={{ position: "absolute", top: 8, right: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#4A55BE", textTransform: "uppercase" }}>
                            NOW
                          </span>
                        )}
                      </div>
                      {!isLast && (
                        <ArrowRight size={14} style={{ color: "#D4CFC6", flexShrink: 0, margin: "0 4px" }} />
                      )}
                    </div>
                  );
                })}
                {/* Pad incomplete rows */}
                {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, pi) => (
                  <div key={`pad-${pi}`} style={{ flex: 1 }} />
                ))}
              </div>
              {/* Arrow between rows */}
              {rowIdx < rows.length - 1 && (
                <div style={{ display: "flex", justifyContent: reversed ? "flex-start" : "flex-end", padding: "2px 6px" }}>
                  <div style={{ width: 0, height: 16, borderLeft: "2px dashed #E4DFD1", marginRight: reversed ? 0 : 20 }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function buildJourneySteps(data: {
  hasApplication: boolean;
  applicationStatus?: string;
  hasTrainingEvent: boolean;
  hasGroup: boolean;
  groupState?: string;
  hasOrientationEvent: boolean;
  hasDemoEvent: boolean;
  hasDailyLog: boolean;
  hasFeedbackMeeting: boolean;
  tourTitle?: string;
}): { steps: JourneyStep[]; currentStep: number } {
  const checks = [
    data.hasApplication,
    data.hasTrainingEvent,
    data.hasGroup,
    !!data.groupState,
    data.hasOrientationEvent,
    data.hasDemoEvent,
    data.hasDailyLog,
    data.hasFeedbackMeeting,
  ];

  let currentIdx = checks.findIndex(c => !c);
  if (currentIdx === -1) currentIdx = 8;

  const stepDefs = [
    { title: "Registration",     description: "Register for an upcoming Gyan Setu visit",        detail: data.tourTitle },
    { title: "Training",         description: "Attend one-day training workshops with volunteers" },
    { title: "Group Formation",  description: "All volunteers divided into visit groups"          },
    { title: "State Allocation", description: "State and place allocated to your group",          detail: data.groupState },
    { title: "Orientation",      description: "Orientation and demo sessions conducted"           },
    { title: "Demonstration",    description: "Quick demo to better understand the approach"      },
    { title: "Actual Visit",     description: "Travel to allocated state for the community visit" },
    { title: "Feedback Meeting", description: "Post-visit feedback meeting and report submission" },
  ];

  const steps: JourneyStep[] = stepDefs.map((def, i) => ({
    number: i + 1,
    ...def,
    status: i < currentIdx ? "completed" : i === currentIdx ? "current" : "pending",
  }));

  return { steps, currentStep: Math.min(currentIdx + 1, 8) };
}
