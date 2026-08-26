import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * ⚠️ TAXONOMY (موثّق 30 May 2026 — جذر خطأ تطابق سابق):
 *  - حالة الطلب الفاشل في جدول `orders` هي دائماً "payment_failed" (يكتبها
 *    edfapay-webhook.ts عند فشل الدفع). جدول الطلبات لا يستخدم "failed" إطلاقاً.
 *  - القيمة "failed" خاصة بجدول `payment_transactions.status` فقط.
 *  - تُبقى "failed" هنا كـ alias دفاعي لأي بيانات قديمة لا أكثر — لا تُحذف،
 *    ولا تُعتمد كحالة طلب في أي استعلام جماعي (استخدم "payment_failed").
 *  - قاعدة إلزامية قبل أي حذف/تعديل جماعي معتمد على الحالة:
 *    نفّذ SELECT DISTINCT status أولاً واعمل على القيم الفعلية لا المفترضة.
 */
export type OrderStatus =
  | "pending"
  | "initiated"
  | "paid"
  | "payment_failed"
  | "cancelled"
  | "failed" // alias دفاعي لمعاملات الدفع/البيانات القديمة — ليس حالة طلب فعلية
  | "refunded"
  | "fulfilled";

export const ORDER_STATUS_VALUES: OrderStatus[] = [
  "pending",
  "initiated",
  "paid",
  "payment_failed",
  "cancelled",
  "failed",
  "refunded",
  "fulfilled",
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  initiated: "بدء الدفع",
  paid: "مدفوع ✅",
  payment_failed: "فشل الدفع",
  cancelled: "ملغى",
  failed: "فاشل",
  refunded: "مستردّ",
  fulfilled: "مُسلَّم 🎁",
};

/**
 * 🎯 سياسة عرض حالات الطلبات في لوحة التحكم (Admin Display Policy — 30 May 2026).
 *  - ADMIN_VISIBLE_STATUSES: الحالات الوحيدة التي تظهر في قوائم/جداول/مخططات الإدارة.
 *    (paid/fulfilled للتشغيل + refunded للسجلّ المحاسبي).
 *  - ADMIN_SELECTABLE_STATUSES: الحالات المسموح للأدمن تعيينها يدوياً (تغيير الحالة).
 *  - طبقة عرض فقط: لا تمسّ DB/webhook/RLS. الحالات الداخلية (pending/initiated/
 *    payment_failed) لا تزال تُكتب كما هي بواسطة الدفع والتسليم — مخفية فقط من الواجهة.
 *  - الإبقاء الدفاعي على OrderStatus + LABELS + STYLES لعرض أي بيانات قديمة بأمان.
 */
export const ADMIN_VISIBLE_STATUSES: OrderStatus[] = [
  "paid",
  "fulfilled",
  "payment_failed",
  "refunded",
  "cancelled",
];
export const ADMIN_SELECTABLE_STATUSES: OrderStatus[] = ["paid", "fulfilled", "refunded", "cancelled"];

export type OrderItemJson = {
  // الحقول الفعلية التي يكتبها checkout الحالي
  product_id?: string;
  product_slug?: string;
  product_name?: string;
  duration_months?: number;
  qty?: number;
  unit_price?: number;

  // Fallback fields لأي بيانات قديمة بصيغة مختلفة
  name?: string;
  name_ar?: string;
  duration_label?: string;
  quantity?: number;
  price?: number;
  sale_price?: number;
  image_url?: string;
};

export type AdminOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string | null;
  notes: string | null;
  items: OrderItemJson[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  whatsapp_messages_sent?: Array<{
    template: string;
    sent_at: string;
    sent_by?: string;
  }>;
  // Phase 4 — Manual Fulfillment
  subscription_username?: string | null;
  subscription_password?: string | null;
  subscription_url?: string | null;
  subscription_extra_info?: Record<string, unknown> | null;
  fulfilled_at?: string | null;
  fulfilled_by?: string | null;
  credentials_sent_at?: string | null;
};

export type DateRange = "today" | "7d" | "30d" | "all";
export type SortBy = "newest" | "oldest" | "highest";

export type OrderFilters = {
  search?: string;
  status?: OrderStatus | "all";
  dateRange?: DateRange;
  sortBy?: SortBy;
  page?: number;
  pageSize?: number;
};

