import Link from "next/link";
import { Home } from "lucide-react";
import { getAllLocalHosts } from "@/actions/local-hosts";
import { DeleteHostButton } from "./delete-button";

export default async function AdminLocalHostsPage() {
  const hosts = await getAllLocalHosts();

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Local Hosts</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{hosts.length} local hosts on file</p>
          </div>
          <Link href="/admin/local-hosts/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + Add Local Host
            </button>
          </Link>
        </div>

        <div className="space-y-3">
          {hosts.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No local hosts added yet.</p>
          )}
          {hosts.map((h: (typeof hosts)[number]) => (
            <div key={h.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(74,85,190,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Home size={18} style={{ color: "#4A55BE" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }}>{h.name}</span>
                  {h.group && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>
                      {h.group.name}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#9B9188" }}>
                  {[h.phone, h.email, [h.city, h.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "No contact details"}
                </div>
                {h.notes && <div style={{ fontSize: 12, color: "#5A5247", marginTop: 4 }}>{h.notes}</div>}
              </div>
              <DeleteHostButton id={h.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
