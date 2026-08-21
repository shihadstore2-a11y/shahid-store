import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StoreSettings = {
  storeName: string;
  whatsappNumber: string;
  officialEmail: string;
  telegramChannel: string;
};

const DEFAULT_STORE: StoreSettings = {
  storeName: "شاهد ستور",
  whatsappNumber: "966500451602",
  officialEmail: "",
  telegramChannel: "",
};

const KEY_MAP: Record<keyof StoreSettings, string> = {
  storeName: "store_name",
  whatsappNumber: "whatsapp_number",
  officialEmail: "contact_email",
  telegramChannel: "telegram_channel",
};

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("key, value");
  if (error) throw error;
  const map: Record<string, string | null> = {};
  (data ?? []).forEach((r) => {
    map[r.key] = r.value;
  });
  return {
    storeName: map.store_name || DEFAULT_STORE.storeName,
    whatsappNumber: map.whatsapp_number || DEFAULT_STORE.whatsappNumber,
    officialEmail: map.contact_email || "",
    telegramChannel: map.telegram_channel || "",
  };
}

export const storeSettingsAdminQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "store-settings"],
    queryFn: fetchStoreSettings,
    staleTime: 30_000,
  });

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const rows = (Object.keys(KEY_MAP) as Array<keyof StoreSettings>).map((k) => ({
    key: KEY_MAP[k],
    value: settings[k] || null,
  }));
  const { error } = await supabase
    .from("store_settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function signOutEverywhere(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) throw new Error(error.message);
}

export async function fetchSystemCounts() {
  const [products, orders, customers] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    customers: customers.count ?? 0,
  };
}

export const systemCountsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "settings", "system-counts"],
    queryFn: fetchSystemCounts,
    staleTime: 60_000,
  });
