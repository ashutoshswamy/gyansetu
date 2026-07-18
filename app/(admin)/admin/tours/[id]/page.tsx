import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TourManageClient } from "./tour-manage-client";
import { MapPin, Calendar, Users, ArrowLeft } from "lucide-react";

const statusStyles: Record<string, { color: string; bg: string }> = {
  draft:     { color: "#9B9188", bg: "rgba(90,82,71,0.08)" },
  open:      { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  closed:    { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  completed: { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
};

const appStatusStyles: Record<string, { color: string; bg: string }> = {
  pending:     { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  shortlisted: { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  selected:    { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  rejected:    { color: "#B8381E", bg: "rgba(184,56,30,0.08)" },
};

interface TourTest {
  id: string;
  title: string;
  status: string;
}

interface TourApplicationRow {
  id: string;
  status: string;
  test_score?: number;
  users?: { id: string; name: string; email: string; avatar_url?: string };
}

export default async function TourManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: tour }, { data: applications }, { data: tests }] = await Promise.all([
    db.from("tours").select("*").eq("id", id).single(),
    db.from("tour_applications")
      .select("*, users!tour_applications_student_id_fkey(id, name, email, avatar_url)")
      .eq("tour_id", id)
      .order("submitted_at", { ascending: false }),
    db.from("eligibility_tests").select("id, title, status").eq("tour_id", id),
  ]);

  if (!tour) notFound();

  const s = statusStyles[tour.status] ?? statusStyles.draft;
  const counts = {
    pending:     (applications ?? []).filter(a => a.status === "pending").length,
    shortlisted: (applications ?? []).filter(a => a.status === "shortlisted").length,
    selected:    (applications ?? []).filter(a => a.status === "selected").length,
    rejected:    (applications ?? []).filter(a => a.status === "rejected").length,
  };

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link href="/admin/tours" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Tours
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>{tour.title}</h1>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                {tour.status}
              </span>
            </div>
            <div className="flex gap-4 mt-1" style={{ fontSize: 12, color: "#9B9188" }}>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tour.destination}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {tour.start_date} → {tour.end_date}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {tour.capacity} seats</span>
            </div>
          </div>
          <TourManageClient tourId={id} currentStatus={tour.status} />
        </div>

        {/* Description */}
        {tour.description && (
          <div className="rounded-xl p-4 mb-6" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <p style={{ fontSize: 13, color: "#5A5247", lineHeight: 1.6 }}>{tour.description}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 mb-6 rounded-xl overflow-hidden" style={{ border: "1px solid #E4DFD1", background: "white" }}>
          {Object.entries(counts).map(([status, count], idx) => (
            <div key={status} className="py-4 px-5" style={{ borderRight: idx < 3 ? "1px solid #E4DFD1" : undefined }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9188", marginBottom: 4 }}>{status}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: appStatusStyles[status]?.color ?? "#4A55BE", fontFamily: "var(--font-geist-mono), monospace" }}>{count}</p>
            </div>
          ))}
        </div>

        {/* Linked Tests */}
        {(tests ?? []).length > 0 && (
          <div className="mb-6 rounded-xl p-4" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9188", marginBottom: 10 }}>Eligibility Tests</p>
            <div className="flex flex-wrap gap-2">
              {((tests ?? []) as TourTest[]).map((t) => (
                <span key={t.id} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 4, background: "rgba(74,85,190,0.07)", color: "#4A55BE", fontWeight: 500 }}>
                  {t.title} · {t.status}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 12 }}>
            Applications ({(applications ?? []).length})
          </p>
          <div className="space-y-2">
            {(applications ?? []).length === 0 && (
              <div className="py-12 text-center rounded-xl" style={{ background: "white", border: "1px solid #E4DFD1" }}>
                <p style={{ fontSize: 13, color: "#9B9188" }}>No applications yet.</p>
              </div>
            )}
            {((applications ?? []) as TourApplicationRow[]).map((app) => {
              return (
                <div key={app.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "white", border: "1px solid #E4DFD1" }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(74,85,190,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#4A55BE", flexShrink: 0 }}>
                      {app.users?.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#19140F" }}>{app.users?.name}</p>
                      <p style={{ fontSize: 11, color: "#9B9188" }}>{app.users?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {app.test_score != null && (
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: app.test_score >= 60 ? "#2A5E3A" : "#B8381E" }}>
                        {app.test_score.toFixed(1)}%
                      </span>
                    )}
                    <ApplicationStatusSelect currentStatus={app.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationStatusSelect({ currentStatus }: { currentStatus: string }) {
  const as = appStatusStyles[currentStatus] ?? appStatusStyles.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, color: as.color, background: as.bg, textTransform: "capitalize" }}>
      {currentStatus}
    </span>
  );
}
