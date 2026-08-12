import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gyansetu.jnanaprabodhini.org";

  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/gallery", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/visits", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/testimonial", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/sponsor", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/institution", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/alumni", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/newsletter", priority: 0.5, changeFrequency: "monthly" as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const db = createServerClient();
  const { data: posts } = await db
    .from("blog_posts")
    .select("slug, published_at")
    .eq("status", "published");

  const blogRoutes = (posts ?? []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