const PAGE_SIZE_DEFAULT = 20;

function rangeStart(range: DateRange | undefined): string | null {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  switch (range) {
    case "today":
      return start.toISOString();
    case "7d":
      start.setDate(start.getDate() - 6);
      return start.toISOString();
    case "30d":
      start.setDate(start.getDate() - 29);
      return start.toISOString();
    default:
      return null;
  }
}

export type OrdersPage = {
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function fetchAdminOrders(filters: OrderFilters): Promise<OrdersPage> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase.from("orders").select("*", { count: "exact" });

  // تصفية الحالة: إن تم تحديد حالة معينة نفلتر بها، وإلا نعرض كافة الطلبات
  if (filters.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  const since = rangeStart(filters.dateRange);
  if (since) q = q.gte("created_at", since);

  const term = (filters.search ?? "").trim();
  if (term) {
    const safe = term.replace(/[,()]/g, " ");
    q = q.or(
      `order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`,
    );
  }

  const sortBy = filters.sortBy ?? "newest";
  if (sortBy === "newest") q = q.order("created_at", { ascending: false });
  else if (sortBy === "oldest") q = q.order("created_at", { ascending: true });
  else q = q.order("total", { ascending: false });

  q = q.range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  const rows: AdminOrderRow[] = (data ?? []).map((r: any) => ({
    ...r,
    items: Array.isArray(r.items) ? (r.items as OrderItemJson[]) : [],
  }));

  return { rows, total: count ?? 0, page, pageSize };
}

export async function fetchAdminOrderDetail(orderId: string): Promise<AdminOrderRow> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return {
    ...data,
    items: Array.isArray(data.items) ? (data.items as OrderItemJson[]) : [],
    whatsapp_messages_sent: Array.isArray(data.whatsapp_messages_sent)
      ? (data.whatsapp_messages_sent as AdminOrderRow["whatsapp_messages_sent"])
      : [],
  } as AdminOrderRow;
}

export type AdminOrdersStats = {
  totalOrdersMonth: number;
  totalRevenueMonth: number;
  fulfilledCount: number;
  paidUnfulfilledCount: number;
  aovMonth: number;
};

export async function fetchAdminOrdersStats(): Promise<AdminOrdersStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [monthRes, fulfilledRes, paidUnfulfilledRes] = await Promise.all([
    // الإيراد/الطلبات الشهرية: حصراً على paid/fulfilled (اتساق مع Dashboard Accuracy).
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", monthStart)
      .in("status", ["paid", "fulfilled"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "fulfilled"),
    // paid بانتظار التسليم: fulfilled_at IS NULL (المعيار الموثوق للتسليم).
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .is("fulfilled_at", null),
  ]);

  if (monthRes.error) throw monthRes.error;
  if (fulfilledRes.error) throw fulfilledRes.error;
  if (paidUnfulfilledRes.error) throw paidUnfulfilledRes.error;

  const rows = monthRes.data ?? [];
  const totalRevenue = rows.reduce((acc, r: any) => acc + Number(r.total ?? 0), 0);
  const totalOrders = rows.length;
  const aov = totalOrders ? totalRevenue / totalOrders : 0;

  return {
    totalOrdersMonth: totalOrders,
    totalRevenueMonth: totalRevenue,
    fulfilledCount: fulfilledRes.count ?? 0,
    paidUnfulfilledCount: paidUnfulfilledRes.count ?? 0,
    aovMonth: aov,
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const adminOrdersListQueryOptions = (filters: OrderFilters) =>
  queryOptions({
    queryKey: ["admin", "orders", "list", filters],
    queryFn: () => fetchAdminOrders(filters),
    staleTime: 30_000,
  });

export const adminOrderDetailQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ["admin", "orders", "detail", orderId],
    queryFn: () => fetchAdminOrderDetail(orderId),
    enabled: !!orderId,
  });

export const adminOrdersStatsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "orders", "stats"],
    queryFn: fetchAdminOrdersStats,
    staleTime: 60_000,
  });

export function formatRelativeArabic(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  if (d < 30) return `قبل ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

export function formatDateTimeArabic(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PAYMENT_LABELS: Record<string, string> = {
  whatsapp: "واتساب",
  bank_transfer: "تحويل بنكي",
  stc_pay: "STC Pay",
  cash: "نقدي",
};
