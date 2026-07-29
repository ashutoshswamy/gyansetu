import { getAllKitItems, getAllKitAssignments } from "@/actions/kits";
import { KitMaterialsTable } from "@/components/features/kits/kit-materials-table";
import { KitAssignmentActions } from "./kit-assignment-actions";
import { NewAssignmentForm } from "./new-assignment-form";

export default async function AdminKitsPage() {
  const [items, assignments] = await Promise.all([getAllKitItems(), getAllKitAssignments()]);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Kit Assembly & Inventory</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Catalog and per-group kit packing status</p>
        </div>

        {/* Kit Materials */}
        <div className="mb-10">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", marginBottom: 12 }}>Materials</h2>
          <KitMaterialsTable items={items} />
        </div>

        {/* Kit Assignments */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", marginBottom: 12 }}>Kit Assignments by Group</h2>
          <NewAssignmentForm assignedGroupIds={assignments.map((a: (typeof assignments)[number]) => a.group_id)} />
          <div className="space-y-2">
            {assignments.length === 0 && (
              <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "24px 0" }}>No kit assignments yet.</p>
            )}
            {assignments.map((a: (typeof assignments)[number]) => (
              <div key={a.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }}>{a.group?.name ?? "Unknown group"}</div>
                  <div style={{ fontSize: 12, color: "#9B9188" }}>{a.school_count} schools</div>
                </div>
                <KitAssignmentActions groupId={a.group_id} schoolCount={a.school_count} packed={a.packed} distributed={a.distributed} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
