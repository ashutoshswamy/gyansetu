import { requireEarcUser } from "@/lib/clerk/action-auth";
import { getSchoolProfiles, exportSchoolProfilesCsv } from "@/actions/earc";
import { School } from "lucide-react";
import { SchoolProfileForm } from "@/components/features/earc/school-profile-form";
import { ExportCsvButton } from "@/components/features/earc/export-csv-button";
import { SchoolBulkUploadButton } from "@/components/features/earc/school-bulk-upload-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StrengthRow {
  standard: string;
  boys: number;
  girls: number;
}

interface SchoolProfileRow {
  id: string;
  academic_year: string;
  project: string;
  school_name: string;
  state: string;
  district: string;
  taluka_block: string;
  village_city: string;
  school_type: string;
  module: string;
  mode: string;
  contact_number?: string | null;
  student_strength: StrengthRow[];
  num_teachers_involved: number;
  location_type: string;
  medium_of_instruction: string;
  duration_per_session: string;
  num_sessions_conducted: number;
  total_input_hours?: number | null;
  total_students?: number | null;
  created_at: string;
  submitter?: { id: string; name: string } | null;
}

export default async function SchoolProfilePage() {
  const { user } = await requireEarcUser();
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const profiles = (await getSchoolProfiles()) as unknown as SchoolProfileRow[];

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>EARC Panel</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>School Profile</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{profiles.length} school profiles submitted</p>
          </div>
          {isAdmin && (
            <ExportCsvButton exportAction={exportSchoolProfilesCsv} filename="earc-school-profiles.csv" />
          )}
        </div>

        <div className="mb-8">
          <SchoolProfileForm />
        </div>

        <Card>
<CardContent>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: "0 0 8px" }}>Bulk Upload</p>
          <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 10px" }}>
            Have data for many schools? Download the template, fill it in the same format as the form above, then upload it here.
            The <code>student_strength</code> column takes JSON, e.g. <code>{`[{"standard":"5th","boys":10,"girls":8}]`}</code>.
          </p>
          <SchoolBulkUploadButton />
        </CardContent>
</Card>

        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 12px" }}>Submitted Profiles</h2>
        {profiles.length === 0 ? (
          <Card>
<CardContent className="text-center">
            <School className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No school profiles submitted yet.</p>
          </CardContent>
</Card>
        ) : (
          <div className="space-y-3">
            {profiles.map(p => (
              <Card key={p.id}>
<CardContent>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{p.school_name}</span>
                  <Badge style={{color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.08)"}}>{p.project}</Badge>
                  <Badge style={{color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)"}}>{p.academic_year}</Badge>
                </div>
                <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>
                  {[p.village_city, p.taluka_block, p.district, p.state].filter(Boolean).join(", ")}
                  {" · "}{p.school_type} · {p.module} · {p.mode}
                </p>
                <div className="flex flex-wrap gap-4 mt-2" style={{ fontSize: 12, color: "var(--gs-text-secondary)" }}>
                  <span>Students: <strong>{p.total_students ?? "-"}</strong></span>
                  <span>Teachers: <strong>{p.num_teachers_involved}</strong></span>
                  <span>Sessions: <strong>{p.num_sessions_conducted}</strong> ({p.duration_per_session} each)</span>
                  <span>Total Input Hours: <strong>{p.total_input_hours ?? "-"}</strong></span>
                  <span>Medium: <strong>{p.medium_of_instruction}</strong></span>
                  <span>Location: <strong>{p.location_type}</strong></span>
                </div>
                <p style={{ fontSize: 11, color: "var(--gs-muted)", marginTop: 6 }}>
                  Submitted by {p.submitter?.name ?? "Unknown"} · {new Date(p.created_at).toLocaleDateString()}
                </p>
              </CardContent>
</Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
