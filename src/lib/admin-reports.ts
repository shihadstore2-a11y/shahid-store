import { queryOptions } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_VISIBLE_STATUSES, ORDER_STATUS_LABELS } from "@/lib/admin-orders";
import { exportToCSV } from "./csv-export";

export type ReportRange = "today" | "7d" | "30d" | "90d" | "custom";

export type ReportFilters = {
  range: ReportRange;
  customFrom?: string; // ISO date (yyyy-MM-dd)
  customTo?: string;
};

export const DEFAULT_REPORT_FILTERS: ReportFilters = { range: "7d" };

export type ReportStats = {
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  completed_orders: number;
  revenue_trend: number | null;
  orders_trend: number | null;
};

export type DailyRevenuePoint = { date: string; revenue: number; orders: number };
export type TopProduct = {
  product_slug: string;
  name: string;
  quantity: number;
  revenue: number;
  share_percent: number;
};
export type StatusSlice = { status: string; label: string; count: number };

// تسمية الحالات موحّدة مع مصدر الحقيقة (admin-orders) — أصلحنا الخريطة المهجورة الخاطئة.
const STATUS_LABELS: Record<string, string> = ORDER_STATUS_LABELS;


export function resolveRange(filters: ReportFilters): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (filters.range === "custom") {
    const from = filters.customFrom
      ? startOfDay(new Date(filters.customFrom))
      : startOfDay(subDays(now, 6));
    const customTo = filters.customTo ? new Date(filters.customTo) : to;
    customTo.setHours(23, 59, 59, 999);
    return { from, to: customTo };
  }

  let from: Date;
  switch (filters.range) {
    case "today":
      from = startOfDay(now);
      break;
    case "7d":
      from = startOfDay(subDays(now, 6));
      break;
    case "30d":
      from = startOfDay(subDays(now, 29));
      break;
    case "90d":
      from = startOfDay(subDays(now, 89));
      break;
    default:
      from = startOfDay(subDays(now, 6));
  }
  return { from, to };
}

export function rangeLabel(filters: ReportFilters): string {
  switch (filters.range) {
    case "today":
      return "اليوم";
    case "7d":
      return "آخر 7 أيام";
    case "30d":
      return "آخر 30 يوم";
    case "90d":
      return "آخر 90 يوم";
    case "custom": {
      const { from, to } = resolveRange(filters);
      return `${format(from, "yyyy-MM-dd")} → ${format(to, "yyyy-MM-dd")}`;
    }
  }
}

type OrderLite = { total: number | string; status: string; created_at: string };

async function fetchOrdersInRange<T>(
  from: Date,
  to: Date,
  fields: string,
): Promise<T[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(fields)
    .eq("is_test", false)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .limit(10000);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as T[];
}

// ───────────── Stats ─────────────

export async function fetchReportStats(filters: ReportFilters): Promise<ReportStats> {
  const { from, to } = resolveRange(filters);
  const periodMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(from.getTime() - periodMs - 1);

  const [current, previous] = await Promise.all([
    fetchOrdersInRange<OrderLite>(from, to, "total, status, created_at"),
    fetchOrdersInRange<OrderLite>(prevFrom, prevTo, "total, status, created_at"),
  ]);

  const currentValid = current.filter((o) => o.status !== "cancelled");
  const previousValid = previous.filter((o) => o.status !== "cancelled");

  const total_revenue = currentValid.reduce((s, o) => s + Number(o.total), 0);
  const prev_revenue = previousValid.reduce((s, o) => s + Number(o.total), 0);

  return {
    total_revenue,
    order_count: currentValid.length,
    avg_order_value: currentValid.length ? total_revenue / currentValid.length : 0,
    completed_orders: currentValid.filter((o) => o.status === "paid" || o.status === "fulfilled").length,
    revenue_trend:
      prev_revenue > 0 ? ((total_revenue - prev_revenue) / prev_revenue) * 100 : null,
    orders_trend:
      previousValid.length > 0
        ? ((currentValid.length - previousValid.length) / previousValid.length) * 100
        : null,
  };
}

// ───────────── Daily Revenue ─────────────

