import { createServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Phone, AlertCircle, CheckCircle, MapPin, NotebookPen } from "lucide-react";
import { getVolunteerObservations } from "@/actions/core-member";
import { VolunteerObservations } from "@/components/features/core-member/volunteer-observations";
import { AadhaarToggleButton } from "@/app/(admin)/admin/profiles/aadhaar-toggle-button";
import type { VolunteerObservation } from "@/types";
import { Button } from "@/components/ui/button";

interface VolunteerAssignment {
  id: string;
  role_description?: string;
  tours?: { id: string; title: string; destination: string; start_date: string; end_date: string; status: string };
}

export default async function VolunteerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: user }, { data: profile }, { data: assignments }, observations] = await Promise.all([
    db.from("users").select("*").eq("id", id).single(),
    db.from("volunteer_profiles").select("*").eq("user_id", id).single(),
    db.from("volunteer_assignments").select("*, tours(id, title, destination, start_date, end_date, status)").eq("volunteer_id", id),
    getVolunteerObservations(id),
  ]);

  if (!user) return <div className="p-8" style={{ color: "var(--gs-danger)" }}>Volunteer not found.</div>;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/volunteers">
          <Button variant="ghost" className="mb-5 h-auto p-0 text-[var(--gs-muted)] hover:bg-transparent hover:text-[var(--gs-muted)]">
            <ArrowLeft size={14} /> Back to Volunteers
          </Button>
        </Link>

        {/* Header */}
        <Card className="mb-5">
          <CardContent>
            <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{user.name}</h1>
              <p style={{ fontSize: 14, color: "var(--gs-muted)", margin: "4px 0 0" }}>{user.email}</p>
              {profile?.institution && <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "2px 0 0" }}>{profile.institution}{profile.course_year && ` · ${profile.course_year}`}</p>}
            </div>
            <div className="text-right">
              {profile?.consent_given ? (
                <Badge className="flex items-center gap-1" style={{ color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)" }}>
                  <CheckCircle size={12} /> Consent given
                </Badge>
              ) : (
                <Badge className="flex items-center gap-1" style={{ color: "var(--gs-warning-alt)", background: "rgba(var(--gs-warning-alt-rgb), 0.08)" }}>
                  <AlertCircle size={12} /> No consent yet
                </Badge>
              )}
            </div>
          </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <Card>
            <CardContent>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 16px" }}>Personal Information</h2>
            {!profile ? (
              <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>Profile not filled yet.</p>
            ) : (
              <div className="space-y-3">
                {profile.phone && <Row label="Phone">{profile.phone}</Row>}
                {profile.date_of_birth && <Row label="Date of Birth">{profile.date_of_birth}</Row>}
                {profile.aadhaar_number && (
                  <Row label="Aadhaar Number">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{profile.aadhaar_number}</span>
                      <AadhaarToggleButton userId={id} verified={!!profile.aadhaar_verified} />
                    </div>
                  </Row>
                )}
                {profile.address && <Row label="Address">{profile.address}</Row>}
                {profile.bio && <Row label="Bio">{profile.bio}</Row>}
                {profile.skills?.length > 0 && <Row label="Skills">{profile.skills.join(", ")}</Row>}
                {profile.languages?.length > 0 && <Row label="Languages">{profile.languages.join(", ")}</Row>}
                {profile.states_visited?.length > 0 && (
                  <Row label="States Visited (prev)">{profile.states_visited.join(", ")}</Row>
                )}
                {profile.availability_notes && <Row label="Availability">{profile.availability_notes}</Row>}
              </div>
            )}
            </CardContent>
          </Card>

          {/* Emergency & Consent */}
          <Card>
            <CardContent>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 16px" }}>Emergency Contact & Consent</h2>
            {!profile?.emergency_contact_name ? (
              <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>Emergency contact not filled yet.</p>
            ) : (
              <div className="space-y-3">
                <Row label="Contact Name">{profile.emergency_contact_name}</Row>
                {profile.emergency_contact_relation && <Row label="Relation">{profile.emergency_contact_relation}</Row>}
                {profile.emergency_contact_phone && <Row label="Contact Phone"><span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} />{profile.emergency_contact_phone}</span></Row>}
                {profile.medical_notes && (
                  <div style={{ background: "rgba(var(--gs-warning-alt-rgb), 0.06)", border: "1px solid rgba(var(--gs-warning-alt-rgb), 0.15)", borderRadius: 6, padding: "10px 12px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--gs-warning-alt)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Medical Notes</p>
                    <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: 0 }}>{profile.medical_notes}</p>
                  </div>
                )}
                {profile.consent_given && profile.consent_given_at && (
                  <Row label="Consent Date">{formatDate(profile.consent_given_at)}</Row>
                )}
              </div>
            )}
            </CardContent>
          </Card>

          {/* Tour Assignments */}
          <Card>
            <CardContent>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 16px" }}>Tour Assignments ({(assignments ?? []).length})</h2>
            {(assignments ?? []).length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No assignments yet.</p>
            ) : (
              <div className="space-y-2">
                {((assignments ?? []) as VolunteerAssignment[]).map((a) => (
                  <div key={a.id} style={{ background: "var(--gs-card)", borderRadius: 8, padding: "10px 14px" }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)", margin: "0 0 4px" }}>{a.tours?.title}</p>
                    <div style={{ fontSize: 12, color: "var(--gs-muted)", display: "flex", gap: 12 }}>
                      <span className="flex items-center gap-1"><MapPin size={10} />{a.tours?.destination}</span>
                      {a.role_description && <span>Role: {a.role_description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        {/* Observations — private, admin + core member only */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <NotebookPen className="w-4 h-4" style={{ color: "var(--gs-accent)" }} />
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--foreground)", margin: 0 }}>Observations</p>
          </div>
          <VolunteerObservations volunteerId={id} observations={observations as VolunteerObservation[]} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gs-muted)", margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>{children}</p>
    </div>
  );
}
