"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tourSchema, type TourInput } from "@/lib/validations";
import { createTour, updateTour } from "@/actions/tours";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Tour } from "@/types";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 14,
  border: "1.5px solid #E4DFD1",
  borderRadius: 7,
  background: "white",
  color: "#19140F",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#9B9188",
  display: "block",
  marginBottom: 5,
};

const errStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#B8381E",
  marginTop: 4,
};

export function TourForm({ initialData }: { initialData?: Tour }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tourSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          destination: initialData.destination,
          start_date: initialData.start_date,
          end_date: initialData.end_date,
          capacity: initialData.capacity,
          status: initialData.status,
        }
      : { status: "draft" as const },
  });

  async function onSubmit(data: TourInput) {
    setError(null);
    try {
      if (isEdit) {
        await updateTour(initialData.id, data);
      } else {
        await createTour(data);
      }
      router.push("/admin/tours");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save tour");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl p-6" style={{ background: "white", border: "1px solid #E4DFD1" }}>
        <div className="space-y-5">
          <div>
            <label style={labelStyle}>Tour Title *</label>
            <input {...register("title")} placeholder="e.g. Japan Cultural Exchange 2026" style={inputStyle} />
            {errors.title && <p style={errStyle}>{errors.title.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea
              {...register("description")}
              placeholder="Tour details, objectives, itinerary..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            {errors.description && <p style={errStyle}>{errors.description.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>Destination *</label>
            <input {...register("destination")} placeholder="e.g. Tokyo, Japan" style={inputStyle} />
            {errors.destination && <p style={errStyle}>{errors.destination.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Start Date *</label>
              <input type="date" {...register("start_date")} style={inputStyle} />
              {errors.start_date && <p style={errStyle}>{errors.start_date.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>End Date *</label>
              <input type="date" {...register("end_date")} style={inputStyle} />
              {errors.end_date && <p style={errStyle}>{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Capacity (seats) *</label>
              <input
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                placeholder="e.g. 30"
                style={inputStyle}
              />
              {errors.capacity && <p style={errStyle}>{errors.capacity.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select {...register("status")} style={inputStyle}>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg px-4 py-3" style={{ background: "rgba(184,56,30,0.07)", border: "1px solid rgba(184,56,30,0.2)", fontSize: 13, color: "#B8381E" }}>
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ fontSize: 13, fontWeight: 600, padding: "9px 22px", borderRadius: 6, border: "none", background: isSubmitting ? "#C8C4BC" : "#19140F", color: "white", cursor: isSubmitting ? "not-allowed" : "pointer" }}
          >
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Tour"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ fontSize: 13, padding: "9px 18px", borderRadius: 6, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
