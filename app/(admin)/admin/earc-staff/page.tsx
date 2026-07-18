import { createServerClient } from "@/lib/supabase/server";
import { EarcStaffForm } from "./earc-staff-form";
import { EarcStaffList } from "./earc-staff-list";
import { ShieldCheck } from "lucide-react";

export default async function AdminEarcStaffPage() {
  const db = createServerClient();
  const { data: staff } = await db
    .from("users")
    .select("id, clerk_id, name, email, created_at")
    .eq("role", "earc_staff")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>EARC Staff</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {staff?.length ?? 0} staff member{staff?.length !== 1 ? "s" : ""} &middot; create and manage EARC panel access
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(184,56,30,0.08)" }}>
            <ShieldCheck className="w-5 h-5" style={{ color: "#B8381E" }} />
          </div>
        </div>

        <EarcStaffForm />
        <EarcStaffList staff={staff ?? []} />
      </div>
    </div>
  );
}
