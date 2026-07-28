"use client";

import { useState } from "react";
import { ShieldCheck, School, GraduationCap, LayoutDashboard } from "lucide-react";
import { EarcStaffTable } from "./earc-staff-table";
import { EarcAnalytics } from "@/components/features/earc/earc-analytics";
import { ExportCsvButton } from "@/components/features/earc/export-csv-button";
import { exportSchoolProfilesCsv, exportStudentProfilesCsv } from "@/actions/earc";

interface EarcCandidate {
  id: string;
  clerk_id: string;
  name: string;
  email: string;
  role: string;
}

interface StrengthRow { standard: string; boys: number; girls: number }

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
  created_at: string;
  submitter?: { id: string; name: string } | null;
}

const TABS = [
  { key: "analytics", label: "Dashboard", icon: LayoutDashboard },
  { key: "roles", label: "Role Management", icon: ShieldCheck },
  { key: "schools", label: "School Profiles", icon: School },
  { key: "students", label: "Student Profiles", icon: GraduationCap },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function EarcDashboardTabs({
  users, currentUserId, schoolProfiles, studentProfiles,
}: {
  users: EarcCandidate[];
  currentUserId: string;
  schoolProfiles: SchoolProfileRow[];
  studentProfiles: StudentProfileRow[];
}) {
  const [tab, setTab] = useState<TabKey>("analytics");

  return (
    <div>
      <div className="flex gap-1 mb-6 flex-wrap" style={{ borderBottom: "1px solid #E4DFD1" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5"
              style={{
                fontSize: 13, fontWeight: 600, padding: "10px 16px", border: "none", cursor: "pointer",
                background: "transparent", color: active ? "#2A5E3A" : "#9B9188",
                borderBottom: active ? "2px solid #2A5E3A" : "2px solid transparent", marginBottom: -1,
              }}
            >
              <Icon size={14} />
              {t.label}
              {t.key === "schools" && ` (${schoolProfiles.length})`}
              {t.key === "students" && ` (${studentProfiles.length})`}
              {t.key === "roles" && ` (${users.length})`}
            </button>
          );
        })}
      </div>

      {tab === "analytics" && (
        <EarcAnalytics schoolProfiles={schoolProfiles} studentProfiles={studentProfiles} />
      )}

      {tab === "roles" && (
        users.length === 0 ? (
          <div className="rounded-xl py-16 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 14, color: "#9B9188" }}>No users yet.</p>
          </div>
        ) : (
          <EarcStaffTable users={users} currentUserId={currentUserId} />
        )
      )}

      {tab === "schools" && (
        <div>
          <div className="flex justify-end mb-4">
            <ExportCsvButton exportAction={exportSchoolProfilesCsv} filename="earc-school-profiles.csv" />
          </div>
          {schoolProfiles.length === 0 ? (
            <div className="rounded-xl py-16 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
              <School className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 14, color: "#9B9188" }}>No school profiles submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schoolProfiles.map(p => (
                <div key={p.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px" }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{p.school_name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>{p.project}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#2A5E3A", background: "rgba(42,94,58,0.08)" }}>{p.academic_year}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                    {[p.village_city, p.taluka_block, p.district, p.state].filter(Boolean).join(", ")}
                    {" · "}{p.school_type} · {p.module} · {p.mode}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2" style={{ fontSize: 12, color: "#5A5247" }}>
                    <span>Students: <strong>{p.total_students ?? "-"}</strong></span>
                    <span>Teachers: <strong>{p.num_teachers_involved}</strong></span>
                    <span>Sessions: <strong>{p.num_sessions_conducted}</strong> ({p.duration_per_session} each)</span>
                    <span>Total Input Hours: <strong>{p.total_input_hours ?? "-"}</strong></span>
                  </div>
                  <p style={{ fontSize: 11, color: "#9B9188", marginTop: 6 }}>
                    Submitted by {p.submitter?.name ?? "Unknown"} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "students" && (
        <div>
          <div className="flex justify-end mb-4">
            <ExportCsvButton exportAction={exportStudentProfilesCsv} filename="earc-student-profiles.csv" />
          </div>
          {studentProfiles.length === 0 ? (
            <div className="rounded-xl py-16 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
              <GraduationCap className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 14, color: "#9B9188" }}>No student profiles submitted yet.</p>
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
                    {studentProfiles.map(s => (
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
      )}
    </div>
  );
}
