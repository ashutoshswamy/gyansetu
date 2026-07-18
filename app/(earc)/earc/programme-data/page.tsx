import { createServerClient } from "@/lib/supabase/server";
import { EarcFileList } from "@/components/features/earc/earc-file-list";
import { EarcUploadForm } from "@/components/features/earc/earc-upload-form";
import { BookMarked } from "lucide-react";

export default async function EarcProgrammeDataPage() {
  const db = createServerClient();
  const { data: files } = await db
    .from("earc_files")
    .select("id, name, file_url, file_type, description, created_at, users(name)")
    .eq("category", "programme_data")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              EARC Panel
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Programme Data</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              Upload and manage programme data files.
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(42,94,58,0.08)" }}>
            <BookMarked className="w-5 h-5" style={{ color: "#2A5E3A" }} />
          </div>
        </div>

        <EarcUploadForm category="programme_data" accentColor="#2A5E3A" />
        <EarcFileList files={files ?? []} accentColor="#2A5E3A" />
      </div>
    </div>
  );
}
