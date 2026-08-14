"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { dynamicFormSchema, type DynamicFormInput } from "@/lib/validations";
import { redis } from "@/lib/redis/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { getClientIp } from "@/lib/rate-limit";
import type { FormField } from "@/types";

const MAX_FIELD_TEXT_LEN = 5000;

function validateSubmissionAgainstFields(fields: FormField[], data: Record<string, unknown>) {
  const validated: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === "file" || field.type === "image") continue; // handled separately, uploaded to storage

    const raw = data[field.id];
    const isEmpty = raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0);

    if (field.required && isEmpty) throw new Error(`"${field.label}" is required`);
    if (isEmpty) continue;

    if (field.type === "number") {
      if (typeof raw !== "number" || !Number.isFinite(raw)) throw new Error(`"${field.label}" must be a number`);
      validated[field.id] = raw;
    } else if (field.type === "checkbox") {
      const options = field.options ?? [];
      if (!Array.isArray(raw) || !raw.every((v) => typeof v === "string" && options.includes(v))) {
        throw new Error(`"${field.label}" has an invalid selection`);
      }
      validated[field.id] = raw;
    } else if (field.type === "select" || field.type === "radio") {
      const options = field.options ?? [];
      if (typeof raw !== "string" || !options.includes(raw)) {
        throw new Error(`"${field.label}" has an invalid selection`);
      }
      validated[field.id] = raw;
    } else {
      if (typeof raw !== "string" || raw.length > MAX_FIELD_TEXT_LEN) {
        throw new Error(`"${field.label}" is invalid or too long`);
      }
      validated[field.id] = raw;
    }
  }

  return validated;
}

const submitRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

export async function createForm(input: DynamicFormInput, tourIds?: string[]) {
  const { db, user } = await requireAdminUser();
  const data = dynamicFormSchema.parse(input);

  // Bulk-create: one linked row per selected tour, so admins can assign the
  // same form to multiple tours in one action instead of repeating it per tour.
  const ids = tourIds && tourIds.length > 0 ? tourIds : [data.tour_id ?? null];

  const { data: forms, error } = await db
    .from("dynamic_forms")
    .insert(ids.map((tour_id) => ({ ...data, tour_id, created_by: user.id })))
    .select();

  if (error) { console.error("[createForm]", error); throw new Error("Failed to create form"); }

  revalidatePath("/admin/forms");

  return forms;
}

export async function updateForm(id: string, input: DynamicFormInput) {
  const { db } = await requireAdminUser();
  const data = dynamicFormSchema.parse(input);

  const { data: form, error } = await db
    .from("dynamic_forms")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("[updateForm]", error); throw new Error("Failed to update form"); }

  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}/edit`);

  return form;
}

export async function deleteForm(id: string) {
  const { db } = await requireAdminUser();

  const { error } = await db.from("dynamic_forms").delete().eq("id", id);
  if (error) { console.error("[deleteForm]", error); throw new Error("Failed to delete form"); }

  revalidatePath("/admin/forms");
}

const submissionSchema = z.object({
  form_id: z.string().uuid(),
  data: z.record(z.string(), z.unknown()),
});

export async function submitForm(input: z.infer<typeof submissionSchema>) {
  const { db, user, userId } = await getAuthenticatedUser();

  const { success } = await submitRatelimit.limit(`form-submit:${userId}`);
  if (!success) throw new Error("Too many submissions. Please wait before trying again.");

  const ip = await getClientIp();
  const { success: ipOk } = await submitRatelimit.limit(`form-submit:ip:${ip}`);
  if (!ipOk) throw new Error("Too many submissions. Please wait before trying again.");

  const { form_id, data } = submissionSchema.parse(input);

  const { data: form } = await db
    .from("dynamic_forms")
    .select("status, fields, is_template")
    .eq("id", form_id)
    .maybeSingle();

  if (!form || form.status !== "active" || form.is_template) throw new Error("Form not available");

  // Validate each submitted value against its field definition (type, options, required,
  // length) instead of trusting the raw client payload — also drops any keys not defined
  // on the form and strips file/image fields (uploaded to storage separately).
  const fields: FormField[] = form.fields ?? [];
  const sanitizedData = validateSubmissionAgainstFields(fields, data);

  const { data: submission, error } = await db
    .from("form_submissions")
    .insert({ form_id, submitted_by: user.id, data: sanitizedData })
    .select()
    .single();

  if (error) { console.error("[submitForm]", error); throw new Error("Failed to submit form"); }

  revalidatePath("/enrollee/forms");
  revalidatePath("/volunteer/forms");

  return submission;
}

// The caller's own submissions, optionally scoped to one tour's forms — feeds
// /enrollee/history/[tourId]. Scoped by submitted_by = caller, so it's safe for any role.
export async function getMyFormSubmissions(tourId?: string) {
  const { db, user } = await getAuthenticatedUser();
  let query = db
    .from("form_submissions")
    .select("*, dynamic_forms!inner(id, title, tour_id, fields)")
    .eq("submitted_by", user.id);
  if (tourId) query = query.eq("dynamic_forms.tour_id", tourId);

  const { data, error } = await query.order("submitted_at", { ascending: false });
  if (error) { console.error("[getMyFormSubmissions]", error); throw new Error("Failed to fetch submissions"); }
  return data ?? [];
}

// Feeds the volunteer sidebar's "forms completed" badge.
export async function getMyFormProgress() {
  const { db, user } = await getAuthenticatedUser();

  const { data: activeForms, error: formsError } = await db
    .from("dynamic_forms")
    .select("id")
    .in("target_role", ["volunteer", "all"])
    .eq("status", "active")
    .eq("is_template", false);
  if (formsError) { console.error("[getMyFormProgress]", formsError); throw new Error("Failed to fetch progress"); }

  if (!activeForms || activeForms.length === 0) return { completed: 0, total: 0 };

  const formIds = activeForms.map((f) => f.id);
  const { data: submissions, error: subsError } = await db
    .from("form_submissions")
    .select("form_id")
    .eq("submitted_by", user.id)
    .in("form_id", formIds);
  if (subsError) { console.error("[getMyFormProgress]", subsError); throw new Error("Failed to fetch progress"); }

  const completedIds = new Set(submissions?.map((s) => s.form_id) ?? []);
  return { completed: completedIds.size, total: activeForms.length };
}
