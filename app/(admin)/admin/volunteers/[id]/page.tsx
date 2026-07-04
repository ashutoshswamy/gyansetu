import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Phone, AlertCircle, CheckCircle, MapPin } from "lucide-react";

interface VolunteerAssignment {
  id: string;
  role_description?: string;
  tours?: { id: string; title: string; destination: string; start_date: string; end_date: string; status: string };
}

export default async function VolunteerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: user }, { data: profile }, { data: assignments }] = await Promise.all([
    db.from("users").select("*").eq("id", id).single(),
    db.from("volunteer_profiles").select("*").eq("user_id", id).single(),
    db.from("volunteer_assignments").select("*, tours(id, title, destination, start_date, end_date, status)").eq("volunteer_id", id),
  ]);

  if (!user) return <div className="p-8" style={{ color: "#DC2626" }}>Volunteer not found.</div>;

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/volunteers">
          <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9B9188", background: "none", border: "none", cursor: "pointer", marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Volunteers
          </button>
        </Link>

        {/* Header */}
        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>{user.name}</h1>
              <p style={{ fontSize: 14, color: "#9B9188", margin: "4px 0 0" }}>{user.email}</p>
              {profile?.institution && <p style={{ fontSize: 13, color: "#5A5247", margin: "2px 0 0" }}>{profile.institution}{profile.course_year && ` · ${profile.course_year}`}</p>}
            </div>
            <div className="text-right">
              {profile?.consent_given ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2A5E3A", background: "rgba(42,94,58,0.08)", padding: "4px 10px", borderRadius: 6 }}>
                  <CheckCircle size={12} /> Consent given
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#A8641C", background: "rgba(168,100,28,0.08)", padding: "4px 10px", borderRadius: 6 }}>
                  <AlertCircle size={12} /> No consent yet
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "20px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 16px" }}>Personal Information</h2>
            {!profile ? (
              <p style={{ fontSize: 13, color: "#9B9188" }}>Profile not filled yet.</p>
            ) : (
              <div className="space-y-3">
                {profile.phone && <Row label="Phone">{profile.phone}</Row>}
                {profile.date_of_birth && <Row label="Date of Birth">{profile.date_of_birth}</Row>}
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
          </div>

          {/* Emergency & Consent */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "20px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 16px" }}>Emergency Contact & Consent</h2>
            {!profile?.emergency_contact_name ? (
              <p style={{ fontSize: 13, color: "#9B9188" }}>Emergency contact not filled yet.</p>
            ) : (
              <div className="space-y-3">
                <Row label="Contact Name">{profile.emergency_contact_name}</Row>
                {profile.emergency_contact_relation && <Row label="Relation">{profile.emergency_contact_relation}</Row>}
                {profile.emergency_contact_phone && <Row label="Contact Phone"><span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} />{profile.emergency_contact_phone}</span></Row>}
                {profile.medical_notes && (
                  <div style={{ background: "rgba(168,100,28,0.06)", border: "1px solid rgba(168,100,28,0.15)", borderRadius: 6, padding: "10px 12px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#A8641C", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Medical Notes</p>
                    <p style={{ fontSize: 13, color: "#5A5247", margin: 0 }}>{profile.medical_notes}</p>
                  </div>
                )}
                {profile.consent_given && profile.consent_given_at && (
                  <Row label="Consent Date">{new Date(profile.consent_given_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</Row>
                )}
              </div>
            )}
          </div>

          {/* Tour Assignments */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "20px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 16px" }}>Tour Assignments ({(assignments ?? []).length})</h2>
            {(assignments ?? []).length === 0 ? (
              <p style={{ fontSize: 13, color: "#9B9188" }}>No assignments yet.</p>
            ) : (
              <div className="space-y-2">
                {((assignments ?? []) as VolunteerAssignment[]).map((a) => (
                  <div key={a.id} style={{ background: "#F3F0E8", borderRadius: 8, padding: "10px 14px" }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#19140F", margin: "0 0 4px" }}>{a.tours?.title}</p>
                    <div style={{ fontSize: 12, color: "#9B9188", display: "flex", gap: 12 }}>
                      <span className="flex items-center gap-1"><MapPin size={10} />{a.tours?.destination}</span>
                      {a.role_description && <span>Role: {a.role_description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9188", margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: 13, color: "#19140F", margin: 0 }}>{children}</p>
    </div>
  );
}
