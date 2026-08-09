import { createServerClient } from "@/lib/supabase/server";
import { getVolunteerDetailForCoreMember } from "@/actions/core-member";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, GraduationCap, FileText, CalendarDays, Star, BookOpen, School, Plane, Receipt, ClipboardList, Image as ImageIcon, NotebookPen } from "lucide-react";
import { CoreMemberEvaluationSection } from "@/components/features/demo-evaluations/core-member-evaluation-section";
import { VolunteerObservations } from "@/components/features/core-member/volunteer-observations";
import { VolunteerFormSubmissions } from "@/components/features/core-member/volunteer-form-submissions";
import { VolunteerReportRow, type SchoolReportRow } from "@/components/features/school-reports/volunteer-report-row";
import { TOUR_REPORT_OBSERVATION_FIELDS, TOUR_REPORT_LOGISTICS_LABELS } from "@/lib/report-field-labels";
import type { DemoEvaluation, FormSubmission, FormField, TourReportHost, VolunteerObservation } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

function SectionTitle({ icon: Icon, children, shared }: { icon: React.ElementType; children: React.ReactNode; shared?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4" style={{ color: "var(--gs-accent)" }} />
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--foreground)", margin: 0 }}>{children}</p>
      {shared && (
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, color: "var(--gs-warning-alt)", background: "rgba(var(--gs-warning-alt-rgb), 0.08)" }}>
          Shared with your group
        </span>
      )}
    </div>
  );
}

