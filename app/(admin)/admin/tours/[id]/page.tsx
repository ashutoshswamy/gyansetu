import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TourManageClient } from "./tour-manage-client";
import { VolunteerAssign } from "./volunteer-assign";
import { MapPin, Calendar, Users, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/format-date";

const statusStyles: Record<string, { color: string; bg: string }> = {
  draft:     { color: "var(--gs-muted)", bg: "rgba(90,82,71,0.08)" },
  open:      { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  closed:    { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  completed: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
};

const appStatusStyles: Record<string, { color: string; bg: string }> = {
  pending:     { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  shortlisted: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  selected:    { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  rejected:    { color: "var(--gs-danger-alt)", bg: "rgba(var(--gs-danger-alt-rgb), 0.08)" },
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

  const [{ data: tour }, { data: applications }, { data: tests }, { data: volunteerAssignments }] = await Promise.all([
    db.from("tours").select("*").eq("id", id).single(),
    db.from("tour_applications")
      .select("*, users!tour_applications_student_id_fkey(id, name, email, avatar_url)")
      .eq("tour_id", id)
      .order("submitted_at", { ascending: false }),
    db.from("eligibility_tests").select("id, title, status").eq("tour_id", id),
    db.from("volunteer_assignments")
      .select("id, role_description, users(id, name, email)")
      .eq("tour_id", id),
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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link href="/admin/tours" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "var(--gs-muted)" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Tours
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{tour.title}</h1>
              <Badge style={{color: s.color, background: s.bg, textTransform: "capitalize"}}>
                {tour.status}
              </Badge>
            </div>
            <div className="flex gap-4 mt-1" style={{ fontSize: 12, color: "var(--gs-muted)" }}>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tour.destination}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateRange(tour.start_date, tour.end_date)}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {tour.capacity} seats</span>
            </div>
          </div>
          <TourManageClient tourId={id} currentStatus={tour.status} />
        </div>

        <div className="space-y-6">
        {/* Description */}
        {tour.description && (
          <Card>
<CardContent>
            <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", lineHeight: 1.6 }}>{tour.description}</p>
          </CardContent>
</Card>
        )}

        {/* Stats */}
        <Card className="p-0">
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 p-0">
            {Object.entries(counts).map(([status, count], idx) => (
              <div key={status} className="py-4 px-5" style={{ borderRight: idx < 3 ? "1px solid var(--border)" : undefined }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gs-muted)", marginBottom: 4 }}>{status}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: appStatusStyles[status]?.color ?? "var(--gs-accent)", fontFamily: "var(--font-geist-mono), monospace" }}>{count}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Linked Tests */}
        {(tests ?? []).length > 0 && (
          <Card>
<CardContent>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gs-muted)", marginBottom: 10 }}>Eligibility Tests</p>
            <div className="flex flex-wrap gap-2">
              {((tests ?? []) as TourTest[]).map((t) => (
                <Badge key={t.id} style={{ background: "rgba(var(--gs-accent-rgb), 0.07)", color: "var(--gs-accent)" }}>
                  {t.title} · {t.status}
                </Badge>
              ))}
            </div>
          </CardContent>
</Card>
        )}

        {/* Volunteers */}
        <VolunteerAssign
          tourId={id}
          assignments={(volunteerAssignments ?? []) as unknown as { id: string; role_description?: string; users?: { id: string; name: string; email: string } }[]}
        />

        {/* Applications */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 12 }}>
            Applications ({(applications ?? []).length})
          </p>
          <div className="space-y-2">
            {(applications ?? []).length === 0 && (
              <Card>
<CardContent>
                <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No applications yet.</p>
              </CardContent>
</Card>
            )}
            {((applications ?? []) as TourApplicationRow[]).map((app) => {
              return (
                <Card key={app.id}>
<CardContent>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(var(--gs-accent-rgb), 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "var(--gs-accent)", flexShrink: 0 }}>
                      {app.users?.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{app.users?.name}</p>
                      <p style={{ fontSize: 11, color: "var(--gs-muted)" }}>{app.users?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {app.test_score != null && (
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: app.test_score >= 60 ? "var(--gs-success)" : "var(--gs-danger-alt)" }}>
                        {app.test_score.toFixed(1)}%
                      </span>
                    )}
                    <ApplicationStatusSelect currentStatus={app.status} />
                  </div>
                </CardContent>
</Card>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationStatusSelect({ currentStatus }: { currentStatus: string }) {
  const as = appStatusStyles[currentStatus] ?? appStatusStyles.pending;
  return (
    <Badge style={{color: as.color, background: as.bg, textTransform: "capitalize"}}>
      {currentStatus}
    </Badge>
  );
}
