import { Package } from "lucide-react";
import { getAllKitItems, getAllKitAssignments } from "@/actions/kits";
import { KitItemForm } from "./kit-item-form";
import { DeleteKitItemButton } from "./kit-item-row";
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

        {/* Kit Items Catalog */}
        <div className="mb-10">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", marginBottom: 12 }}>Kit Items Catalog</h2>
          <KitItemForm />
          <div className="space-y-2">
            {items.length === 0 && (
              <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "24px 0" }}>No kit items in catalog yet.</p>
            )}
            {items.map((item: (typeof items)[number]) => (
              <div key={item.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(74,85,190,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Package size={16} style={{ color: "#4A55BE" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#19140F" }}>{item.name}</span>
                    {item.category && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#9B9188" }}>
                    {item.quantity_per_school} per school{item.notes ? ` · ${item.notes}` : ""}
                  </div>
                </div>
                <DeleteKitItemButton id={item.id} />
              </div>
            ))}
          </div>
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
