import { getAllAlumniRegistrations } from "@/actions/alumni-registration";
import { ExportButton } from "@/components/features/export-button";
import { Inbox } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
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
            <Table className="text-left text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px] whitespace-normal">Name</TableHead>
                  <TableHead className="min-w-[200px] whitespace-normal">Email</TableHead>
                  <TableHead className="min-w-[150px] whitespace-normal">Mobile</TableHead>
                  <TableHead className="min-w-[220px] whitespace-normal">Latest Visit</TableHead>
                  <TableHead className="min-w-[180px] whitespace-normal">Company / Institution</TableHead>
                  <TableHead className="min-w-[130px] whitespace-normal">Willing to Mentor</TableHead>
                  <TableHead className="min-w-[130px] whitespace-normal">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((r) => {
                  const visits = (r.visit_history as Visit[]) ?? [];
                  const latest = visits[0];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium whitespace-normal">{r.name}</TableCell>
                      <TableCell className="whitespace-normal">{r.email}</TableCell>
                      <TableCell className="whitespace-normal">{r.mobile_number || "-"}</TableCell>
                      <TableCell className="whitespace-normal">
                        {latest ? [latest.year, latest.month, latest.location, latest.role].filter(Boolean).join(" · ") : (r.tour_destination || "-")}
                      </TableCell>
                      <TableCell className="whitespace-normal">{r.company_name || r.institution || "-"}</TableCell>
                      <TableCell className="whitespace-normal">{r.willing_to_mentor_new || (r.willing_to_mentor ? "Yes" : "-")}</TableCell>
                      <TableCell className="whitespace-normal">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
