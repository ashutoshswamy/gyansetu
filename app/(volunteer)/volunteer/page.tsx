import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/features/dashboard/stat-card";
import Link from "next/link";
import { Plane, CheckSquare, ArrowRight, Calendar, MapPin, ClipboardList, ClipboardCheck } from "lucide-react";
import type { DynamicForm } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AssignmentRow = {
  id: string;
  role_description?: string;
  tours?: { title: string; destination: string; start_date: string; end_date: string; status: string; participant_visible: boolean } | null;
};
type FormRow = Pick<DynamicForm, "id" | "title" | "fields"> & { tours?: { title: string } | null };

const tourStatusStyles: Record<string, { color: string; bg: string }> = {
  open:      { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  closed:    { color: "var(--gs-muted)", bg: "rgba(90,82,71,0.08)" },
  completed: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  draft:     { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
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

  const { data: assignments } = await db
    .from("volunteer_assignments")
    .select("*, tours(id, title, destination, start_date, end_date, status, participant_visible)")
    .eq("volunteer_id", uid);
  const tourIds = (assignments ?? [])
    .map((a: { tour_id: string | null }) => a.tour_id)
    .filter((id): id is string => !!id);

  let formsQuery = db.from("dynamic_forms").select("id, title, fields, tour_id, tours(title)").eq("target_role", "volunteer").eq("status", "active").eq("is_template", false);
  formsQuery = tourIds.length > 0
    ? formsQuery.or(`tour_id.is.null,tour_id.in.(${tourIds.join(",")})`)
    : formsQuery.is("tour_id", null);

  const [
    { data: forms },
    { data: testAttempts },
  ] = await Promise.all([
    formsQuery,
    db.from("test_attempts").select("id, status").eq("student_id", uid),
  ]);

  const activeTours = (assignments ?? []).filter((a: AssignmentRow) => a.tours?.status === "open" && a.tours?.participant_visible !== false);
  const testsTaken = testAttempts?.length ?? 0;
  const testsApproved = (testAttempts ?? []).filter((t: { status: string }) => t.status === "approved").length;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
            Volunteer Portal
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            Welcome, {user?.name ?? "Volunteer"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
            Manage your tour assignments and complete required forms
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Tour Assignments" value={assignments?.length ?? 0}  icon={<Plane size={18} />}      accent="emerald" />
          <StatCard label="Active Tours"      value={activeTours.length}        icon={<Calendar size={18} />}   accent="sky"     sub="currently ongoing" />
          <StatCard label="Pending Forms"     value={forms?.length ?? 0}        icon={<CheckSquare size={18} />} accent="amber"   sub="need completion" />
          <StatCard label="Tests Taken"       value={testsTaken}                 icon={<ClipboardList size={18} />} accent="indigo" />
          <StatCard label="Tests Approved"    value={testsApproved}              icon={<ClipboardCheck size={18} />} accent="emerald" />
        </div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tours */}
          <Card>
<CardContent>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>My Tour Assignments</h2>
              <Link href="/volunteer/tours" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gs-accent)", fontWeight: 500 }}>
                All tours <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {(assignments ?? []).length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Plane className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 14, color: "var(--gs-muted)", margin: "0 0 4px" }}>No tour assignments yet.</p>
                <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>An admin will assign you to tours.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(assignments ?? []).map((a: AssignmentRow) => {
                  const s = tourStatusStyles[a.tours?.status ?? "draft"] ?? tourStatusStyles.draft;
                  return (
                    <div key={a.id} style={{ background: "var(--gs-card)", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)", margin: "0 0 6px" }} className="truncate">
                            {a.tours?.title}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--gs-muted)" }}>
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
                            <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", marginTop: 6 }}>Role: {a.role_description}</p>
                          )}
                        </div>
                        <Badge style={{color: s.color, background: s.bg, flexShrink: 0, textTransform: "capitalize"}}>
                          {a.tours?.status ?? "-"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
</Card>

          {/* Tasks & Forms */}
          <Card>
<CardContent>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Tasks &amp; Forms</h2>
              <Link href="/volunteer/forms" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gs-accent)", fontWeight: 500 }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {(forms ?? []).length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <CheckSquare className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 14, color: "var(--gs-muted)", margin: "0 0 4px" }}>No pending forms.</p>
                <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>Forms assigned to volunteers will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {((forms ?? []) as unknown as FormRow[]).map((form) => (
                  <div key={form.id} style={{ background: "var(--gs-card)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)", margin: "0 0 3px" }} className="truncate">
                        {form.title}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>
                        {form.fields?.length ?? 0} fields{form.tours?.title && ` · ${form.tours.title}`}
                      </p>
                    </div>
                    <Link href={`/volunteer/forms/${form.id}`}>
                      <button style={{ background: "transparent", color: "var(--gs-success)", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 5, border: "1.5px solid rgba(var(--gs-success-rgb), 0.3)", cursor: "pointer", flexShrink: 0, marginLeft: 12 }}>
                        Fill Form
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
</Card>
        </div>
      </div>
    </div>
  );
}
