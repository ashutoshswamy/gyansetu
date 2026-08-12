import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gyansetu.jnanaprabodhini.org";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/volunteer", "/enrollee", "/earc", "/core-member", "/dashboard", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
