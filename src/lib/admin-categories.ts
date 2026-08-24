import { supabase } from "@/integrations/supabase/client";

export type AdminCategoryItem = {
  id: string;
  name_ar: string;
  slug: string;
  sort_order: number;
};

export type AdminCategoryInsert = {
  name_ar: string;
  slug: string;
  sort_order?: number;
};

export type AdminCategoryUpdate = {
  name_ar?: string;
  slug?: string;
  sort_order?: number;
};

/** جلب كافة التصنيفات */
export async function fetchAdminCategories(): Promise<AdminCategoryItem[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name_ar, slug, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminCategoryItem[];
}

/** إضافة تصنيف جديد */
export async function createAdminCategory(payload: AdminCategoryInsert): Promise<AdminCategoryItem> {
  const { data, error } = await supabase
    .from("categories")
    .insert([
      {
        name_ar: payload.name_ar.trim(),
        slug: payload.slug.trim().toLowerCase(),
        sort_order: payload.sort_order ?? 0,
      },
    ])
    .select("id, name_ar, slug, sort_order")
    .single();
  if (error) throw error;
  return data as AdminCategoryItem;
}

/** تعديل تصنيف موجود */
export async function updateAdminCategory(
  id: string,
  payload: AdminCategoryUpdate,
): Promise<AdminCategoryItem> {
  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select("id, name_ar, slug, sort_order")
    .single();
  if (error) throw error;
  return data as AdminCategoryItem;
}

/** حذف تصنيف */
export async function deleteAdminCategory(id: string): Promise<boolean> {
  // فصل المنتجات المرتبطة بهذا التصنيف أولاً قبل حذفه
  await supabase.from("products").update({ category_id: null }).eq("category_id", id);
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  return true;
}
