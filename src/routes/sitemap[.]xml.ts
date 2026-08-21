import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://shahidstore.net";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "weekly", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/reviews", changefreq: "monthly", priority: "0.7" },
  { path: "/activation-guide", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/track-order", changefreq: "monthly", priority: "0.5" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/login", changefreq: "yearly", priority: "0.3" },
  { path: "/register", changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        // Categories — independent try/catch
        try {
          const { data } = await supabase
            .from("categories")
            .select("slug");
          for (const c of data ?? []) {
            if (c?.slug) {
              entries.push({
                path: `/category/${c.slug}`,
                changefreq: "weekly",
                priority: "0.8",
              });
            }
          }
        } catch (err) {
          console.error("[sitemap] categories failed:", err);
        }

        // Products — independent try/catch
        try {
          const { data } = await supabase
            .from("products")
            .select("slug")
            .eq("is_active", true);
          for (const p of data ?? []) {
            if (p?.slug) {
              entries.push({
                path: `/product/${p.slug}`,
                changefreq: "weekly",
                priority: "0.7",
              });
            }
          }
        } catch (err) {
          console.error("[sitemap] products failed:", err);
        }

        // Articles — independent try/catch
        try {
          const { data } = await supabase
            .from("articles")
            .select("slug, updated_at")
            .eq("is_published", true);
          for (const a of data ?? []) {
            if (a?.slug) {
              entries.push({
                path: `/blog/${a.slug}`,
                lastmod: a.updated_at
                  ? new Date(a.updated_at).toISOString().split("T")[0]
                  : undefined,
                changefreq: "monthly",
                priority: "0.6",
              });
            }
          }
        } catch (err) {
          console.error("[sitemap] articles failed:", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${xmlEscape(`${BASE_URL}${e.path}`)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
