"use server";

/*
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  cover_image_url text,
  status text default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_by text,
  created_at timestamptz default now()
);
*/

import { requireAdminUser } from "@/lib/clerk/action-auth";
import { revalidatePath } from "next/cache";

interface CreatePostData {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  status: "draft" | "published";
}

const getAdminUser = requireAdminUser;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function createPost(data: CreatePostData) {
  if (!SLUG_RE.test(data.slug)) throw new Error("Slug must be lowercase alphanumeric with hyphens only");
  const { db, user } = await getAdminUser();

  const insertData: Record<string, unknown> = {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || null,
    content: data.content,
    cover_image_url: data.cover_image_url || null,
    status: data.status,
    created_by: user.id,
  };

  if (data.status === "published") {
    insertData.published_at = new Date().toISOString();
  }

  const { data: post, error } = await db
    .from("blog_posts")
    .insert(insertData)
    .select()
    .single();

  if (error) { console.error("[blog]", error); throw new Error("Operation failed"); }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");

  return post;
}

export async function publishPost(id: string) {
  const { db } = await getAdminUser();

  const { error } = await db
    .from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) { console.error("[blog]", error); throw new Error("Operation failed"); }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function deletePost(id: string) {
  const { db } = await getAdminUser();

  const { error } = await db.from("blog_posts").delete().eq("id", id);
  if (error) { console.error("[blog]", error); throw new Error("Operation failed"); }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
