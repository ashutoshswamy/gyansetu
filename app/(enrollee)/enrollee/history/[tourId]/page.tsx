import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, FileText, BookOpen, Image as ImageIcon } from "lucide-react";
import { getMyFormSubmissions } from "@/actions/forms";
import { getMyDailyLogs, getMediaByTour } from "@/actions/daily-logs";
import { getMyIdCard } from "@/actions/id-cards";
import { getMyCertificates } from "@/actions/certificates";
import { IdCardPanel } from "@/components/features/id-cards/id-card-panel";
import { CertificatePanel } from "@/components/features/certificates/certificate-panel";
import type { FormField } from "@/types";

const card: React.CSSProperties = { background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 20 };
const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gs-muted)", marginBottom: 12 };

export default async function EnrolleeTourHistoryDetailPage({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db.from("users").select("id, name").eq("clerk_id", userId!).single();
  if (!user) notFound();

  const [{ data: assignment }, { data: tour }] = await Promise.all([
    db.from("volunteer_assignments").select("id").eq("tour_id", tourId).eq("volunteer_id", user.id).maybeSingle(),
    db.from("tours").select("id, title, destination, start_date, end_date").eq("id", tourId).maybeSingle(),
  ]);
  if (!assignment || !tour) notFound();

  const [submissions, logs, media, idCard, certificates] = await Promise.all([
    getMyFormSubmissions(tourId),
    getMyDailyLogs(tourId),
    getMediaByTour(tourId),
    getMyIdCard(tourId),
    getMyCertificates(),
  ]);

  const myMedia = media.filter((m) => m.uploaded_by === user.id);
  const myCertificate = certificates.find((c) => c.tour_id === tourId);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/enrollee/history" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "var(--gs-muted)" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Tour History
        </Link>

        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Student Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{tour.title}</h1>
          <div className="flex flex-wrap gap-4 mt-2" style={{ fontSize: 13, color: "var(--gs-text-secondary)" }}>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{tour.destination}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{tour.start_date} → {tour.end_date}</span>
          </div>
        </div>

        <div className="space-y-8">
          {idCard && (
            <section>
              <p style={sectionTitle}>ID Card</p>
              <IdCardPanel
                data={{
                  name: idCard.name ?? user.name,
                  photo_url: idCard.photo_url,
                  card_number: idCard.card_number,
                  valid_from: idCard.valid_from,
                  valid_to: idCard.valid_to,
                  state: idCard.state,
                  place: idCard.place,
                  tour_title: idCard.tour?.title,
                  tour_destination: idCard.tour?.destination,
                  group_name: idCard.group?.name,
                  role_in_group: idCard.role_in_group,
                  card_file_url: idCard.card_file_url,
                }}
              />
            </section>
          )}

          {myCertificate && (
            <section>
              <p style={sectionTitle}>Certificate</p>
              <CertificatePanel
                data={{
                  name: user.name,
                  state: myCertificate.state,
                  place: myCertificate.place,
                  duration_of_visit: myCertificate.duration_of_visit,
                  volunteer_code: myCertificate.volunteer_code,
                  issued_at: myCertificate.issued_at,
                }}
              />
            </section>
          )}

          <section>
            <p style={sectionTitle}>Forms ({submissions.length})</p>
            {submissions.length === 0 ? (
              <div style={card} className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No forms submitted for this tour.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((s) => {
                  const form = s.dynamic_forms as { title: string; fields: FormField[] } | null;
                  const fieldLabels = new Map((form?.fields ?? []).map((f) => [f.id, f.label]));
                  const entries = Object.entries(s.data ?? {});
                  return (
                    <div key={s.id} style={card}>
                      <div className="flex items-center justify-between mb-2">
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{form?.title ?? "Form"}</p>
                        <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>{new Date(s.submitted_at).toLocaleDateString()}</span>
                      </div>
                      {entries.length > 0 && (
                        <div className="space-y-1.5 mt-3" style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                          {entries.map(([key, value]) => (
                            <div key={key} style={{ fontSize: 13 }}>
                              <span style={{ color: "var(--gs-muted)" }}>{fieldLabels.get(key) ?? key}: </span>
                              <span style={{ color: "var(--foreground)" }}>{Array.isArray(value) ? value.join(", ") : String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <p style={sectionTitle}>Reports ({logs.length})</p>
            {logs.length === 0 ? (
              <div style={card} className="text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No daily reports for this tour.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} style={card}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>
                      {new Date(log.log_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", marginBottom: 4 }}><b>Activities:</b> {log.activities_conducted}</p>
                    <p style={{ fontSize: 13, color: "var(--gs-text-secondary)" }}><b>Achievements:</b> {log.key_achievements}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <p style={sectionTitle}>Media ({myMedia.length})</p>
            {myMedia.length === 0 ? (
              <div style={card} className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No media uploaded for this tour.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {myMedia.map((item) => (
                  <a
                    key={item.id}
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", textDecoration: "none", display: "block" }}
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
