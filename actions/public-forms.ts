/*
create table testimonials (id uuid primary key default gen_random_uuid(), name text not null, batch_year text, role text, message text not null, is_approved boolean default false, created_at timestamptz default now());
create table sponsor_inquiries (id uuid primary key default gen_random_uuid(), organization_name text not null, contact_name text not null, email text not null, phone text, sponsorship_type text, message text, created_at timestamptz default now());
create table career_inquiries (id uuid primary key default gen_random_uuid(), name text not null, email text not null, phone text, qualification text, experience_years text, area_of_interest text, message text, created_at timestamptz default now());
create table institution_inquiries (id uuid primary key default gen_random_uuid(), institution_name text not null, contact_name text not null, email text not null, phone text, institution_type text, city text, student_count text, message text, created_at timestamptz default now());
*/
"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/clerk/action-auth";
import { testimonialSchema, sponsorInquirySchema, careerInquirySchema, institutionInquirySchema } from "@/lib/validations";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import { headers } from "next/headers";

const publicRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
});

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function submitTestimonial(data: unknown) {
  const ip = await getClientIp();
  const { success } = await publicRatelimit.limit(`testimonial:${ip}`);
  if (!success) throw new Error("Too many submissions. Please try again later.");

  const parsed = testimonialSchema.parse(data);
  const db = createServerClient();
  const { error } = await db.from("testimonials").insert({
    name: parsed.name,
    batch_year: parsed.batch_year || null,
    role: parsed.role || null,
    message: parsed.message,
  });
  if (error) {
    console.error("submitTestimonial error:", error);
    throw new Error("Failed to submit testimonial. Please try again.");
  }
}

export async function submitSponsorInquiry(data: unknown) {
  const ip = await getClientIp();
  const { success } = await publicRatelimit.limit(`sponsor:${ip}`);
  if (!success) throw new Error("Too many submissions. Please try again later.");

  const parsed = sponsorInquirySchema.parse(data);
  const db = createServerClient();
  const { error } = await db.from("sponsor_inquiries").insert({
    organization_name: parsed.organization_name,
    contact_name: parsed.contact_name,
    email: parsed.email,
    phone: parsed.phone || null,
    message: parsed.message || null,
  });
  if (error) {
    console.error("submitSponsorInquiry error:", error);
    throw new Error("Failed to submit inquiry. Please try again.");
  }
}

export async function submitCareerInquiry(data: unknown) {
  const ip = await getClientIp();
  const { success } = await publicRatelimit.limit(`career:${ip}`);
  if (!success) throw new Error("Too many submissions. Please try again later.");

  const parsed = careerInquirySchema.parse(data);
  const db = createServerClient();
  const { error } = await db.from("career_inquiries").insert({
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone || null,
    age: parsed.age,
    standard: parsed.standard || null,
    state: parsed.state || null,
    city: parsed.city || null,
    area_of_interest: parsed.area_of_interest || null,
    message: parsed.message || null,
  });
  if (error) {
    console.error("submitCareerInquiry error:", error);
    throw new Error("Failed to submit application. Please try again.");
  }
}

export async function submitInstitutionInquiry(data: unknown) {
  const ip = await getClientIp();
  const { success } = await publicRatelimit.limit(`institution:${ip}`);
  if (!success) throw new Error("Too many submissions. Please try again later.");

  const parsed = institutionInquirySchema.parse(data);
  const db = createServerClient();
  const { error } = await db.from("institution_inquiries").insert({
    institution_name: parsed.institution_name,
    contact_name: parsed.contact_name,
    email: parsed.email,
    phone: parsed.phone || null,
    institution_type: parsed.institution_type || null,
    city: parsed.city || null,
    student_count: parsed.student_count || null,
    message: parsed.message || null,
  });
  if (error) {
    console.error("submitInstitutionInquiry error:", error);
    throw new Error("Failed to submit application. Please try again.");
  }
}

export async function approveTestimonial(id: string) {
  const { db } = await requireAdminUser();
  const { error } = await db.from("testimonials").update({ status: "approved" }).eq("id", id);
  if (error) {
    console.error("approveTestimonial error:", error);
    throw new Error("Failed to approve testimonial.");
  }
}

export async function declineTestimonial(id: string) {
  const { db } = await requireAdminUser();
  const { error } = await db.from("testimonials").update({ status: "declined" }).eq("id", id);
  if (error) {
    console.error("declineTestimonial error:", error);
    throw new Error("Failed to decline testimonial.");
  }
}

export async function deleteTestimonial(id: string) {
  const { db } = await requireAdminUser();
  const { error } = await db.from("testimonials").delete().eq("id", id);
  if (error) {
    console.error("deleteTestimonial error:", error);
    throw new Error("Failed to delete testimonial.");
  }
}
