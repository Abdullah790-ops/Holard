import type { MetadataRoute } from "next";
import { blogPosts, industries, services, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", "/services", "/industries", "/clients", "/candidates", "/testimonials", "/investors", "/employee-portal", "/contact", "/book-consultation", "/faq", "/blog", "/careers", "/privacy-policy", "/terms", "/replacement-policy", "/refund-policy",
    ...services.map((s) => `/services/${s.slug}`), ...industries.map((s) => `/industries/${s.slug}`), ...blogPosts.map((p) => `/blog/${p.slug}`)];
  return paths.map((p) => ({ url: `${site.url}${p}`, lastModified: new Date("2026-11-09") }));
}
