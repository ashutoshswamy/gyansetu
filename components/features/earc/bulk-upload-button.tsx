"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { bulkCreateStudentProfiles } from "@/actions/earc";
import type { EarcStudentProfileInput } from "@/lib/validations";

const TEMPLATE_COLUMNS = [
  "first_name", "middle_name", "last_name", "mobile_number", "date_of_birth",
  "gender", "blood_group", "standard", "apaar_id", "aadhaar_number",
] as const;

export function BulkUploadButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS as unknown as string[],
      ["Asha", "", "Patil", "9876543210", "2015-06-01", "Female", "O+", "5th", "", ""],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Student Data");
    XLSX.writeFile(wb, "earc-student-data-template.xlsx");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, dateNF: "yyyy-mm-dd" });

      if (rows.length === 0) {
        toast.error("No rows found in uploaded file");
        return;
      }

      const inputs: EarcStudentProfileInput[] = rows.map(r => ({
        first_name: String(r.first_name ?? "").trim(),
        middle_name: r.middle_name ? String(r.middle_name).trim() : undefined,
        last_name: String(r.last_name ?? "").trim(),
        mobile_number: r.mobile_number ? String(r.mobile_number).trim() : undefined,
        date_of_birth: r.date_of_birth ? String(r.date_of_birth).trim() : undefined,
        gender: String(r.gender ?? "").trim() as EarcStudentProfileInput["gender"],
        blood_group: r.blood_group ? (String(r.blood_group).trim() as EarcStudentProfileInput["blood_group"]) : undefined,
        standard: String(r.standard ?? "").trim() as EarcStudentProfileInput["standard"],
        apaar_id: r.apaar_id ? String(r.apaar_id).trim() : undefined,
        aadhaar_number: r.aadhaar_number ? String(r.aadhaar_number).trim() : undefined,
      }));

      const result = await bulkCreateStudentProfiles(inputs);
      if (result.created > 0) toast.success(`${result.created} student profile(s) uploaded`);
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
