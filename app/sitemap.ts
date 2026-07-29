import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gyansetu.example.com";

  const staticRoutes = [
    "",
    "/gallery",
    "/blog",
    "/faq",
    "/visits",
    "/testimonial",
    "/sponsor",
    "/careers",
    "/institution",
    "/alumni",
    "/newsletter",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  const db = createServerClient();
  const { data: posts } = await db
    .from("blog_posts")
    .select("slug, published_at")
    .eq("status", "published");

  const blogRoutes = (posts ?? []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : new Date(),
  }));

  return [...staticRoutes, ...blogRoutes];
}
