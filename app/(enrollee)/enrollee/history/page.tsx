import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { History, MapPin, Calendar } from "lucide-react";

type AssignmentRow = {
  id: string;
  tours: {
    id: string;
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
};

export default async function EnrolleeHistoryPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db.from("users").select("id").eq("clerk_id", userId!).single();

  const { data: assignments } = await db
    .from("volunteer_assignments")
    .select("id, tours(id, title, destination, start_date, end_date, status)")
    .eq("volunteer_id", user?.id ?? "")
    .order("assigned_at", { ascending: false });

  const past = ((assignments ?? []) as unknown as AssignmentRow[]).filter((a) => a.tours?.status === "completed");

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Student Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Tour History</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Tours you volunteered on, with everything you submitted</p>
        </div>

        {past.length === 0 ? (
          <div className="py-20 text-center rounded-xl" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <History className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 14, color: "#9B9188" }}>No past tours yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((a) => (
              <Link
                key={a.id}
                href={`/enrollee/history/${a.tours!.id}`}
                className="flex items-center justify-between gap-4 flex-wrap"
                style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px", textDecoration: "none" }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#19140F", marginBottom: 4 }}>{a.tours?.title}</p>
                  <div className="flex flex-wrap gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{a.tours?.destination}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{a.tours?.start_date} → {a.tours?.end_date}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>
                  Completed
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