export default async function CoreMemberVolunteerDetailPage({
  params, searchParams,
}: {
  params: Promise<{ volunteerId: string }>;
  searchParams: Promise<{ group?: string }>;
}) {
  const { volunteerId } = await params;
  const { group: groupId } = await searchParams;
  if (!groupId) notFound();

  const db = createServerClient();
  const [{ data: volunteer }, detail] = await Promise.all([
    db.from("users").select("id, name, email").eq("id", volunteerId).maybeSingle(),
    getVolunteerDetailForCoreMember(groupId, volunteerId).catch(() => null),
  ]);
  if (!volunteer || !detail) notFound();

  const { data: group } = await db.from("tour_groups").select("tour_id").eq("id", groupId).maybeSingle();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/core-member/dashboard" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "var(--gs-muted)" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Core Member Panel</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{volunteer.name}</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{volunteer.email}</p>
        </div>

        <div className="space-y-8">
          {/* Observations — private, core member + admin only */}
          <section>
            <SectionTitle icon={NotebookPen}>Observations</SectionTitle>
            <VolunteerObservations volunteerId={volunteerId} groupId={groupId} observations={detail.observations as VolunteerObservation[]} />
          </section>

          {/* Demo Evaluation — the one editable section */}
          <section>
            <SectionTitle icon={Star}>Demo Evaluation</SectionTitle>
            <CoreMemberEvaluationSection
              groupId={groupId}
              volunteerId={volunteerId}
              tourId={group?.tour_id}
              evaluations={detail.demoEvaluations as DemoEvaluation[]}
            />
          </section>

          {/* Registration Fee */}
          <section>
            <SectionTitle icon={Wallet}>Registration Fee</SectionTitle>
            {!detail.registrationFee ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No registration fee record.</p></CardContent>
</Card>
            ) : (
              <Card>
<CardContent className="flex items-center justify-between">
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", textTransform: "capitalize" }}>{detail.registrationFee.status}</span>
                <span style={{ fontSize: 14, fontFamily: "var(--font-geist-mono), monospace", color: "var(--gs-success)" }}>₹{detail.registrationFee.amount}</span>
              </CardContent>
</Card>
            )}
          </section>

          {/* Workshops */}
          <section>
            <SectionTitle icon={GraduationCap}>Workshops ({detail.workshopAttendance.length})</SectionTitle>
            {detail.workshopAttendance.length === 0 ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No workshop attendance recorded.</p></CardContent>
</Card>
            ) : (
              <div className="space-y-2">
                {detail.workshopAttendance.map((w) => (
                  <Card key={w.id}>
<CardContent className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{w.workshop?.title}</p>
                      <p style={{ fontSize: 12, color: "var(--gs-muted)" }}>{w.workshop?.workshop_date ? new Date(w.workshop.workshop_date).toLocaleDateString() : ""}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: "var(--gs-accent)" }}>{w.attendance_status}</span>
                  </CardContent>
</Card>
                ))}
              </div>
            )}
          </section>

          {/* Tasks & Forms */}
          <section>
            <SectionTitle icon={FileText}>Tasks &amp; Forms ({detail.formSubmissions.length})</SectionTitle>
            {detail.formSubmissions.length === 0 ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No forms submitted.</p></CardContent>
</Card>
            ) : (
              <VolunteerFormSubmissions
                submissions={detail.formSubmissions as unknown as (FormSubmission & { dynamic_forms: { title: string; fields?: FormField[] } | null })[]}
              />
            )}
          </section>

          {/* Events */}
          <section>
            <SectionTitle icon={CalendarDays}>Events ({detail.eventRsvps.length})</SectionTitle>
            {detail.eventRsvps.length === 0 ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No event RSVPs.</p></CardContent>
</Card>
            ) : (
              <div className="space-y-2">
                {detail.eventRsvps.map((r) => (
                  <Card key={r.id}>
<CardContent className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{r.event?.title}</p>
                      <p style={{ fontSize: 12, color: "var(--gs-muted)" }}>{r.event?.event_date ? new Date(r.event.event_date).toLocaleDateString() : ""}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: "var(--gs-accent)" }}>{r.rsvp_status}</span>
                  </CardContent>
</Card>
                ))}
              </div>
            )}
          </section>

          {/* Daily Log */}
          <section>
            <SectionTitle icon={BookOpen}>Daily Log ({detail.dailyLogs.length})</SectionTitle>
            {detail.dailyLogs.length === 0 ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No daily logs for this tour.</p></CardContent>
</Card>
            ) : (
              <div className="space-y-2">
                {detail.dailyLogs.map((log) => (
                  <Card key={log.id}>
<CardContent>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 6 }}>
                      {new Date(log.log_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--gs-text-secondary)" }}><b>Activities:</b> {log.activities_conducted}</p>
                  </CardContent>
</Card>
                ))}
              </div>
            )}
          </section>

          {/* School Details — group-shared */}
          <section>
            <SectionTitle icon={School} shared>School Details ({detail.schoolReports.length})</SectionTitle>
            <VolunteerReportRow
              name={volunteer.name}
              email={volunteer.email}
              reports={detail.schoolReports as unknown as SchoolReportRow[]}
            />
          </section>

          {/* Travel — group-shared */}
          <section>
            <SectionTitle icon={Plane} shared>Travel ({detail.travelTickets.length})</SectionTitle>
            {detail.travelTickets.length === 0 ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No travel tickets for this group.</p></CardContent>
</Card>
            ) : (
              <div className="space-y-2">
                {detail.travelTickets.map((t) => (
                  <Card key={t.id}>
<CardContent>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{t.train_name ?? t.train_number ?? "Travel ticket"}</p>
                    <p style={{ fontSize: 12, color: "var(--gs-muted)" }}>{t.departure_station} → {t.arrival_station}</p>
                  </CardContent>
</Card>
                ))}
              </div>
            )}
          </section>

          {/* Expenses */}
          <section>
            <SectionTitle icon={Receipt}>Expenses ({detail.expenses.length})</SectionTitle>
            {detail.expenses.length === 0 ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No expenses submitted.</p></CardContent>
</Card>
            ) : (
              <div className="space-y-2">
                {detail.expenses.map((e) => (
                  <Card key={e.id}>
<CardContent className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{e.category}{e.subcategory ? ` · ${e.subcategory}` : ""}</p>
                      <p style={{ fontSize: 12, color: "var(--gs-muted)", textTransform: "capitalize" }}>{e.status}</p>
                    </div>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-geist-mono), monospace", color: "var(--gs-success)" }}>₹{e.amount}</span>
                  </CardContent>
</Card>
                ))}
              </div>
            )}
          </section>

          {/* Tour Reports */}
          <section>
            <SectionTitle icon={ClipboardList}>Tour Reports ({detail.tourReports.length})</SectionTitle>
            {detail.tourReports.length === 0 ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No tour reports submitted.</p></CardContent>
</Card>
            ) : (
              <div className="space-y-2">
                {detail.tourReports.map((r) => {
                  const hosts = (r.hosts ?? []) as TourReportHost[];
                  const scores = (r.logistics_scores ?? {}) as Record<string, number | undefined>;
                  const fields = r as unknown as Record<string, string | boolean | undefined>;
                  return (
                    <Card key={r.id}>
<CardContent>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{r.location_name ?? r.tour?.title ?? "Tour report"}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: "var(--gs-accent)" }}>{r.status}</span>
                      </div>

                      {hosts.length > 0 && (
                        <div className="mb-3">
                          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 4 }}>Local Organisations &amp; Hosts</p>
                          <div className="space-y-1">
                            {hosts.map((h, i) => (
                              <p key={i} style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                                {h.organisation || "-"} · {h.contact_person_name || "-"} ({h.designation || "-"}) · {h.mobile_number || "-"} · {[h.village_city, h.block_taluk, h.district, h.state].filter(Boolean).join(", ")}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {Object.keys(scores).length > 0 && (
                        <div className="mb-3">
                          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 4 }}>Logistics Rating</p>
                          <div className="flex flex-wrap gap-3">
                            {Object.entries(scores).filter(([, v]) => v).map(([k, v]) => (
                              <span key={k} style={{ fontSize: 12, color: "var(--gs-text-secondary)" }}>{TOUR_REPORT_LOGISTICS_LABELS[k] ?? k}: <strong>{v}/10</strong></span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {TOUR_REPORT_OBSERVATION_FIELDS.map((f) => {
                          const val = fields[f.key] as string | undefined;
                          if (!val) return null;
                          return (
                            <div key={f.key}>
                              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 2 }}>{f.label}</p>
                              <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>{val}</p>
                            </div>
                          );
                        })}
                        {r.overall_recommendation && (
                          <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                            <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Recommendation: </span>{r.overall_recommendation}
                          </p>
                        )}
                        {fields.suitable_residential_camps !== undefined && fields.suitable_residential_camps !== null && (
                          <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                            <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Suitable for Residential Camps: </span>{fields.suitable_residential_camps ? "Yes" : "No"}
                          </p>
                        )}
                        {fields.follow_up_required !== undefined && fields.follow_up_required !== null && (
                          <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                            <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Follow-up Required: </span>{fields.follow_up_required ? "Yes" : "No"}
                          </p>
                        )}
                        {r.additional_remarks && (
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 2 }}>Additional Remarks</p>
                            <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>{r.additional_remarks}</p>
                          </div>
                        )}
                        {r.report_file_url && (
                          <a href={r.report_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--gs-accent)", display: "inline-block" }}>
                            View report file
                          </a>
                        )}
                      </div>
                    </CardContent>
</Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Media */}
          <section>
            <SectionTitle icon={ImageIcon}>Media ({detail.media.length})</SectionTitle>
            {detail.media.length === 0 ? (
              <Card>
<CardContent><p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No media uploaded.</p></CardContent>
</Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {detail.media.map((item) => (
                  <Card key={item.id} className="p-0 gap-0">
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                      style={{ textDecoration: "none" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.file_url} alt={item.caption ?? "media"} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                    </a>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
