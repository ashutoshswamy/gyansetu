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

  const { data: application } = await db
    .from("tour_applications")
    .select("id, status")
    .eq("tour_id", id)
    .eq("student_id", user?.id ?? "")
    .single();

  const s = statusStyles[tour.status ?? "draft"] ?? statusStyles.draft;

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
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
