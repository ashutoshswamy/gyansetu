"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { dynamicFormSchema, type DynamicFormInput } from "@/lib/validations";
import { redis } from "@/lib/redis/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
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

export async function createForm(input: DynamicFormInput) {
  const { db, user } = await requireAdminUser();
  const data = dynamicFormSchema.parse(input);

  const { data: form, error } = await db
    .from("dynamic_forms")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();

  if (error) { console.error("[createForm]", error); throw new Error("Failed to create form"); }

  revalidatePath("/admin/forms");

  return form;
}

export async function updateForm(id: string, input: DynamicFormInput) {
  const { db } = await requireAdminUser();
  const data = dynamicFormSchema.parse(input);

  const { data: form, error } = await db
    .from("dynamic_forms")
    .update({ ...data, updated_at: new Date().toISOString() })
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

  revalidatePath("/student/forms");
  revalidatePath("/volunteer/forms");

  return submission;
}
