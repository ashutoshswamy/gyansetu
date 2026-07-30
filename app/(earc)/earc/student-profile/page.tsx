import { requireEarcUser } from "@/lib/clerk/action-auth";
import { getStudentProfiles, exportStudentProfilesCsv } from "@/actions/earc";
import { GraduationCap } from "lucide-react";
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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>EARC Panel</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Student Profile</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{profiles.length} student profiles submitted</p>
          </div>
          {isAdmin && (
            <ExportCsvButton exportAction={exportStudentProfilesCsv} filename="earc-student-profiles.csv" />
          )}
        </div>

        <div className="mb-4">
          <StudentProfileForm />
        </div>

        <div className="mb-8" style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", margin: "0 0 8px" }}>Bulk Upload</p>
          <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 10px" }}>
            Have data for many students? Download the template, fill it in the same format as the form above, then upload it here.
          </p>
          <BulkUploadButton />
        </div>

        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 12px" }}>Submitted Profiles</h2>
        {profiles.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247" }}>No student profiles submitted yet.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F3F0E8", borderBottom: "1px solid #E4DFD1" }}>
                    <th className="p-3 font-semibold text-[#5A5247]">Name</th>
                    <th className="p-3 font-semibold text-[#5A5247]">Gender</th>
                    <th className="p-3 font-semibold text-[#5A5247]">Standard</th>
                    <th className="p-3 font-semibold text-[#5A5247]">DOB</th>
                    <th className="p-3 font-semibold text-[#5A5247]">Mobile</th>
                    <th className="p-3 font-semibold text-[#5A5247]">Blood Group</th>
                    <th className="p-3 font-semibold text-[#5A5247]">Submitted By</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #E4DFD1" }}>
                      <td className="p-3 text-[#19140F]">{[s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ")}</td>
                      <td className="p-3 text-[#5A5247]">{s.gender}</td>
                      <td className="p-3 text-[#5A5247]">{s.standard}</td>
                      <td className="p-3 text-[#5A5247]">{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : "-"}</td>
                      <td className="p-3 text-[#5A5247]">{s.mobile_number ?? "-"}</td>
                      <td className="p-3 text-[#5A5247]">{s.blood_group ?? "-"}</td>
                      <td className="p-3 text-[#9B9188]">{s.submitter?.name ?? "Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
