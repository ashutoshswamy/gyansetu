"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { bulkCreateSchoolProfiles } from "@/actions/earc";
import type { EarcSchoolProfileInput } from "@/lib/validations";

const TEMPLATE_COLUMNS = [
  "academic_year", "project", "school_name", "state", "district", "taluka_block", "village_city",
  "school_type", "module", "mode", "contact_number", "student_strength", "num_teachers_involved",
  "location_type", "medium_of_instruction", "duration_per_session", "num_sessions_conducted",
] as const;

export function SchoolBulkUploadButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS as unknown as string[],
      [
        "2025-26", "Chhote Scientists", "Zilla Parishad School", "Maharashtra", "Pune", "Haveli", "Wagholi",
        "Government", "Facilitator", "Offline", "9876543210", '[{"standard":"5th","boys":10,"girls":8}]', "2",
        "Rural", "Marathi", "1 hr", "4",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "School Data");
    XLSX.writeFile(wb, "earc-school-data-template.xlsx");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false });

      if (rows.length === 0) {
        toast.error("No rows found in uploaded file");
        return;
      }

      const inputs: EarcSchoolProfileInput[] = rows.map(r => {
        // Invalid JSON collapses to [] rather than throwing here — the server's
        // min(1) check on student_strength then reports it as a normal per-row failure.
        let studentStrength: EarcSchoolProfileInput["student_strength"] = [];
        try {
          const parsed = JSON.parse(String(r.student_strength ?? "[]"));
          if (Array.isArray(parsed)) studentStrength = parsed;
        } catch {
          // leave as []
        }

        return {
          academic_year: String(r.academic_year ?? "").trim() as EarcSchoolProfileInput["academic_year"],
          project: String(r.project ?? "").trim() as EarcSchoolProfileInput["project"],
          school_name: String(r.school_name ?? "").trim(),
          state: String(r.state ?? "").trim(),
          district: String(r.district ?? "").trim(),
          taluka_block: String(r.taluka_block ?? "").trim(),
          village_city: String(r.village_city ?? "").trim(),
          school_type: String(r.school_type ?? "").trim() as EarcSchoolProfileInput["school_type"],
          module: String(r.module ?? "").trim() as EarcSchoolProfileInput["module"],
          mode: String(r.mode ?? "").trim() as EarcSchoolProfileInput["mode"],
          contact_number: r.contact_number ? String(r.contact_number).trim() : undefined,
          student_strength: studentStrength,
          num_teachers_involved: Number(r.num_teachers_involved ?? 0),
          location_type: String(r.location_type ?? "").trim() as EarcSchoolProfileInput["location_type"],
          medium_of_instruction: String(r.medium_of_instruction ?? "").trim() as EarcSchoolProfileInput["medium_of_instruction"],
          duration_per_session: String(r.duration_per_session ?? "").trim() as EarcSchoolProfileInput["duration_per_session"],
          num_sessions_conducted: Number(r.num_sessions_conducted ?? 0),
        };
      });

      const result = await bulkCreateSchoolProfiles(inputs);
      if (result.created > 0) toast.success(`${result.created} school profile(s) uploaded`);
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} row(s) failed: ${result.failed.slice(0, 3).map(f => `row ${f.row} (${f.error})`).join("; ")}`);
      }
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to process uploaded file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={downloadTemplate}
        className="flex items-center gap-1.5"
        style={{ fontSize: 13, fontWeight: 600, color: "var(--gs-success)", background: "white", border: "1px solid var(--gs-success)", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}
      >
        <Download size={14} />
        Download Excel Template
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5"
        style={{ fontSize: 13, fontWeight: 600, color: "white", background: "var(--gs-success)", padding: "8px 16px", borderRadius: 6, border: "none", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}
      >
        <UploadCloud size={14} />
        {uploading ? "Uploading..." : "Bulk Upload Excel"}
      </button>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}
