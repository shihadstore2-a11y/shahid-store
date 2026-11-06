import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STORE_ID } from "./store-config";

export type StoreReview = {
  id: string;
  store_id: string;
  author_name: string;
  customer_name: string;
  rating: number;
  comment_ar?: string;
  review_text?: string;
  comment?: string;
  product_label: string | null;
  product_name?: string | null;
  customer_city?: string | null;
  is_verified?: boolean;
  is_active: boolean;
  is_approved?: boolean;
  display_order?: number;
  created_at: string;
  updated_at?: string;
};

export type NewReview = {
  author_name?: string;
  customer_name?: string;
  rating: number;
  comment_ar?: string;
  review_text?: string;
  product_label?: string | null;
  product_name?: string | null;
  is_active?: boolean;
  is_approved?: boolean;
  customer_city?: string | null;
  display_order?: number;
};

export type UpdateReview = Partial<StoreReview>;

export const reviewsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin-reviews", STORE_ID],
    queryFn: async (): Promise<StoreReview[]> => {
      const { data, error } = await supabase
        .from("store_reviews")
        .select("*")
        .eq("store_id", STORE_ID)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        store_id: r.store_id,
        author_name: r.author_name || r.customer_name || "عميل موثق",
        customer_name: r.customer_name || r.author_name || "عميل موثق",
        rating: Number(r.rating || 5),
        comment_ar: r.comment_ar || r.review_text || "",
        review_text: r.review_text || r.comment_ar || "",
        comment: r.comment_ar || r.review_text || "",
        product_label: r.product_label || "",
        product_name: r.product_label || "",
        customer_city: r.customer_city || null,
        is_verified: true,
        is_active: Boolean(r.is_active),
        is_approved: Boolean(r.is_approved ?? r.is_active),
        display_order: r.display_order ?? 100,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

const buildPublicReviewsQuery = (limit: number) => async (): Promise<StoreReview[]> => {
  const { data, error } = await supabase
    .from("store_reviews")
    .select("*")
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    store_id: r.store_id,
    author_name: r.author_name || r.customer_name || "عميل موثق",
    customer_name: r.customer_name || r.author_name || "عميل موثق",
    rating: Number(r.rating || 5),
    comment_ar: r.comment_ar || r.review_text || "",
    review_text: r.review_text || r.comment_ar || "",
    comment: r.comment_ar || r.review_text || "",
    product_label: r.product_label || "",
    product_name: r.product_label || "",
    customer_city: r.customer_city || null,
    is_verified: true,
    is_active: Boolean(r.is_active),
    is_approved: Boolean(r.is_approved ?? r.is_active),
    display_order: r.display_order ?? 100,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
};

export const publicReviewsHomepageQueryOptions = () =>
  queryOptions({
    queryKey: ["public-reviews", "homepage", STORE_ID],
    queryFn: buildPublicReviewsQuery(8),
    staleTime: 5 * 60 * 1000,
  });

export const publicReviewsFullQueryOptions = () =>
  queryOptions({
    queryKey: ["public-reviews", "full", STORE_ID],
    queryFn: buildPublicReviewsQuery(100),
    staleTime: 5 * 60 * 1000,
  });

export const publicReviewsQueryOptions = publicReviewsHomepageQueryOptions;

export async function createReview(input: NewReview): Promise<StoreReview> {
  const authorName = input.author_name || input.customer_name || "عميل موثق";
  const commentText = input.comment_ar || input.review_text || "";
  const productLabel = input.product_label || input.product_name || null;

  const insertPayload = {
    store_id: STORE_ID,
    author_name: authorName,
    customer_name: authorName,
    customer_city: input.customer_city || null,
    rating: input.rating,
    comment_ar: commentText,
    review_text: commentText,
    product_label: productLabel,
    display_order: input.display_order ?? 100,
    is_active: input.is_active ?? true,
    is_approved: input.is_approved ?? input.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("store_reviews")
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReview(id: string, patch: Partial<StoreReview>): Promise<StoreReview> {
  const dbPatch: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.is_active !== undefined) {
    dbPatch.is_active = patch.is_active;
    dbPatch.is_approved = patch.is_active;
  }
  if (patch.rating !== undefined) dbPatch.rating = patch.rating;
  if (patch.comment_ar !== undefined) {
    dbPatch.comment_ar = patch.comment_ar;
    dbPatch.review_text = patch.comment_ar;
  }
  if (patch.review_text !== undefined) {
    dbPatch.review_text = patch.review_text;
    dbPatch.comment_ar = patch.review_text;
  }
  if (patch.author_name !== undefined) {
    dbPatch.author_name = patch.author_name;
    dbPatch.customer_name = patch.author_name;
  }
  if (patch.customer_name !== undefined) {
    dbPatch.author_name = patch.customer_name;
    dbPatch.customer_name = patch.customer_name;
  }
  if (patch.product_label !== undefined) dbPatch.product_label = patch.product_label;
  if (patch.customer_city !== undefined) dbPatch.customer_city = patch.customer_city;
  if (patch.display_order !== undefined) dbPatch.display_order = patch.display_order;

  const { data, error } = await supabase
    .from("store_reviews")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from("store_reviews").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleReviewActive(id: string, is_active: boolean): Promise<StoreReview> {
  return updateReview(id, { is_active });
}

export function computeReviewsStats(reviews: StoreReview[]) {
  const total = reviews.length;
  const active = reviews.filter((r) => r.is_active).length;
  const avgRating =
    total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  return { total, active, inactive: total - active, avgRating };
}

export type ReviewsSettings = {
  auto_publish: boolean; // نشر التقييمات تلقائياً أم تتطلب موافقة
};

export const REVIEWS_SETTINGS_KEY = "reviews_settings";

export const DEFAULT_REVIEWS_SETTINGS: ReviewsSettings = {
  auto_publish: false, // افتراضياً تتطلب موافقة الإدارة قبل الظهور
};

export async function fetchReviewsSettings(): Promise<ReviewsSettings> {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("store_id", STORE_ID)
      .eq("key", REVIEWS_SETTINGS_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_REVIEWS_SETTINGS;
    }

    const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return {
      auto_publish: typeof parsed?.auto_publish === "boolean" ? parsed.auto_publish : false,
    };
  } catch (e) {
    console.warn("[fetchReviewsSettings] Failed to fetch, returning default:", e);
    return DEFAULT_REVIEWS_SETTINGS;
  }
}

export const reviewsSettingsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin-reviews-settings", STORE_ID],
    queryFn: fetchReviewsSettings,
    staleTime: 30_000,
  });

export async function saveReviewsSettings(settings: ReviewsSettings): Promise<void> {
  const payload = JSON.stringify(settings);

  const { data: existing } = await supabase
    .from("store_settings")
    .select("id")
    .eq("store_id", STORE_ID)
    .eq("key", REVIEWS_SETTINGS_KEY)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("store_settings")
      .update({
        value: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw new Error(`فشل تحديث إعدادات التقييمات: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("store_settings")
      .upsert(
        [
          {
            key: REVIEWS_SETTINGS_KEY,
            value: payload,
            store_id: STORE_ID,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "store_id,key" }
      );

    if (error) throw new Error(`فشل حفظ إعدادات التقييمات: ${error.message}`);
  }
}
