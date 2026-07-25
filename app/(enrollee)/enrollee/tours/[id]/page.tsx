import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ApplyButton } from "@/components/features/tours/apply-button";
import { MapPin, Calendar, Users } from "lucide-react";

const statusStyles: Record<string, { color: string; bg: string }> = {
  open:      { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  closed:    { color: "#9B9188", bg: "rgba(90,82,71,0.08)" },
  completed: { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  draft:     { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
};

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  const db = createServerClient();

  const [{ data: tour, error }, { data: user }] = await Promise.all([
    db.from("tours").select("*").eq("id", id).single(),
    db.from("users").select("id").eq("clerk_id", userId!).single(),
  ]);

  if (error || !tour) notFound();

  const [{ data: application }, { data: profile }] = await Promise.all([
    db.from("tour_applications").select("id, status").eq("tour_id", id).eq("student_id", user?.id ?? "").single(),
    db.from("volunteer_profiles").select("date_of_birth").eq("user_id", user?.id ?? "").maybeSingle(),
  ]);

  let eligibilityTest: { id: string; status: string } | null = null;
  let hasAttempt = false;
  if (application && tour.eligibility_test_id) {
    const [{ data: testRow }, { data: attempt }] = await Promise.all([
      db.from("eligibility_tests").select("id, status").eq("id", tour.eligibility_test_id).maybeSingle(),
      db.from("test_attempts").select("id").eq("test_id", tour.eligibility_test_id).eq("student_id", user?.id ?? "").maybeSingle(),
    ]);
    eligibilityTest = testRow;
    hasAttempt = !!attempt;
  }

  let ageBlock: string | null = null;
  if (!profile?.date_of_birth) {
    ageBlock = "Complete your profile with your date of birth before applying.";
  } else {
    // eslint-disable-next-line react-hooks/purity -- server component, evaluated fresh per request
    const age = Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) ageBlock = `You must be 18 or older to apply (your age: ${age}).`;
  }

  const s = statusStyles[tour.status ?? "draft"] ?? statusStyles.draft;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>{tour.title}</h1>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 5, color: s.color, background: s.bg, flexShrink: 0, textTransform: "capitalize" }}>
              {tour.status}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#9B9188" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={13} /> {tour.destination}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={13} /> {tour.start_date} — {tour.end_date}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Users size={13} /> {tour.capacity} seats
            </span>
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: "0 0 12px" }}>About this Tour</h2>
          <p style={{ fontSize: 14, color: "#5A5247", lineHeight: 1.7, margin: 0 }}>{tour.description}</p>
        </div>

        {application ? (
          <div style={{ background: "rgba(74,85,190,0.06)", border: "1px solid rgba(74,85,190,0.2)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 14, color: "#4A55BE", margin: 0 }}>
              Already applied. Status:{" "}
              <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{application.status}</span>
            </p>
            {application.status !== "rejected" && eligibilityTest && !hasAttempt && (
              eligibilityTest.status === "active" ? (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(74,85,190,0.15)" }}>
                  <p style={{ fontSize: 13, color: "#4A55BE", margin: "0 0 8px 0" }}>
                    Next step: take the eligibility test to become eligible for this tour.
                  </p>
                  <a
                    href={`/student/tests/${eligibilityTest.id}`}
                    style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: "white", background: "#4A55BE", padding: "9px 18px", borderRadius: 6, textDecoration: "none" }}
                  >
                    Go to Eligibility Test →
                  </a>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#4A55BE", margin: "10px 0 0 0", opacity: 0.8 }}>
                  The eligibility test for this tour isn&apos;t open yet — check back soon.
                </p>
              )
            )}
          </div>
        ) : ageBlock ? (
          <div style={{ background: "rgba(184,56,30,0.06)", border: "1px solid rgba(184,56,30,0.2)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 14, color: "#B8381E", margin: 0, fontWeight: 500 }}>{ageBlock}</p>
            <a href="/student/profile" style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: "#B8381E", textDecoration: "underline" }}>
              Go to My Profile →
            </a>
          </div>
        ) : tour.status === "open" ? (
          <ApplyButton tourId={tour.id} />
        ) : (
          <div style={{ background: "#F3F0E8", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 14, color: "#9B9188", margin: 0 }}>Applications are currently closed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
