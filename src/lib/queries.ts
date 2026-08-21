import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Coupon, Product } from "./types";

/**
 * Single roundtrip: fetch all home-page categories + their active products
 * grouped by category slug. Replaces 4 separate useQuery calls.
 */
export type HomeCategoriesData = Record<string, Product[]>;

export async function fetchHomeCategories(
  slugs: readonly string[],
): Promise<HomeCategoriesData> {
  const { data, error } = await supabase
    .from("categories")
    .select("slug, products(*)")
    .in("slug", slugs as string[]);
  if (error) throw error;

  const grouped: HomeCategoriesData = {};
  for (const slug of slugs) grouped[slug] = [];
  for (const row of (data ?? []) as { slug: string; products: Product[] | null }[]) {
    const items = (row.products ?? [])
      .filter((p) => (p as unknown as { is_active: boolean }).is_active)
      .sort(
        (a, b) =>
          ((a as unknown as { sort_order: number }).sort_order ?? 0) -
          ((b as unknown as { sort_order: number }).sort_order ?? 0),
      ) as unknown as Product[];
    grouped[row.slug] = items;
  }
  return grouped;
}

export const HOME_CATEGORY_SLUGS = [
  "falcon",
  "hulk",
  "smarters",
  "annual-offers",
] as const;

export const homeCategoriesQueryOptions = (
  slugs: readonly string[] = HOME_CATEGORY_SLUGS,
) =>
  queryOptions({
    queryKey: ["home-categories", slugs],
    queryFn: () => fetchHomeCategories(slugs),
    staleTime: 5 * 60 * 1000,
  });

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchBestsellers(limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_bestseller", true)
    .order("sales_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchProductsByCategory(slug: string): Promise<{
  category: Category | null;
  products: Product[];
}> {
  const { data: cat, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (catErr) throw catErr;
  if (!cat) return { category: null, products: [] };

  const { data: prods, error: prodErr } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", cat.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (prodErr) throw prodErr;

  return { category: cat as Category, products: (prods ?? []) as unknown as Product[] };
}

export async function fetchProductsByCategorySlug(
  slug: string,
): Promise<Product[]> {
  const { data: cat, error: catErr } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (catErr) throw catErr;
  if (!cat) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", cat.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<{
  product: Product | null;
  category: Category | null;
}> {
  const { data: prod, error: prodErr } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (prodErr) throw prodErr;
  if (!prod) return { product: null, category: null };

  const { data: cat, error: catErr } = prod.category_id
    ? await supabase.from("categories").select("*").eq("id", prod.category_id).maybeSingle()
    : { data: null, error: null };
  if (catErr) throw catErr;

  return {
    product: prod as unknown as Product,
    category: (cat as Category) ?? null,
  };
}

export async function fetchRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 3,
): Promise<Product[]> {
  if (!categoryId) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", excludeId)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchActiveCoupon(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as Coupon) ?? null;
}
