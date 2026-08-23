import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminCategory = {
  id: string;
  slug: string;
  name_ar: string;
  sort_order: number;
};

export type AdminProductRow = {
  id: string;
  slug: string;
  name_ar: string;
  base_price: number;
  sale_price: number | null;
  is_active: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  category_id: string | null;
  sort_order: number;
  sales_count: number;
  rating: number;
  duration_months: number | null;
  image_urls: string[];
  description: string | null;
  features: string[];
  stock_management_enabled: boolean;
  category?: AdminCategory | null;
};

export type ProductSort = "default" | "price_asc" | "price_desc" | "name";

export type ProductFilters = {
  search: string;
  categorySlug: string; // "all" or slug
  sortBy: ProductSort;
};

const SELECT_COLS =
  "id, slug, name_ar, base_price, sale_price, is_active, is_bestseller, is_featured, category_id, sort_order, sales_count, rating, duration_months, image_urls, description, features, stock_management_enabled";

function parseFeatures(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => (typeof v === "string" ? v : v == null ? "" : String(v)))
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function fetchAdminProducts(
  filters: ProductFilters,
): Promise<{ rows: AdminProductRow[]; categories: AdminCategory[] }> {
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from("products").select(SELECT_COLS),
    supabase
      .from("categories")
      .select("id, slug, name_ar, sort_order")
      .order("sort_order", { ascending: true }),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  const categories = (categoriesRes.data ?? []) as AdminCategory[];
  const catById = new Map(categories.map((c) => [c.id, c]));

  let rows: AdminProductRow[] = (productsRes.data ?? []).map((p: any) => ({
    ...p,
    base_price: Number(p.base_price ?? 0),
    sale_price: p.sale_price == null ? null : Number(p.sale_price),
    image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
    description: p.description ?? null,
    features: parseFeatures(p.features),
    stock_management_enabled: p.stock_management_enabled ?? true,
    category: p.category_id ? catById.get(p.category_id) ?? null : null,
  }));

  // filter by category slug
  if (filters.categorySlug !== "all") {
    rows = rows.filter((r) => r.category?.slug === filters.categorySlug);
  }

  // search by name / slug
  const term = filters.search.trim().toLowerCase();
  if (term) {
    rows = rows.filter(
      (r) =>
        r.name_ar.toLowerCase().includes(term) || r.slug.toLowerCase().includes(term),
    );
  }

  // sort
  switch (filters.sortBy) {
    case "price_asc":
      rows.sort((a, b) => (a.sale_price ?? a.base_price) - (b.sale_price ?? b.base_price));
      break;
    case "price_desc":
      rows.sort((a, b) => (b.sale_price ?? b.base_price) - (a.sale_price ?? a.base_price));
      break;
    case "name":
      rows.sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"));
      break;
    default:
      rows.sort((a, b) => {
        const c = (a.category?.sort_order ?? 99) - (b.category?.sort_order ?? 99);
        return c !== 0 ? c : a.sort_order - b.sort_order;
      });
  }

  return { rows, categories };
}

export type AdminProductUpdate = Partial<
  Pick<
    AdminProductRow,
    | "name_ar"
    | "base_price"
    | "sale_price"
    | "is_active"
    | "is_bestseller"
    | "image_urls"
    | "description"
    | "features"
    | "stock_management_enabled"
  >
>;

export async function updateAdminProduct(id: string, updates: AdminProductUpdate) {
  // NOTE: products table has no updated_at column — don't add it.
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data;
}

export type AdminProductInsert = {
  name_ar: string;
  slug: string;
  category_id: string | null;
  base_price: number;
  sale_price: number | null;
  description: string | null;
  features: string[];
  image_urls: string[];
  stock_management_enabled: boolean;
  is_active: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  sort_order: number;
};

export async function createAdminProduct(product: AdminProductInsert) {
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data;
}

export const adminProductsQueryOptions = (filters: ProductFilters) =>
  queryOptions({
    queryKey: ["admin", "products", filters],
    queryFn: () => fetchAdminProducts(filters),
    staleTime: 30_000,
  });

export function calcDiscountPercent(p: Pick<AdminProductRow, "base_price" | "sale_price">) {
  if (!p.sale_price || p.sale_price >= p.base_price || p.base_price <= 0) return 0;
  return Math.round(((p.base_price - p.sale_price) / p.base_price) * 100);
}
