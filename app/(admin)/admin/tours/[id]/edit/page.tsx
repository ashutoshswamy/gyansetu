import { createServerClient } from "@/lib/supabase/server";
import { TourForm } from "@/components/features/tours/tour-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Tour } from "@/types";

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const { data: tour, error } = await db.from("tours").select("*").eq("id", id).single();
  if (error || !tour) notFound();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/tours" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Tours
        </Link>
        <div className="mb-6">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F" }}>Edit Tour</h1>
          <p style={{ fontSize: 13, color: "#9B9188", marginTop: 2 }}>{tour.title}</p>
        </div>
        <TourForm initialData={tour as Tour} />
      </div>
    </div>
  );
}
