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
import { z } from "zod";

const getAdminUser = requireAdminUser;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().regex(SLUG_RE, "Slug must be lowercase alphanumeric with hyphens only"),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1),
  cover_image_url: z.string().url().optional(),
  status: z.enum(["draft", "published"]),
});

type CreatePostData = z.infer<typeof createPostSchema>;

export async function createPost(input: CreatePostData) {
  const data = createPostSchema.parse(input);
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
