import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type InventoryProvider = "falcon" | "hulk" | "smarters";
export type InventoryStatus = "available" | "reserved" | "claimed" | "expired";

export type InventoryItem = {
  id: string;
  provider: InventoryProvider;
  username: string;
  password: string;
  url: string | null;
  extra_info: Json | null;
  duration_months: number;
  device_limit: number;
  expires_at: string | null;
  status: InventoryStatus;
  claimed_order_id: string | null;
  claimed_at: string | null;
  claimed_role: string | null;
  cogs: number | null;
  cogs_currency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryFilters = {
  search: string;
  provider: "all" | InventoryProvider;
  status: "all" | InventoryStatus;
  duration: "all" | 1 | 3 | 6 | 12;
};

export const DEFAULT_INVENTORY_FILTERS: InventoryFilters = {
  search: "",
  provider: "all",
  status: "all",
  duration: "all",
};

const SELECT_COLS =
  "id, provider, username, password, url, extra_info, duration_months, device_limit, expires_at, status, claimed_order_id, claimed_at, claimed_role, cogs, cogs_currency, notes, created_at, updated_at";

export async function fetchAdminInventory(
  filters: InventoryFilters,
): Promise<{ rows: InventoryItem[] }> {
  const { data, error } = await supabase
    .from("subscription_inventory")
    .select(SELECT_COLS)
    .order("created_at", { ascending: false });
  if (error) throw error;

  let rows = ((data ?? []) as unknown) as InventoryItem[];

  const term = filters.search.trim().toLowerCase();
  if (term) rows = rows.filter((r) => r.username.toLowerCase().includes(term));
  if (filters.provider !== "all") rows = rows.filter((r) => r.provider === filters.provider);
  if (filters.status !== "all") rows = rows.filter((r) => r.status === filters.status);
  if (filters.duration !== "all")
    rows = rows.filter((r) => r.duration_months === filters.duration);

  return { rows };
}

export type InventoryInput = {
  provider: InventoryProvider;
  username: string;
  password: string;
  url: string | null;
  extra_info: Json | null;
  duration_months: number;
  device_limit: number;
  expires_at: string | null;
  cogs: number | null;
  notes: string | null;
};

export async function createInventoryItem(input: InventoryInput) {
  const payload = {
    ...input,
    username: input.username.trim(),
    cogs_currency: input.cogs != null ? "SAR" : null,
    status: "available" as const,
  };
  const { data, error } = await supabase
    .from("subscription_inventory")
    .insert(payload)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return (data as unknown) as InventoryItem;
}

export type InventoryUpdate = Partial<
  Pick<
    InventoryItem,
    | "username"
    | "password"
    | "url"
    | "extra_info"
    | "duration_months"
    | "device_limit"
    | "expires_at"
    | "cogs"
    | "notes"
    | "status"
  >
>;

export async function updateInventoryItem(id: string, updates: InventoryUpdate) {
  const payload: InventoryUpdate = { ...updates };
  if (payload.username) payload.username = payload.username.trim();
  const { data, error } = await supabase
    .from("subscription_inventory")
    .update(payload)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return (data as unknown) as InventoryItem;
}

export async function deleteInventoryItem(id: string, currentStatus: InventoryStatus) {
  if (currentStatus === "claimed") {
    throw new Error("لا يمكن حذف اشتراك مسلَّم لطلب فعلي.");
  }
  const { error } = await supabase
    .from("subscription_inventory")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export const adminInventoryQueryOptions = (filters: InventoryFilters) =>
  queryOptions({
    queryKey: ["admin", "inventory", filters],
    queryFn: () => fetchAdminInventory(filters),
    staleTime: 30_000,
  });

export type InventoryStats = {
  total: number;
  available_falcon: number;
  available_hulk: number;
  available_smarters: number;
  low_stock_alert: boolean;
};

export function computeInventoryStats(rows: InventoryItem[]): InventoryStats {
  let af = 0,
    ah = 0,
    as = 0;
  for (const r of rows) {
    if (r.status !== "available") continue;
    if (r.provider === "falcon") af++;
    else if (r.provider === "hulk") ah++;
    else if (r.provider === "smarters") as++;
  }
  return {
    total: rows.length,
    available_falcon: af,
    available_hulk: ah,
    available_smarters: as,
    low_stock_alert: af < 5 || ah < 5 || as < 5,
  };
}

export type ExpiryTone = "none" | "green" | "yellow" | "red";

export function getExpiryTone(expires_at: string | null): {
  tone: ExpiryTone;
  daysLeft: number | null;
  label: string;
} {
  if (!expires_at) return { tone: "none", daysLeft: null, label: "بدون انتهاء" };
  const ms = new Date(expires_at).getTime() - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return { tone: "red", daysLeft: days, label: "منتهي" };
  if (days < 7) return { tone: "red", daysLeft: days, label: `${days} يوم` };
  if (days <= 30) return { tone: "yellow", daysLeft: days, label: `${days} يوم` };
  return { tone: "green", daysLeft: days, label: `${days} يوم` };
}

export const PROVIDER_LABEL: Record<InventoryProvider, string> = {
  falcon: "فالكون",
  hulk: "هولك",
  smarters: "سمارترز",
};

export const STATUS_LABEL: Record<InventoryStatus, string> = {
  available: "متاح",
  reserved: "محجوز",
  claimed: "مسلَّم",
  expired: "منتهي",
};

export function deviceLimitLabel(n: number): string {
  return n >= 2 ? "جهازان" : "جهاز واحد";
}

// ============= Bulk Paste support =============

export type BulkInventoryItem = {
  provider: InventoryProvider;
  username: string;
  password: string;
  url: string | null;
  duration_months: number;
  device_limit: number;
  expires_at: string | null;
  cogs: number | null;
  cogs_currency: string;
  notes: string | null;
};

export type BulkInsertResult = {
  inserted: number;
  failed: number;
  errors: Array<{ username: string; error: string }>;
};

export async function checkInventoryDuplicates(
  provider: InventoryProvider,
  usernames: string[],
): Promise<string[]> {
  if (usernames.length === 0) return [];
  const { data, error } = await supabase.rpc("check_inventory_duplicates", {
    _provider: provider,
    _usernames: usernames,
  });
  if (error) throw error;
  return (data ?? []) as string[];
}

export async function bulkInsertInventory(
  items: BulkInventoryItem[],
): Promise<BulkInsertResult> {
  const { data, error } = await supabase.rpc("bulk_insert_inventory", {
    _items: items as unknown as Json,
  });
  if (error) throw error;
  return (data as unknown) as BulkInsertResult;
}
