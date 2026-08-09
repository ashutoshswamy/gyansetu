import { getAllKitItems, getAllKitAssignments } from "@/actions/kits";
import { KitMaterialsTable } from "@/components/features/kits/kit-materials-table";
import { KitAssignmentActions } from "./kit-assignment-actions";
import { NewAssignmentForm } from "./new-assignment-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminKitsPage() {
  const [items, assignments] = await Promise.all([getAllKitItems(), getAllKitAssignments()]);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Kit Assembly & Inventory</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Catalog and per-group kit packing status</p>
        </div>

        {/* Kit Materials */}
        <div className="mb-10">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", marginBottom: 12 }}>Materials</h2>
          <KitMaterialsTable items={items} />
        </div>

        {/* Kit Assignments */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", marginBottom: 12 }}>Kit Assignments by Group</h2>
          <NewAssignmentForm assignedGroupIds={assignments.map((a: (typeof assignments)[number]) => a.group_id)} />
          <div className="space-y-2">
            {assignments.length === 0 && (
              <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>No kit assignments yet.</p>
            )}
            {assignments.map((a: (typeof assignments)[number]) => (
              <Card key={a.id}>
<CardContent className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{a.group?.name ?? "Unknown group"}</div>
                  <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>{a.school_count} schools</div>
                </div>
                <KitAssignmentActions groupId={a.group_id} schoolCount={a.school_count} packed={a.packed} distributed={a.distributed} />
              </CardContent>
</Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