export async function fetchDailyRevenue(
  filters: ReportFilters,
): Promise<DailyRevenuePoint[]> {
  const { from, to } = resolveRange(filters);
  const rows = await fetchOrdersInRange<OrderLite>(
    from,
    to,
    "total, status, created_at",
  );

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const o of rows) {
    if (o.status === "cancelled") continue;
    const day = format(new Date(o.created_at), "yyyy-MM-dd");
    const cur = byDay.get(day) ?? { revenue: 0, orders: 0 };
    cur.revenue += Number(o.total);
    cur.orders += 1;
    byDay.set(day, cur);
  }

  const points: DailyRevenuePoint[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const day = format(cursor, "yyyy-MM-dd");
    const v = byDay.get(day) ?? { revenue: 0, orders: 0 };
    points.push({ date: day, revenue: v.revenue, orders: v.orders });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

// ───────────── Top Products ─────────────

type OrderWithItems = { total: number | string; status: string; items: unknown };

export async function fetchTopProducts(
  filters: ReportFilters,
  limit = 5,
): Promise<TopProduct[]> {
  const { from, to } = resolveRange(filters);
  const rows = await fetchOrdersInRange<OrderWithItems>(
    from,
    to,
    "total, status, items",
  );

  const map = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of rows) {
    if (o.status === "cancelled") continue;
    const items = Array.isArray(o.items) ? (o.items as Record<string, unknown>[]) : [];
    for (const it of items) {
      const slug =
        (it.product_slug as string | undefined) ??
        (it.slug as string | undefined) ??
        (it.product_id as string | undefined) ??
        "unknown";
      const name =
        (it.name_ar as string | undefined) ??
        (it.name as string | undefined) ??
        slug;
      const quantity = Number(it.quantity ?? 1);
      const unit = Number(it.sale_price ?? it.price ?? 0);
      const cur = map.get(slug) ?? { name, quantity: 0, revenue: 0 };
      cur.quantity += quantity;
      cur.revenue += unit * quantity;
      map.set(slug, cur);
    }
  }

  const arr = Array.from(map.entries())
    .map(([slug, v]) => ({ product_slug: slug, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  const total = arr.reduce((s, p) => s + p.revenue, 0);
  return arr.map((p) => ({
    ...p,
    share_percent: total > 0 ? (p.revenue / total) * 100 : 0,
  }));
}

// ───────────── Status Distribution ─────────────

export async function fetchStatusDistribution(
  filters: ReportFilters,
): Promise<StatusSlice[]> {
  const { from, to } = resolveRange(filters);
  const rows = await fetchOrdersInRange<{ status: string }>(
    from,
    to,
    "status, created_at, total",
  );

  const visible = new Set<string>(ADMIN_VISIBLE_STATUSES);
  const counts = new Map<string, number>();
  for (const r of rows) {
    // طبقة العرض: حصراً paid/fulfilled/refunded (مطابق لسياسة عرض الإدارة).
    if (!visible.has(r.status)) continue;
    counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, label: STATUS_LABELS[status] ?? status, count }))
    .sort((a, b) => b.count - a.count);
}

// ───────────── Exports ─────────────

export async function exportOrdersCSV(filters: ReportFilters): Promise<void> {
  const { from, to } = resolveRange(filters);
  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_number, customer_name, customer_phone, customer_email, city, subtotal, discount, vat, total, coupon_code, payment_method, status, created_at",
    )
    .eq("is_test", false)
    .in("status", ADMIN_VISIBLE_STATUSES)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: false })
    .limit(10000);


  if (error) {
    toast.error(`فشل التصدير: ${error.message}`);
    return;
  }
  if (!data || data.length === 0) {
    toast.error("لا توجد طلبات في هذه الفترة");
    return;
  }

  const rows = data.map((o) => ({
    "رقم الطلب": o.order_number,
    "العميل": o.customer_name,
    "الجوال": o.customer_phone,
    "الإيميل": o.customer_email ?? "",
    "المدينة": o.city ?? "",
    "المجموع الفرعي": Number(o.subtotal).toFixed(2),
    "الخصم": Number(o.discount).toFixed(2),
    "الضريبة": Number(o.vat).toFixed(2),
    "الإجمالي": Number(o.total).toFixed(2),
    "الرمز الترويجي": o.coupon_code ?? "",
    "طريقة الدفع": o.payment_method,
    "الحالة": STATUS_LABELS[o.status] ?? o.status,
    "التاريخ": format(new Date(o.created_at), "yyyy-MM-dd HH:mm"),
  }));

  exportToCSV(rows, "orders");
}

export async function exportTopProductsCSV(filters: ReportFilters): Promise<void> {
  const products = await fetchTopProducts(filters, 100);
  if (products.length === 0) {
    toast.error("لا توجد مبيعات في هذه الفترة");
    return;
  }
  const rows = products.map((p, i) => ({
    "الترتيب": i + 1,
    "المنتج": p.name,
    "المعرف": p.product_slug,
    "الكمية": p.quantity,
    "الإيرادات": p.revenue.toFixed(2),
    "الحصة %": p.share_percent.toFixed(1),
  }));
  exportToCSV(rows, "top-products");
}

export async function exportDailyRevenueCSV(filters: ReportFilters): Promise<void> {
  const points = await fetchDailyRevenue(filters);
  if (points.length === 0) {
    toast.error("لا توجد بيانات في هذه الفترة");
    return;
  }
  const rows = points.map((p) => ({
    "التاريخ": p.date,
    "عدد الطلبات": p.orders,
    "الإيرادات": p.revenue.toFixed(2),
  }));
  exportToCSV(rows, "daily-revenue");
}

// ───────────── Query Options ─────────────

export const reportStatsQueryOptions = (filters: ReportFilters) =>
  queryOptions({
    queryKey: ["admin", "reports", "stats", filters],
    queryFn: () => fetchReportStats(filters),
    staleTime: 60_000,
  });

export const dailyRevenueQueryOptions = (filters: ReportFilters) =>
  queryOptions({
    queryKey: ["admin", "reports", "daily-revenue", filters],
    queryFn: () => fetchDailyRevenue(filters),
    staleTime: 60_000,
  });

export const topProductsQueryOptions = (filters: ReportFilters) =>
  queryOptions({
    queryKey: ["admin", "reports", "top-products", filters],
    queryFn: () => fetchTopProducts(filters),
    staleTime: 60_000,
  });

export const statusDistributionQueryOptions = (filters: ReportFilters) =>
  queryOptions({
    queryKey: ["admin", "reports", "status-distribution", filters],
    queryFn: () => fetchStatusDistribution(filters),
    staleTime: 60_000,
  });
