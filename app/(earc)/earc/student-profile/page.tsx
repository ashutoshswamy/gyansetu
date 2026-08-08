import { requireEarcUser } from "@/lib/clerk/action-auth";
import { getStudentProfiles, exportStudentProfilesCsv } from "@/actions/earc";
import { GraduationCap } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StudentProfileForm } from "@/components/features/earc/student-profile-form";
import { ExportCsvButton } from "@/components/features/earc/export-csv-button";
import { BulkUploadButton } from "@/components/features/earc/bulk-upload-button";

interface StudentProfileRow {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  mobile_number?: string | null;
  date_of_birth?: string | null;
  gender: string;
  blood_group?: string | null;
  standard: string;
  apaar_id?: string | null;
  aadhaar_number?: string | null;
  created_at: string;
  submitter?: { id: string; name: string } | null;
}

export default async function StudentProfilePage() {
  const { user } = await requireEarcUser();
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const profiles = (await getStudentProfiles()) as unknown as StudentProfileRow[];

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>EARC Panel</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Student Profile</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{profiles.length} student profiles submitted</p>
          </div>
          {isAdmin && (
            <ExportCsvButton exportAction={exportStudentProfilesCsv} filename="earc-student-profiles.csv" />
          )}
        </div>

        <div className="mb-4">
          <StudentProfileForm />
        </div>

        <div className="mb-8" style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: "0 0 8px" }}>Bulk Upload</p>
          <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 10px" }}>
            Have data for many students? Download the template, fill it in the same format as the form above, then upload it here.
          </p>
          <BulkUploadButton />
        </div>

        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 12px" }}>Submitted Profiles</h2>
        {profiles.length === 0 ? (
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No student profiles submitted yet.</p>
          </div>
        ) : (
          <Table className="rounded-xl overflow-hidden border border-border">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Submitted By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{[s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ")}</TableCell>
                  <TableCell>{s.gender}</TableCell>
                  <TableCell>{s.standard}</TableCell>
                  <TableCell>{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{s.mobile_number ?? "-"}</TableCell>
                  <TableCell>{s.blood_group ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.submitter?.name ?? "Unknown"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
