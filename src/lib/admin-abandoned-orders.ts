import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DateRange, OrderItemJson } from "@/lib/admin-orders";

export type AbandonedOrderStatus = "pending" | "initiated" | "payment_failed";

export const ABANDONED_STATUSES: AbandonedOrderStatus[] = [
  "pending",
  "initiated",
  "payment_failed",
];

export type AbandonedOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total: number;
  subtotal?: number;
  discount?: number;
  status: AbandonedOrderStatus | string;
  created_at: string;
  items: OrderItemJson[];
  whatsapp_messages_sent?: Array<{
    template: string;
    sent_at: string;
    sent_by?: string;
  }>;
};

export type AbandonedFilters = {
  search?: string;
  dateRange?: DateRange;
  sortBy?: "newest" | "oldest" | "highest" | "lowest";
  page?: number;
  pageSize?: number;
};

export type AbandonedOrdersPage = {
  rows: AbandonedOrderRow[];
  total: number;
  page: number;
  pageSize: number;
};

function rangeStart(range?: DateRange): string | null {
  if (!range || range === "all") return null;
  const now = new Date();
  if (range === "today") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.toISOString();
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 0;
  if (!days) return null;
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export async function fetchAbandonedOrders(
  filters: AbandonedFilters,
): Promise<AbandonedOrdersPage> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .in("status", ABANDONED_STATUSES);

  const since = rangeStart(filters.dateRange);
  if (since) q = q.gte("created_at", since);

  const term = (filters.search ?? "").trim();
  if (term) {
    const safe = term.replace(/[,()]/g, " ");
    q = q.or(
      `order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%,customer_email.ilike.%${safe}%`,
    );
  }

  const sortBy = filters.sortBy ?? "newest";
  if (sortBy === "newest") q = q.order("created_at", { ascending: false });
  else if (sortBy === "oldest") q = q.order("created_at", { ascending: true });
  else if (sortBy === "highest") q = q.order("total", { ascending: false });
  else if (sortBy === "lowest") q = q.order("total", { ascending: true });

  q = q.range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  const rows: AbandonedOrderRow[] = (data ?? []).map((r: any) => ({
    ...r,
    items: Array.isArray(r.items) ? (r.items as OrderItemJson[]) : [],
    whatsapp_messages_sent: Array.isArray(r.whatsapp_messages_sent)
      ? r.whatsapp_messages_sent
      : [],
  }));

  return { rows, total: count ?? 0, page, pageSize };
}

export type AbandonedStats = {
  totalCount: number;
  totalValue: number;
  todayCount: number;
  contactedCount: number;
};

export async function fetchAbandonedStats(): Promise<AbandonedStats> {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("id, total, created_at, whatsapp_messages_sent")
    .in("status", ABANDONED_STATUSES);

  if (error) throw error;

  const rows = data ?? [];
  const totalCount = rows.length;
  const totalValue = rows.reduce(
    (acc, r: any) => acc + (Number(r.total) || 0),
    0,
  );
  const todayCount = rows.filter((r: any) => r.created_at >= todayStart).length;
  const contactedCount = rows.filter(
    (r: any) =>
      Array.isArray(r.whatsapp_messages_sent) &&
      r.whatsapp_messages_sent.length > 0,
  ).length;

  return {
    totalCount,
    totalValue,
    todayCount,
    contactedCount,
  };
}

export async function deleteAbandonedOrder(orderId: string): Promise<void> {
  // حماية أمنية مضاعفة: لا يُحذف إلا إذا كان في الحالات غير المدفوعة
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .in("status", ABANDONED_STATUSES);

  if (error) throw error;
}

export async function deleteAbandonedOrdersBulk(
  orderIds: string[],
): Promise<number> {
  if (!orderIds.length) return 0;

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .in("id", orderIds)
    .in("status", ABANDONED_STATUSES)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

export async function cleanupAbandonedOrders(
  olderThanHours?: number,
): Promise<number> {
  let q = supabase
    .from("orders")
    .delete()
    .in("status", ABANDONED_STATUSES);

  if (olderThanHours && olderThanHours > 0) {
    const cutoff = new Date(
      Date.now() - olderThanHours * 60 * 60 * 1000,
    ).toISOString();
    q = q.lte("created_at", cutoff);
  }

  const { data, error } = await q.select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export function adminAbandonedOrdersListQueryOptions(
  filters: AbandonedFilters,
) {
  return queryOptions({
    queryKey: ["admin", "abandoned-orders", "list", filters],
    queryFn: () => fetchAbandonedOrders(filters),
    staleTime: 10_000,
  });
}

export function adminAbandonedStatsQueryOptions() {
  return queryOptions({
    queryKey: ["admin", "abandoned-orders", "stats"],
    queryFn: () => fetchAbandonedStats(),
    staleTime: 30_000,
  });
}
