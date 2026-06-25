"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { dynamicFormSchema, type DynamicFormInput } from "@/lib/validations";
import { redis } from "@/lib/redis/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";

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
    .select("status, fields")
    .eq("id", form_id)
    .maybeSingle();

  if (!form || form.status !== "active") throw new Error("Form not available");

  // Strip file fields — files must be uploaded to storage separately, not stored as raw values
  const fields: Array<{ id: string; type: string }> = form.fields ?? [];
  const fileFieldIds = new Set(
    fields.filter((f) => f.type === "file" || f.type === "image").map((f) => f.id)
  );
  const sanitizedData = Object.fromEntries(
    Object.entries(data).filter(([key]) => !fileFieldIds.has(key))
  );

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
