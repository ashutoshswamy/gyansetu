import { getAllVolunteerProfiles } from "@/actions/profiles";
import { Card, CardContent } from "@/components/ui/card";
import { ExportButton } from "@/components/features/export-button";
import { Inbox, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AadhaarToggleButton } from "./aadhaar-toggle-button";

export default async function ProfilesPage() {
  const profiles = await getAllVolunteerProfiles();

  const exportData = profiles.map((p) => {
    const { users, ...rest } = p as typeof p & { users?: { name?: string; email?: string; role?: string | null } };
    const row: Record<string, unknown> = {
      Name: users?.name ?? "",
      Email: users?.email ?? "",
      Role: users?.role ?? "Enrollee",
    };
    for (const [key, value] of Object.entries(rest)) {
      row[key] = Array.isArray(value) ? value.join(", ") : value;
    }
    return row;
  });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Submitted Profile Data</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
              Every field submitted by enrollees and volunteers &middot; {profiles.length} total &middot; download for the full column set
            </p>
          </div>
          {profiles.length > 0 && (
            <ExportButton data={exportData} filename="profile-submissions.csv" />
          )}
        </div>

        <Card>
          {profiles.length === 0 ? (
            <CardContent className="text-center py-16">
              <Inbox className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
              <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>No profile submissions yet.</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--gs-card)", borderBottom: "1px solid var(--border)" }}>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 160 }}>Name</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 100 }}>Role</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 150 }}>Phone</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 160 }}>City / State</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 180 }}>Institution / Company</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 180 }}>Emergency Contact</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 110 }}>Consent</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 180 }}>Aadhaar</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 130 }}>Submitted</th>
                    <th className="p-4 font-semibold text-[var(--gs-text-secondary)]" style={{ minWidth: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => {
                    const role = p.users?.role ?? null;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-medium text-[var(--foreground)]">{p.users?.name ?? "Unknown"}</div>
                          <div className="text-xs text-[var(--gs-muted)]">{p.users?.email ?? "-"}</div>
                        </td>
                        <td className="p-4 text-[var(--foreground)]">
                          {role === "volunteer" ? "Volunteer" : "Enrollee"}
                        </td>
                        <td className="p-4 text-[var(--foreground)]">{p.phone || p.alternate_phone || "-"}</td>
                        <td className="p-4 text-[var(--foreground)]">{[p.city, p.state].filter(Boolean).join(", ") || "-"}</td>
                        <td className="p-4 text-[var(--foreground)]">{p.institution || p.company_name || "-"}</td>
                        <td className="p-4 text-[var(--foreground)]">
                          {p.emergency_contact_name ? `${p.emergency_contact_name}${p.emergency_contact_phone ? ` (${p.emergency_contact_phone})` : ""}` : "-"}
                        </td>
                        <td className="p-4">
                          {p.consent_given ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gs-success)" }}>
                              <CheckCircle size={12} /> Yes
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gs-warning-alt)" }}>
                              <AlertCircle size={12} /> No
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {role === "volunteer" ? (
                            <AadhaarToggleButton userId={p.user_id} verified={!!p.aadhaar_verified} />
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>-</span>
                          )}
                        </td>
                        <td className="p-4 text-[var(--gs-text-secondary)]">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          {role === "volunteer" && (
                            <Link href={`/admin/volunteers/${p.user_id}`} style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-accent)", textDecoration: "none" }}>
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
