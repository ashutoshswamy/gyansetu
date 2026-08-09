import Link from "next/link";
import { Home } from "lucide-react";
import { getAllLocalHosts } from "@/actions/local-hosts";
import { DeleteHostButton } from "./delete-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminLocalHostsPage() {
  const hosts = await getAllLocalHosts();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Local Hosts</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{hosts.length} local hosts on file</p>
          </div>
          <Link href="/admin/local-hosts/new">
            <Button>+ Add Local Host</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {hosts.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No local hosts added yet.</p>
          )}
          {hosts.map((h: (typeof hosts)[number]) => (
            <Card key={h.id}>
<CardContent className="flex items-center gap-4">
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(var(--gs-accent-rgb), 0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Home size={18} style={{ color: "var(--gs-accent)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{h.name}</span>
                  {h.group?.tours?.[0]?.title && (
                    <Badge style={{color: "#9B6B1F", background: "rgba(155, 107, 31, 0.08)"}}>
                      {h.group.tours[0].title}
                    </Badge>
                  )}
                  {h.group && (
                    <Badge style={{color: "var(--gs-accent)", background: "rgba(74, 85, 190, 0.08)"}}>
                      {h.group.name}
                    </Badge>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                  {[h.phone, h.email, [h.district, h.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "No contact details"}
                </div>
                {h.notes && <div style={{ fontSize: 12, color: "var(--gs-text-secondary)", marginTop: 4 }}>{h.notes}</div>}
              </div>
              <Link href={`/admin/local-hosts/${h.id}/edit`}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
              <DeleteHostButton id={h.id} />
            </CardContent>
</Card>
          ))}
        </div>
      </div>
    </div>
  );
}
