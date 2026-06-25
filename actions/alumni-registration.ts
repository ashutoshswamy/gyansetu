"use server";

import { createServerClient } from "@/lib/supabase/server";
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

  const parsed = alumniRegistrationSchema.parse(data);
  const db = createServerClient();

  const { error } = await db.from("alumni_registrations").insert({
    name: parsed.name,
    email: parsed.email,
    batch_year: parsed.batch_year || null,
    tour_destination: parsed.tour_destination || null,
    role_during_tour: parsed.role_during_tour || null,
    highlights: parsed.highlights || null,
    willing_to_mentor: parsed.willing_to_mentor ?? false,
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
