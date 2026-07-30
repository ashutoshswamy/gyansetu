import { createServerClient } from "@/lib/supabase/server";
import { getVolunteerDetailForCoreMember } from "@/actions/core-member";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, GraduationCap, FileText, CalendarDays, Star, BookOpen, School, Plane, Receipt, ClipboardList, Image as ImageIcon } from "lucide-react";
import { CoreMemberEvaluationSection } from "@/components/features/demo-evaluations/core-member-evaluation-section";
import type { DemoEvaluation, FormField } from "@/types";

const card: React.CSSProperties = { background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 20 };
const emptyCard: React.CSSProperties = { ...card, textAlign: "center", padding: "24px 20px" };

function SectionTitle({ icon: Icon, children, shared }: { icon: React.ElementType; children: React.ReactNode; shared?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4" style={{ color: "#4A55BE" }} />
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "#19140F", margin: 0 }}>{children}</p>
      {shared && (
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, color: "#A8641C", background: "rgba(168,100,28,0.08)" }}>
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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/core-member/dashboard" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Core Member Panel</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>{volunteer.name}</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{volunteer.email}</p>
        </div>

        <div className="space-y-8">
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
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No registration fee record.</p></div>
            ) : (
              <div style={card} className="flex items-center justify-between">
                <span style={{ fontSize: 14, fontWeight: 600, color: "#19140F", textTransform: "capitalize" }}>{detail.registrationFee.status}</span>
                <span style={{ fontSize: 14, fontFamily: "var(--font-geist-mono), monospace", color: "#2A5E3A" }}>₹{detail.registrationFee.amount}</span>
              </div>
            )}
          </section>

          {/* Workshops */}
          <section>
            <SectionTitle icon={GraduationCap}>Workshops ({detail.workshopAttendance.length})</SectionTitle>
            {detail.workshopAttendance.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No workshop attendance recorded.</p></div>
            ) : (
              <div className="space-y-2">
                {detail.workshopAttendance.map((w) => (
                  <div key={w.id} style={card} className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>{w.workshop?.title}</p>
                      <p style={{ fontSize: 12, color: "#9B9188" }}>{w.workshop?.workshop_date ? new Date(w.workshop.workshop_date).toLocaleDateString() : ""}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: "#4A55BE" }}>{w.attendance_status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tasks & Forms */}
          <section>
            <SectionTitle icon={FileText}>Tasks &amp; Forms ({detail.formSubmissions.length})</SectionTitle>
            {detail.formSubmissions.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No forms submitted.</p></div>
            ) : (
              <div className="space-y-2">
                {detail.formSubmissions.map((s) => {
                  const form = s.dynamic_forms as { title: string; fields?: FormField[] } | null;
                  return (
                    <div key={s.id} style={card} className="flex items-center justify-between">
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>{form?.title ?? "Form"}</span>
                      <span style={{ fontSize: 12, color: "#9B9188" }}>{new Date(s.submitted_at).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Events */}
          <section>
            <SectionTitle icon={CalendarDays}>Events ({detail.eventRsvps.length})</SectionTitle>
            {detail.eventRsvps.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No event RSVPs.</p></div>
            ) : (
              <div className="space-y-2">
                {detail.eventRsvps.map((r) => (
                  <div key={r.id} style={card} className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>{r.event?.title}</p>
                      <p style={{ fontSize: 12, color: "#9B9188" }}>{r.event?.event_date ? new Date(r.event.event_date).toLocaleDateString() : ""}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: "#4A55BE" }}>{r.rsvp_status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Daily Log */}
          <section>
            <SectionTitle icon={BookOpen}>Daily Log ({detail.dailyLogs.length})</SectionTitle>
            {detail.dailyLogs.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No daily logs for this tour.</p></div>
            ) : (
              <div className="space-y-2">
                {detail.dailyLogs.map((log) => (
                  <div key={log.id} style={card}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 6 }}>
                      {new Date(log.log_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p style={{ fontSize: 13, color: "#5A5247" }}><b>Activities:</b> {log.activities_conducted}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* School Details — group-shared */}
          <section>
            <SectionTitle icon={School} shared>School Details ({detail.schoolReports.length})</SectionTitle>
            {detail.schoolReports.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No school reports for this group.</p></div>
            ) : (
              <div className="space-y-2">
                {detail.schoolReports.map((r) => (
                  <div key={r.id} style={card} className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>{r.school_name ?? "School visit"}</span>
                    <span style={{ fontSize: 12, color: "#9B9188" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Travel — group-shared */}
          <section>
            <SectionTitle icon={Plane} shared>Travel ({detail.travelTickets.length})</SectionTitle>
            {detail.travelTickets.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No travel tickets for this group.</p></div>
            ) : (
              <div className="space-y-2">
                {detail.travelTickets.map((t) => (
                  <div key={t.id} style={card}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>{t.train_name ?? t.train_number ?? "Travel ticket"}</p>
                    <p style={{ fontSize: 12, color: "#9B9188" }}>{t.departure_station} → {t.arrival_station}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Expenses */}
          <section>
            <SectionTitle icon={Receipt}>Expenses ({detail.expenses.length})</SectionTitle>
            {detail.expenses.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No expenses submitted.</p></div>
            ) : (
              <div className="space-y-2">
                {detail.expenses.map((e) => (
                  <div key={e.id} style={card} className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>{e.category}{e.subcategory ? ` · ${e.subcategory}` : ""}</p>
                      <p style={{ fontSize: 12, color: "#9B9188", textTransform: "capitalize" }}>{e.status}</p>
                    </div>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-geist-mono), monospace", color: "#2A5E3A" }}>₹{e.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tour Reports */}
          <section>
            <SectionTitle icon={ClipboardList}>Tour Reports ({detail.tourReports.length})</SectionTitle>
            {detail.tourReports.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No tour reports submitted.</p></div>
            ) : (
              <div className="space-y-2">
                {detail.tourReports.map((r) => (
                  <div key={r.id} style={card} className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>{r.tour?.title ?? "Tour report"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: "#4A55BE" }}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Media */}
          <section>
            <SectionTitle icon={ImageIcon}>Media ({detail.media.length})</SectionTitle>
            {detail.media.length === 0 ? (
              <div style={emptyCard}><p style={{ fontSize: 13, color: "#9B9188" }}>No media uploaded.</p></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {detail.media.map((item) => (
                  <a
                    key={item.id}
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, overflow: "hidden", textDecoration: "none", display: "block" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.file_url} alt={item.caption ?? "media"} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
