import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/features/dashboard/stat-card";
import Link from "next/link";
import { Plane, CheckSquare, ArrowRight, Calendar, MapPin } from "lucide-react";
import type { DynamicForm } from "@/types";

type AssignmentRow = {
  id: string;
  role_description?: string;
  tours?: { title: string; destination: string; start_date: string; end_date: string; status: string } | null;
};
type FormRow = Pick<DynamicForm, "id" | "title" | "fields"> & { tours?: { title: string } | null };

const tourStatusStyles: Record<string, { color: string; bg: string }> = {
  open:      { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  closed:    { color: "#9B9188", bg: "rgba(90,82,71,0.08)" },
  completed: { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  draft:     { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
};

export default async function VolunteerDashboard() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db
    .from("users")
    .select("id, name")
    .eq("clerk_id", userId!)
    .single();

  const uid = user?.id ?? "";

  const [
    { data: assignments },
    { data: forms },
  ] = await Promise.all([
    db.from("volunteer_assignments").select("*, tours(id, title, destination, start_date, end_date, status)").eq("volunteer_id", uid),
    db.from("dynamic_forms").select("id, title, fields, tour_id, tours(title)").eq("target_role", "volunteer").eq("status", "active").eq("is_template", false),
  ]);

  const activeTours = (assignments ?? []).filter((a: AssignmentRow) => a.tours?.status === "open");

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Volunteer Portal
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>
            Welcome, {user?.name ?? "Volunteer"}
          </h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Manage your tour assignments and complete required forms
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Tour Assignments" value={assignments?.length ?? 0}  icon={<Plane size={18} />}      accent="emerald" />
          <StatCard label="Active Tours"      value={activeTours.length}        icon={<Calendar size={18} />}   accent="sky"     sub="currently ongoing" />
          <StatCard label="Pending Forms"     value={forms?.length ?? 0}        icon={<CheckSquare size={18} />} accent="amber"   sub="need completion" />
        </div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tours */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>My Tour Assignments</h2>
              <Link href="/volunteer/tours" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#4A55BE", fontWeight: 500 }}>
                All tours <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {(assignments ?? []).length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Plane className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
                <p style={{ fontSize: 14, color: "#9B9188", margin: "0 0 4px" }}>No tour assignments yet.</p>
                <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>An admin will assign you to tours.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(assignments ?? []).map((a: AssignmentRow) => {
                  const s = tourStatusStyles[a.tours?.status ?? "draft"] ?? tourStatusStyles.draft;
                  return (
                    <div key={a.id} style={{ background: "#F3F0E8", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: "#19140F", margin: "0 0 6px" }} className="truncate">
                            {a.tours?.title}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#9B9188" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin className="w-3 h-3" />
                              {a.tours?.destination}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar className="w-3 h-3" />
                              {a.tours?.start_date ? new Date(a.tours.start_date).toLocaleDateString() : "-"}
                            </span>
                          </div>
                          {a.role_description && (
                            <p style={{ fontSize: 12, color: "#5A5247", marginTop: 6 }}>Role: {a.role_description}</p>
                          )}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, flexShrink: 0, textTransform: "capitalize" }}>
                          {a.tours?.status ?? "-"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks & Forms */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>Tasks &amp; Forms</h2>
              <Link href="/volunteer/forms" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#4A55BE", fontWeight: 500 }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {(forms ?? []).length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <CheckSquare className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
                <p style={{ fontSize: 14, color: "#9B9188", margin: "0 0 4px" }}>No pending forms.</p>
                <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>Forms assigned to volunteers will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {((forms ?? []) as unknown as FormRow[]).map((form) => (
                  <div key={form.id} style={{ background: "#F3F0E8", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#19140F", margin: "0 0 3px" }} className="truncate">
                        {form.title}
                      </p>
                      <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                        {form.fields?.length ?? 0} fields{form.tours?.title && ` · ${form.tours.title}`}
                      </p>
                    </div>
                    <Link href={`/volunteer/forms/${form.id}`}>
                      <button style={{ background: "transparent", color: "#2A5E3A", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 5, border: "1.5px solid rgba(42,94,58,0.3)", cursor: "pointer", flexShrink: 0, marginLeft: 12 }}>
                        Fill Form
                      </button>
                    </Link>
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
