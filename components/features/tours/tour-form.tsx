"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { tourSchema, type TourInput } from "@/lib/validations";
import { createTour, updateTour } from "@/actions/tours";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Tour } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
] as const;

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--gs-muted)",
  display: "block",
  marginBottom: 5,
};

const errStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--gs-danger-alt)",
  marginTop: 4,
};

export function TourForm({ initialData }: { initialData?: Tour }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
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
      toast.success(isEdit ? "Tour updated successfully" : "Tour created successfully");
      router.push("/admin/tours");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save tour";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
<CardContent>
        <div className="space-y-5">
          <div>
            <label style={labelStyle}>Tour Title *</label>
            <Input {...register("title")} placeholder="e.g. Japan Cultural Exchange 2026" />
            {errors.title && <p style={errStyle}>{errors.title.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <Textarea
              {...register("description")}
              placeholder="Tour details, objectives, itinerary..."
              rows={4}
            />
            {errors.description && <p style={errStyle}>{errors.description.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>Destination *</label>
            <Input {...register("destination")} placeholder="e.g. Tokyo, Japan" />
            {errors.destination && <p style={errStyle}>{errors.destination.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Start Date *</label>
              <Input type="date" {...register("start_date")} />
              {errors.start_date && <p style={errStyle}>{errors.start_date.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>End Date *</label>
              <Input type="date" {...register("end_date")} />
              {errors.end_date && <p style={errStyle}>{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Capacity (seats) *</label>
              <Input
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                placeholder="e.g. 30"
              />
              {errors.capacity && <p style={errStyle}>{errors.capacity.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg px-4 py-3" style={{ background: "rgba(var(--gs-danger-alt-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-alt-rgb), 0.2)", fontSize: 13, color: "var(--gs-danger-alt)" }}>
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Tour"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </CardContent>
</Card>
    </form>
  );
}
