import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StoreReview = Database["public"]["Tables"]["store_reviews"]["Row"];
export type NewReview = Database["public"]["Tables"]["store_reviews"]["Insert"];
export type UpdateReview = Database["public"]["Tables"]["store_reviews"]["Update"];

export const reviewsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin-reviews"],
    queryFn: async (): Promise<StoreReview[]> => {
      const { data, error } = await supabase
        .from("store_reviews")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

const buildPublicReviewsQuery = (limit: number) => async (): Promise<StoreReview[]> => {
  const { data, error } = await supabase
    .from("store_reviews")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
};

export const publicReviewsHomepageQueryOptions = () =>
  queryOptions({
    queryKey: ["public-reviews", "homepage"],
    queryFn: buildPublicReviewsQuery(5),
    staleTime: 5 * 60 * 1000,
  });

export const publicReviewsFullQueryOptions = () =>
  queryOptions({
    queryKey: ["public-reviews", "full"],
    queryFn: buildPublicReviewsQuery(100),
    staleTime: 5 * 60 * 1000,
  });

/** @deprecated Use publicReviewsHomepageQueryOptions or publicReviewsFullQueryOptions */
export const publicReviewsQueryOptions = publicReviewsHomepageQueryOptions;

export async function createReview(input: NewReview): Promise<StoreReview> {
  const { data, error } = await supabase
    .from("store_reviews")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReview(id: string, patch: UpdateReview): Promise<StoreReview> {
  const { data, error } = await supabase
    .from("store_reviews")
    .update(patch)
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
