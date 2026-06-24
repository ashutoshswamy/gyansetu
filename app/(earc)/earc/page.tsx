import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { FolderOpen, GraduationCap, BookMarked, FileText } from "lucide-react";

export default async function EarcDashboardPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: dbUser } = await db
    .from("users")
    .select("id, name, role")
    .eq("clerk_id", userId!)
    .maybeSingle();

  const [studentCount, programmeCount, documentCount] = await Promise.all([
    db.from("earc_files").select("id", { count: "exact", head: true }).eq("category", "student_data"),
    db.from("earc_files").select("id", { count: "exact", head: true }).eq("category", "programme_data"),
    db.from("earc_files").select("id", { count: "exact", head: true }).eq("category", "document"),
  ]);

  const stats = [
    { label: "Student Data Files", value: studentCount.count ?? 0, Icon: GraduationCap, color: "#4A55BE" },
    { label: "Programme Data Files", value: programmeCount.count ?? 0, Icon: BookMarked, color: "#2A5E3A" },
    { label: "Documents", value: documentCount.count ?? 0, Icon: FolderOpen, color: "#B8381E" },
  ];

  const { data: recentFiles } = await db
    .from("earc_files")
    .select("id, name, category, description, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const categoryLabel: Record<string, string> = {
    student_data: "Student Data",
    programme_data: "Programme Data",
    document: "Document",
  };

  const categoryColor: Record<string, { color: string; bg: string }> = {
    student_data:   { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
    programme_data: { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
    document:       { color: "#B8381E", bg: "rgba(184,56,30,0.08)" },
  };

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            EARC Panel
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Welcome{dbUser?.name ? `, ${dbUser.name}` : ""}. Manage EARC files and data.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(({ label, value, Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-5"
              style={{ background: "white", border: "1px solid #E4DFD1" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}14` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#9B9188", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {label}
                </p>
              </div>
              <p style={{ fontSize: 32, fontWeight: 700, color, fontFamily: "var(--font-geist-mono), monospace" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #E4DFD1" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>Recent Uploads</h2>
          </div>

          {(recentFiles ?? []).length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 14, color: "#9B9188" }}>No files uploaded yet.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#E4DFD1" }}>
              {(recentFiles ?? []).map((f: any) => {
                const cat = categoryColor[f.category] ?? categoryColor.document;
                return (
                  <div key={f.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#19140F" }} className="truncate">{f.name}</p>
                      {f.description && (
                        <p style={{ fontSize: 12, color: "#9B9188" }} className="truncate">{f.description}</p>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: cat.color, background: cat.bg, flexShrink: 0 }}>
                      {categoryLabel[f.category] ?? f.category}
                    </span>
                    <span style={{ fontSize: 11, color: "#9B9188", flexShrink: 0 }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
