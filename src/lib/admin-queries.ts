import { supabase } from "@/integrations/supabase/client";
import { ADMIN_VISIBLE_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/lib/admin-orders";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export type DashboardKpis = {
  salesToday: number;
  salesYesterday: number;
  ordersToday: number;
  ordersYesterday: number;
  customersToday: number;
  customersYesterday: number;
  aovMonth: number;
  aovPrevMonth: number;
};

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // "مبيعة حقيقية" = is_test=false AND status IN ('paid','fulfilled')
  const realOrders = () =>
    supabase
      .from("orders")
      .select("total, customer_email, user_id")
      .eq("is_test", false)
      .in("status", ["paid", "fulfilled"]);

  const [todayOrders, yesterdayOrders, monthOrders, prevMonthOrders] =
    await Promise.all([
      realOrders().gte("created_at", today.toISOString()).lt("created_at", tomorrow.toISOString()),
      realOrders().gte("created_at", yesterday.toISOString()).lt("created_at", today.toISOString()),
      realOrders().gte("created_at", monthStart.toISOString()),
      realOrders().gte("created_at", prevMonthStart.toISOString()).lt("created_at", monthStart.toISOString()),
    ]);

  type OrderRow = { total: number; customer_email: string | null; user_id: string | null };
  const sum = (rows: OrderRow[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.total ?? 0), 0);
  const avg = (rows: OrderRow[] | null) => {
    const arr = rows ?? [];
    if (!arr.length) return 0;
    return sum(arr) / arr.length;
  };
  // عميل "حقيقي" = صاحب طلب مكتمل (distinct user_id أو customer_email)
  const distinctCustomers = (rows: OrderRow[] | null) => {
    const set = new Set<string>();
    for (const r of rows ?? []) {
      const key = r.user_id ?? (r.customer_email ? r.customer_email.toLowerCase().trim() : null);
      if (key) set.add(key);
    }
    return set.size;
  };

  return {
    salesToday: sum(todayOrders.data),
    salesYesterday: sum(yesterdayOrders.data),
    ordersToday: (todayOrders.data ?? []).length,
    ordersYesterday: (yesterdayOrders.data ?? []).length,
    customersToday: distinctCustomers(todayOrders.data),
    customersYesterday: distinctCustomers(yesterdayOrders.data),
    aovMonth: avg(monthOrders.data),
    aovPrevMonth: avg(prevMonthOrders.data),
  };
}

export type SalesPoint = { date: string; total: number };

export async function fetchSalesLast30Days(): Promise<SalesPoint[]> {
  const now = new Date();
  const start = startOfDay(new Date(now));
  start.setDate(start.getDate() - 29);

  const { data, error } = await supabase
    .from("orders")
    .select("total, created_at")
    .eq("is_test", false)
    .in("status", ["paid", "fulfilled"])
    .gte("created_at", start.toISOString());
  if (error) throw error;

  const map = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of data ?? []) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + Number(row.total ?? 0));
  }
  return Array.from(map.entries()).map(([date, total]) => ({ date, total }));
}

export type StatusSlice = { name: string; value: number };




export async function fetchOrderStatusBreakdown(): Promise<StatusSlice[]> {
  // طبقة العرض: حصراً paid/fulfilled/refunded (اتساق مع سياسة عرض الإدارة).
  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .in("status", ADMIN_VISIBLE_STATUSES);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  }
  return ORDER_STATUS_VALUES
    .filter((k) => counts.has(k))
    .map((k) => ({ name: ORDER_STATUS_LABELS[k] ?? k, value: counts.get(k) ?? 0 }));
}

export type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

export async function fetchRecentOrders(limit = 5): Promise<RecentOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, total, status, created_at")
    .in("status", ADMIN_VISIBLE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RecentOrder[];
}

export type TopProduct = {
  id: string;
  name_ar: string;
  slug: string;
  sales_count: number;
  base_price: number;
  icon_key: string | null;
  gradient_key: string | null;
};

export async function fetchTopProducts(limit = 5): Promise<TopProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name_ar, slug, sales_count, base_price, icon_key, gradient_key")
    .order("sales_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as TopProduct[];
}

export const STATUS_AR = ORDER_STATUS_LABELS;
