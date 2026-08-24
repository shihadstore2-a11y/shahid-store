import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import { CredentialsCard } from "@/components/orders/CredentialsCard";
import { OrderStatusBanner } from "@/components/orders/OrderStatusBanner";
import { getMyOrderView } from "@/lib/customer-order.functions";
import { formatSAR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/order/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الطلب — حسابي | شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderDetailPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="mb-3 text-3xl">🔍</p>
        <h2 className="text-lg font-black">الطلب غير موجود</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          لم نعثر على هذا الطلب في حسابك. تأكّد من الرابط، أو راجع طلباتك.
        </p>
        <Link
          to="/account/orders"
          className="mt-4 inline-block rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
        >
          العودة لطلباتي
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="mb-3 text-3xl">⚠️</p>
        <h2 className="text-lg font-black">حدث خطأ</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          تعذّر تحميل تفاصيل الطلب. حاول مرّة أخرى.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={reset}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
          >
            إعادة المحاولة
          </button>
          <Link
            to="/account/orders"
            className="rounded-xl border border-border px-5 py-2 text-sm font-bold"
          >
            العودة لطلباتي
          </Link>
        </div>
      </div>
    </div>
  ),
});

// لا نُعيد المحاولة على notFound / unauthorized.
function shouldRetry(failureCount: number, error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : "";
  if (msg.includes("not found") || msg.includes("notfound") || msg.includes("unauthorized")) {
    return false;
  }
  return failureCount < 1;
}

const STATUS_AR: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد الانتظار", cls: "bg-amber-500/10 text-amber-300 border border-amber-500/30" },
  initiated: { label: "بدء الدفع", cls: "bg-blue-500/10 text-blue-300 border border-blue-500/30" },
  paid: { label: "مدفوع", cls: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" },
  payment_failed: { label: "فشل الدفع", cls: "bg-red-500/10 text-red-300 border border-red-500/30" },
  cancelled: { label: "ملغى", cls: "bg-gray-500/10 text-gray-300 border border-gray-500/30" },
  failed: { label: "فاشل", cls: "bg-red-500/10 text-red-300 border border-red-500/30" },
  refunded: { label: "مستردّ", cls: "bg-purple-500/10 text-purple-300 border border-purple-500/30" },
  fulfilled: { label: "مُسلَّم 🎁", cls: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40" },
};

import { supabase } from "@/integrations/supabase/client";

function OrderDetailPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getMyOrderView);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["my-order", id],
    queryFn: async () => {
      // 1. محاولة جلب البيانات من السيرفر
      try {
        const res = await fetchOrder({ data: { id } });
        if (res) return res;
      } catch (err) {
        console.warn("[OrderDetailPage] fetchOrder server function error, using direct DB:", err);
      }

      // 2. جلب الطلب مباشرة من قاعدة البيانات
      const { data: dbOrder, error: dbErr } = await supabase
        .from("orders")
        .select("*")
        .or(`id.eq.${id},order_number.eq.${id}`)
        .maybeSingle();

      if (dbErr || !dbOrder) {
        throw notFound();
      }

      return {
        id: String(dbOrder.id),
        order_number: String(dbOrder.order_number),
        status: String(dbOrder.status),
        payment_method: String(dbOrder.payment_method ?? "card"),
        created_at: String(dbOrder.created_at),
        fulfilled_at: (dbOrder.fulfilled_at as string | null) ?? null,
        customer_name: String(dbOrder.customer_name ?? ""),
        customer_phone: String(dbOrder.customer_phone ?? ""),
        subtotal: Number(dbOrder.subtotal ?? 0),
        discount: Number(dbOrder.discount ?? 0),
        vat: Number(dbOrder.vat ?? 0),
        total: Number(dbOrder.total ?? 0),
        coupon_code: (dbOrder.coupon_code as string | null) ?? null,
        items: Array.isArray(dbOrder.items) ? (dbOrder.items as any[]) : [],
        subscription_username: dbOrder.subscription_username as string | null,
        subscription_password: dbOrder.subscription_password as string | null,
        subscription_url: dbOrder.subscription_url as string | null,
        subscription_extra_info: (dbOrder.subscription_extra_info as Record<string, unknown> | null) ?? null,
      };
    },
    retry: shouldRetry,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        جارٍ التحميل...
      </div>
    );
  }

  if (isError || !order) {
    throw notFound();
  }

  const st = STATUS_AR[order.status] ?? STATUS_AR.pending;
  const items = order.items as Array<{
    product_name?: string;
    duration_label?: string;
    qty?: number;
    unit_price?: number;
  }>;
  const isFulfilled = order.status === "fulfilled";

  return (
    <div className="space-y-4">
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary"
      >
        <ChevronRight className="h-4 w-4" /> العودة لطلباتي
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-mono text-base font-black">{order.order_number}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleString("ar-SA")}
              </div>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${st.cls}`}>{st.label}</span>
        </div>

        <div className="mt-5 space-y-2">
          {items.map((i, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl bg-secondary/40 p-3 text-sm"
            >
              <div>
                <div className="font-bold">{i.product_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {i.duration_label ?? ""} × {i.qty ?? 1}
                </div>
              </div>
              <div className="font-bold">{formatSAR((i.unit_price ?? 0) * (i.qty ?? 1))}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-1 border-t border-border pt-4 text-sm">
          <Row label="المجموع الفرعي" value={formatSAR(order.subtotal)} />
          {order.discount > 0 && (
            <Row label="الخصم" value={`- ${formatSAR(order.discount)}`} cls="text-success" />
          )}
          <Row label="ضريبة القيمة المضافة" value={formatSAR(order.vat)} />
          <div className="flex items-center justify-between pt-2">
            <span className="text-base font-black">الإجمالي</span>
            <span className="text-xl font-black text-primary">{formatSAR(order.total)}</span>
          </div>
        </div>
      </div>

      <OrderStatusBanner status={order.status} />

      {isFulfilled && (
        <CredentialsCard
          username={order.subscription_username}
          password={order.subscription_password}
          url={order.subscription_url}
          extraInfo={order.subscription_extra_info}
          fulfilledAt={order.fulfilled_at}
        />
      )}
    </div>
  );
}

function Row({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${cls}`}>{value}</span>
    </div>
  );
}
