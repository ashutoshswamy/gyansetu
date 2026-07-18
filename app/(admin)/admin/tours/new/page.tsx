import { TourForm } from "@/components/features/tours/tour-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewTourPage() {
  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/tours" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Tours
        </Link>
        <div className="mb-6">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F" }}>Create Tour</h1>
        </div>
        <TourForm />
      </div>
    </div>
  );
}
