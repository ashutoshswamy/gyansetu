"use server";

import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/clerk/action-auth";
import { alumniRegistrationSchema } from "@/lib/validations";
import { resend, FROM_EMAIL } from "@/lib/resend/client";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import { headers } from "next/headers";

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
});

export async function submitAlumniRegistration(data: unknown) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await ratelimit.limit(`alumni:${ip}`);
  if (!success) throw new Error("Too many submissions. Please try again later.");

  let parsed;
  try {
    parsed = alumniRegistrationSchema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(err.issues[0]?.message ?? "Please check your form entries and try again.");
    }
    throw err;
  }
  const db = createServerClient();
  const firstVisit = parsed.visit_history?.[0];

  const { error } = await db.from("alumni_registrations").insert({
    name: parsed.name,
    email: parsed.email,
    batch_year: parsed.batch_year || firstVisit?.year || null,
    tour_destination: parsed.tour_destination || firstVisit?.location || null,
    role_during_tour: parsed.role_during_tour || firstVisit?.role || null,
    highlights: parsed.highlights || null,
    willing_to_mentor: parsed.willing_to_mentor ?? false,
    first_name: parsed.first_name || null,
    middle_name: parsed.middle_name || null,
    last_name: parsed.last_name || null,
    gender: parsed.gender || null,
    date_of_birth: parsed.date_of_birth || null,
    blood_group: parsed.blood_group || null,
    visit_history: parsed.visit_history ?? [],
    company_name: parsed.company_name || null,
    work_location: parsed.work_location || null,
    designation: parsed.designation || null,
    work_department: parsed.work_department || null,
    years_experience: parsed.years_experience ?? null,
    institution: parsed.institution || null,
    edu_location: parsed.edu_location || null,
    qualification: parsed.qualification || null,
    course_name: parsed.course_name || null,
    stream: parsed.stream || null,
    course_status: parsed.course_status || null,
    year_semester: parsed.year_semester || null,
    mobile_number: parsed.mobile_number || null,
    alternate_mobile_number: parsed.alternate_mobile_number || null,
    linkedin_url: parsed.linkedin_url || null,
    preferred_communication: parsed.preferred_communication ?? [],
    interested_volunteering: parsed.interested_volunteering || null,
    available_network_activities: parsed.available_network_activities || null,
    preferred_contribution: parsed.preferred_contribution ?? [],
    areas_of_interest: parsed.areas_of_interest ?? [],
    availability: parsed.availability || null,
    willing_to_mentor_new: parsed.willing_to_mentor_new || null,
    why_stay_connected: parsed.why_stay_connected || null,
    skills_contribute: parsed.skills_contribute || null,
    suggestions: parsed.suggestions || null,
    additional_remarks: parsed.additional_remarks || null,
  });
  if (error) {
    console.error("submitAlumniRegistration error:", error);
    throw new Error("Failed to submit registration. Please try again.");
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: parsed.email,
    subject: `Welcome back, ${parsed.name}! Your Gyan Setu alumni registration is confirmed`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #e4dfd1;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="font-size:11px;font-weight:600;color:#9B9188;letter-spacing:0.12em;text-transform:uppercase">Gyan Setu Alumni</span>
          <h1 style="font-size:22px;font-weight:700;color:#19140F;margin:8px 0 4px">Welcome back, ${parsed.name}!</h1>
          <p style="font-size:14px;color:#5A5247;margin:0">Your alumni registration has been received. We're glad to have you back in the Gyan Setu family.</p>
        </div>
        <div style="background:#FAFAF7;border:1px solid #E4DFD1;border-radius:8px;padding:20px 18px;margin-bottom:24px">
          <h2 style="font-size:13px;font-weight:600;color:#5A5247;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.08em">Your Details</h2>
          ${parsed.batch_year ? `<p style="font-size:13px;color:#19140F;margin:0 0 8px"><strong>Batch Year:</strong> ${parsed.batch_year}</p>` : ""}
          ${parsed.tour_destination ? `<p style="font-size:13px;color:#19140F;margin:0 0 8px"><strong>Tour Destination:</strong> ${parsed.tour_destination}</p>` : ""}
          ${parsed.role_during_tour ? `<p style="font-size:13px;color:#19140F;margin:0 0 8px"><strong>Role:</strong> ${parsed.role_during_tour}</p>` : ""}
          ${parsed.willing_to_mentor ? `<p style="font-size:13px;color:#2A5E3A;margin:0"><strong>✓ Open to mentoring</strong> future volunteers</p>` : ""}
        </div>
        <p style="font-size:13px;color:#5A5247;line-height:1.6;margin:0 0 20px">Our team will be in touch soon with information about alumni events, mentoring opportunities, and upcoming Jnana Pravas tours.</p>
        <p style="font-size:12px;color:#9B9188;margin:0">— The Gyan Setu Team</p>
      </div>
    `,
  }).catch((err) => {
    console.error("Alumni registration email failed:", err);
  });
}

export async function getAllAlumniRegistrations() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("alumni_registrations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllAlumniRegistrations]", error); throw new Error("Failed to fetch alumni registrations"); }
  return data ?? [];
}
