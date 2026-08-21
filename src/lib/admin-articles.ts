import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Article = {
  id: string;
  slug: string;
  title_ar: string;
  excerpt: string | null;
  content_md: string;
  cover_image_url: string | null;
  author: string;
  category: string | null;
  is_published: boolean;
  published_at: string | null;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};

export type NewArticle = Omit<
  Article,
  "id" | "created_at" | "updated_at" | "view_count"
> & { view_count?: number };

// نستخدم alias مرن لتفادي مشاكل types.ts قبل التحديث
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tbl = () => (supabase as any).from("articles");

export const articlesQueryOptions = () =>
  queryOptions({
    queryKey: ["admin-articles"],
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await tbl()
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Article[];
    },
    staleTime: 30_000,
  });

export const publicArticlesQueryOptions = () =>
  queryOptions({
    queryKey: ["public-articles"],
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await tbl()
        .select(
          "id, slug, title_ar, excerpt, cover_image_url, author, category, published_at, view_count",
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Article[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const articleBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["public-article", slug],
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await tbl()
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        // fire-and-forget عدّاد المشاهدات
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).rpc("increment_article_views", { article_slug: slug }).then(() => {});
      }
      return (data as Article) ?? null;
    },
    staleTime: 60_000,
  });

export async function createArticle(input: Partial<NewArticle> & { title_ar: string; content_md: string }): Promise<Article> {
  const payload: Partial<Article> = { ...input };
  if (!payload.slug) payload.slug = generateSlug(input.title_ar);
  if (payload.is_published && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }
  const { data, error } = await tbl().insert(payload).select().single();
  if (error) throw error;
  return data as Article;
}

export async function updateArticle(id: string, patch: Partial<Article>): Promise<Article> {
  const { data, error } = await tbl().update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Article;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await tbl().delete().eq("id", id);
  if (error) throw error;
}

export async function togglePublish(id: string, is_published: boolean): Promise<Article> {
  return updateArticle(id, {
    is_published,
    published_at: is_published ? new Date().toISOString() : null,
  });
}

export function generateSlug(text: string): string {
  const firstWord = (text || "")
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]/g, "");
  const timestamp = Date.now().toString(36);
  return `${firstWord || "article"}-${timestamp}`;
}

export function computeArticlesStats(articles: Article[]) {
  const total = articles.length;
  const published = articles.filter((a) => a.is_published).length;
  const drafts = total - published;
  const totalViews = articles.reduce((s, a) => s + (a.view_count || 0), 0);
  return { total, published, drafts, totalViews };
}
