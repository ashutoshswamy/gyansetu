import { getAllAlumniRegistrations } from "@/actions/alumni-registration";
import { ExportButton } from "@/components/features/export-button";
import { Inbox } from "lucide-react";

type Visit = { year?: string; month?: string; location?: string; role?: string };

export default async function AlumniAdminPage() {
  const registrations = await getAllAlumniRegistrations();

  const exportData = registrations.map((r) => {
    const row: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(r)) {
      if (key === "visit_history") {
        row[key] = ((value as Visit[]) ?? [])
          .map((v) => [v.year, v.month, v.location, v.role].filter(Boolean).join(" "))
          .join("; ");
      } else {
        row[key] = Array.isArray(value) ? value.join(", ") : value;
      }
    }
    return row;
  });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Alumni Registrations</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              Every field submitted via the alumni network form &middot; {registrations.length} total &middot; download for the full column set
            </p>
          </div>
          {registrations.length > 0 && (
            <ExportButton data={exportData} filename="alumni-registrations.csv" />
          )}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
          {registrations.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 14, color: "#9B9188" }}>No alumni registrations yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F3F0E8", borderBottom: "1px solid #E4DFD1" }}>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 160 }}>Name</th>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 200 }}>Email</th>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 150 }}>Mobile</th>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 220 }}>Latest Visit</th>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 180 }}>Company / Institution</th>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 130 }}>Willing to Mentor</th>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 130 }}>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => {
                    const visits = (r.visit_history as Visit[]) ?? [];
                    const latest = visits[0];
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #E4DFD1" }} className="hover:bg-slate-50/50">
                        <td className="p-4 font-medium text-[#19140F]">{r.name}</td>
                        <td className="p-4 text-[#5A5247]">{r.email}</td>
                        <td className="p-4 text-[#19140F]">{r.mobile_number || "-"}</td>
                        <td className="p-4 text-[#19140F]">
                          {latest ? [latest.year, latest.month, latest.location, latest.role].filter(Boolean).join(" · ") : (r.tour_destination || "-")}
                        </td>
                        <td className="p-4 text-[#19140F]">{r.company_name || r.institution || "-"}</td>
                        <td className="p-4 text-[#19140F]">{r.willing_to_mentor_new || (r.willing_to_mentor ? "Yes" : "-")}</td>
                        <td className="p-4 text-[#5A5247]">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
