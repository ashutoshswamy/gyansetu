import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ApplyButton } from "@/components/features/tours/apply-button";
import { WithdrawButton } from "@/components/features/tours/withdraw-button";
import { MapPin, Calendar, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/format-date";

const statusStyles: Record<string, { color: string; bg: string }> = {
  open:      { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  closed:    { color: "var(--gs-muted)", bg: "rgba(90,82,71,0.08)" },
  completed: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  draft:     { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
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

  const [{ data: applications }, { data: profile }] = await Promise.all([
    db.from("tour_applications").select("id, tour_id, status, withdrawal_reason").eq("student_id", user?.id ?? ""),
    db.from("volunteer_profiles").select("date_of_birth").eq("user_id", user?.id ?? "").maybeSingle(),
  ]);

  const application = applications?.find((a) => a.tour_id === id) ?? null;
  const appliedElsewhere = (applications ?? []).some((a) => a.tour_id !== id);

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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <Card>
<CardContent>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{tour.title}</h1>
            <Badge style={{color: s.color, background: s.bg, flexShrink: 0, textTransform: "capitalize"}}>
              {tour.status}
            </Badge>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "var(--gs-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={13} /> {tour.destination}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={13} /> {formatDateRange(tour.start_date, tour.end_date)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Users size={13} /> {tour.capacity} seats
            </span>
          </div>
        </CardContent>
</Card>

        <Card>
<CardContent>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", margin: "0 0 12px" }}>About this Tour</h2>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", lineHeight: 1.7, margin: 0 }}>{tour.description}</p>
        </CardContent>
</Card>

        {application ? (
          <div style={{ background: "rgba(var(--gs-accent-rgb), 0.06)", border: "1px solid rgba(var(--gs-accent-rgb), 0.2)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 14, color: "var(--gs-accent)", margin: 0 }}>
              Already applied. Status:{" "}
              <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{application.status}</span>
            </p>
            {application.status !== "rejected" && eligibilityTest && !hasAttempt && (
              eligibilityTest.status === "active" ? (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(var(--gs-accent-rgb), 0.15)" }}>
                  <p style={{ fontSize: 13, color: "var(--gs-accent)", margin: "0 0 8px 0" }}>
                    Next step: take the eligibility test to become eligible for this tour.
                  </p>
                  <a
                    href={`/enrollee/tests/${eligibilityTest.id}`}
                    style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: "white", background: "var(--gs-accent)", padding: "9px 18px", borderRadius: 6, textDecoration: "none" }}
                  >
                    Go to Eligibility Test →
                  </a>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--gs-accent)", margin: "10px 0 0 0", opacity: 0.8 }}>
                  The eligibility test for this tour isn&apos;t open yet — check back soon.
                </p>
              )
            )}
            {application.status === "withdrawal_requested" && (
              <p style={{ fontSize: 13, color: "var(--gs-accent)", margin: "10px 0 0 0", opacity: 0.8 }}>
                Withdrawal requested — waiting on admin approval.
              </p>
            )}
            {(application.status === "pending" || application.status === "shortlisted") && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(var(--gs-accent-rgb), 0.15)" }}>
                <WithdrawButton applicationId={application.id} />
              </div>
            )}
          </div>
        ) : appliedElsewhere ? (
          <div style={{ background: "var(--gs-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 14, color: "var(--gs-muted)", margin: 0 }}>
              You&apos;ve already applied for another tour. Only one tour application is allowed per enrollee.
            </p>
          </div>
        ) : ageBlock ? (
          <div style={{ background: "rgba(var(--gs-danger-alt-rgb), 0.06)", border: "1px solid rgba(var(--gs-danger-alt-rgb), 0.2)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 14, color: "var(--gs-danger-alt)", margin: 0, fontWeight: 500 }}>{ageBlock}</p>
            <a href="/enrollee/profile" style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: "var(--gs-danger-alt)", textDecoration: "underline" }}>
              Go to My Profile →
            </a>
          </div>
        ) : tour.status === "open" ? (
          <ApplyButton tourId={tour.id} />
        ) : (
          <div style={{ background: "var(--gs-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 14, color: "var(--gs-muted)", margin: 0 }}>Applications are currently closed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
