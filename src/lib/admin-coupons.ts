import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminCoupon = {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string | null;
  applies_to_duration_min: number;
  is_active: boolean;
  created_at: string;
};

export type CouponStatus = "all" | "active" | "expired" | "disabled";

export type CouponFilters = {
  search: string;
  status: CouponStatus;
};

function deriveStatus(c: AdminCoupon): "active" | "expired" | "disabled" {
  if (!c.is_active) return "disabled";
  if (c.valid_until && new Date(c.valid_until).getTime() < Date.now()) return "expired";
  return "active";
}

export async function fetchAdminCoupons(
  filters: CouponFilters,
): Promise<{ rows: AdminCoupon[] }> {
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, discount_percent, valid_until, applies_to_duration_min, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  let rows = (data ?? []) as AdminCoupon[];

  const term = filters.search.trim().toLowerCase();
  if (term) rows = rows.filter((r) => r.code.toLowerCase().includes(term));

  if (filters.status !== "all") {
    rows = rows.filter((r) => deriveStatus(r) === filters.status);
  }
  return { rows };
}

export type CouponInput = {
  code: string;
  discount_percent: number;
  valid_until: string | null;
  applies_to_duration_min: number;
};

export async function createCoupon(input: CouponInput) {
  const payload = {
    code: input.code.trim().toUpperCase(),
    discount_percent: input.discount_percent,
    valid_until: input.valid_until,
    applies_to_duration_min: input.applies_to_duration_min,
    is_active: true,
  };
  const { data, error } = await supabase
    .from("coupons")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AdminCoupon;
}

export type CouponUpdate = Partial<
  Pick<AdminCoupon, "code" | "discount_percent" | "valid_until" | "applies_to_duration_min" | "is_active">
>;

export async function updateCoupon(id: string, updates: CouponUpdate) {
  const payload: CouponUpdate = { ...updates };
  if (payload.code) payload.code = payload.code.trim().toUpperCase();
  const { data, error } = await supabase
    .from("coupons")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as AdminCoupon;
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

export const adminCouponsQueryOptions = (filters: CouponFilters) =>
  queryOptions({
    queryKey: ["admin", "coupons", filters],
    queryFn: () => fetchAdminCoupons(filters),
    staleTime: 30_000,
  });

export function getCouponStatus(c: AdminCoupon) {
  return deriveStatus(c);
}

export function computeCouponStats(rows: AdminCoupon[]) {
  let active = 0,
    expired = 0,
    disabled = 0;
  for (const r of rows) {
    const s = deriveStatus(r);
    if (s === "active") active++;
    else if (s === "expired") expired++;
    else disabled++;
  }
  return { total: rows.length, active, expired, disabled };
}
