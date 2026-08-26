import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Lock, Package, RefreshCw } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { CredentialsCard } from "@/components/orders/CredentialsCard";
import { OrderStatusBanner } from "@/components/orders/OrderStatusBanner";
import { SaveInfoCTA } from "@/components/orders/SaveInfoCTA";
import { getCustomerOrderView } from "@/lib/customer-order.functions";
import { formatSAR } from "@/lib/format";
import { durationLabel } from "@/lib/order";
import { useWhatsappLink } from "@/lib/whatsapp";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// لا نُعيد المحاولة على notFound (404) أو ORDER_LOCKED — هدر بلا فائدة.
function shouldRetry(failureCount: number, error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  if (msg.includes("not found") || msg.includes("notfound")) return false;
  if (msg.includes("order_locked")) return false;
  return failureCount < 1;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return String(error ?? "");
}

export const Route = createFileRoute("/order-success/$id")({
  head: () => ({
    meta: [
      { title: "تم استلام طلبك — شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black">الطلب غير موجود</h1>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          الرئيسية
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black">تعذّر تحميل الطلب</h1>
        <p className="mt-2 text-sm text-muted-foreground">حاول تحديث الصفحة بعد قليل.</p>
      </div>
    </SiteLayout>
  ),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const fetchOrder = useServerFn(getCustomerOrderView);

  const { data: result, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["customer-order", id],
    queryFn: async () => {
      // 1. محاولة الجلب عبر server function
      try {
        const res = await fetchOrder({ data: { id } });
        if (res && res.order) return res;
      } catch (e) {
        console.warn("[SuccessPage] fetchOrder serverFn fallback:", e);
      }

      // 2. محاولة الجلب المباشر عبر RPC من العميل
      try {
        const { data: rpcData } = await supabase.rpc("get_order_delivery_status", {
          _order_id: id,
        });

        if (rpcData && typeof rpcData === "object" && (rpcData as Record<string, unknown>).order_number) {
          const row = rpcData as Record<string, unknown>;
          const isFulfilled = row.status === "fulfilled";
          return {
            locked: false,
            order: {
              id: String(row.id),
              order_number: String(row.order_number),
              status: String(row.status),
              payment_method: String(row.payment_method ?? "card"),
              created_at: String(row.created_at),
              fulfilled_at: (row.fulfilled_at as string | null) ?? null,
              customer_name: String(row.customer_name ?? ""),
              customer_phone: String(row.customer_phone ?? ""),
              subtotal: Number(row.subtotal ?? 0),
              discount: Number(row.discount ?? 0),
              vat: Number(row.vat ?? 0),
              total: Number(row.total ?? 0),
              coupon_code: (row.coupon_code as string | null) ?? null,
              items: (Array.isArray(row.items) ? row.items : []) as any,
              subscription_username: isFulfilled ? ((row.subscription_username as string | null) ?? null) : null,
              subscription_password: isFulfilled ? ((row.subscription_password as string | null) ?? null) : null,
              subscription_url: isFulfilled ? ((row.subscription_url as string | null) ?? null) : null,
              subscription_extra_info: isFulfilled ? (row.subscription_extra_info as any) : null,
            },
          };
        }
      } catch (e) {
        console.warn("[SuccessPage] RPC fallback error:", e);
      }

      // 3. محاولة الجلب المباشر من جدول orders
      const { data: tableData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (tableData) {
        const isFulfilled = tableData.status === "fulfilled";
        return {
          locked: false,
          order: {
            id: String(tableData.id),
            order_number: String(tableData.order_number),
            status: String(tableData.status),
            payment_method: String(tableData.payment_method ?? "card"),
            created_at: String(tableData.created_at),
            fulfilled_at: (tableData.fulfilled_at as string | null) ?? null,
            customer_name: String(tableData.customer_name ?? ""),
            customer_phone: String(tableData.customer_phone ?? ""),
            subtotal: Number(tableData.subtotal ?? 0),
            discount: Number(tableData.discount ?? 0),
            vat: Number(tableData.vat ?? 0),
            total: Number(tableData.total ?? 0),
            coupon_code: (tableData.coupon_code as string | null) ?? null,
            items: (Array.isArray(tableData.items) ? tableData.items : []) as any,
            subscription_username: isFulfilled ? ((tableData.subscription_username as string | null) ?? null) : null,
            subscription_password: isFulfilled ? ((tableData.subscription_password as string | null) ?? null) : null,
            subscription_url: isFulfilled ? ((tableData.subscription_url as string | null) ?? null) : null,
            subscription_extra_info: isFulfilled ? (tableData.subscription_extra_info as any) : null,
          },
        };
      }

      return null;
    },
    retry: shouldRetry,
    // إعادة التحقق كل 8 ثواني إذا الطلب ما زال في paid
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d && !d.locked && (d.order?.status === "paid")) return 8000;
      return false;
    },
  });

  const isLocked = result?.locked === true || getErrorMessage(error) === "ORDER_LOCKED";
  const order = result?.locked === false ? result.order : null;
  const isFulfilled = order?.status === "fulfilled";
  const isPaid = order?.status === "paid";

  const waMessage = order
    ? isFulfilled
      ? `السلام عليكم،

أحتاج دعماً بخصوص اشتراكي.

📦 رقم الطلب: ${order.order_number}
📅 التاريخ: ${new Date(order.created_at).toLocaleDateString("ar-SA")}

شكراً.`
      : `السلام عليكم،

تم الدفع بنجاح ✅

📦 رقم الطلب: ${order.order_number}
💰 المبلغ: ${formatSAR(order.total)}
📅 التاريخ: ${new Date(order.created_at).toLocaleDateString("ar-SA")}

أرجو إرسال بيانات تفعيل الاشتراك خلال 1-3 ساعات.

شكراً.`
    : "";

  const waUrl = useWhatsappLink(waMessage);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
          جارٍ تحميل الطلب...
        </div>
      </SiteLayout>
    );
  }

  // F.7: Locked state — vague UX (no info leak about existence/ownership).
  if (isLocked) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-xl font-black sm:text-2xl">الطلب غير متاح</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              هذا الطلب مرتبط بحساب. سجّل دخولك لعرضه.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href={`/login?redirect=${encodeURIComponent(`/order-success/${id}`)}&force=1`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90"
              >
                تسجيل الدخول
              </a>
              <Link
                to="/track-order"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
              >
                <Package className="h-4 w-4" /> تتبّع برقم الطلب بدلاً من ذلك
              </Link>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  if (isError || !order) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
            <h1 className="mt-4 text-xl font-black sm:text-2xl">جارٍ جلب تفاصيل طلبك</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              تم استلام دفعتك بنجاح. نُجري تحديثاً لسجلات طلبك الآن...
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" /> تحديث الصفحة الآن
              </button>
              <Link
                to="/track-order"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
              >
                <Package className="h-4 w-4" /> تتبّع برقم الطلب
              </Link>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl space-y-4 px-4 py-12 sm:py-16">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-8">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
              isFulfilled ? "bg-emerald-500/15 text-emerald-300" : "bg-success/10 text-success"
            }`}
          >
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">
            {isFulfilled ? "اشتراكك جاهز! 🎁" : "تم تأكيد دفعتك ✅"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isFulfilled
              ? "ستجد بيانات الاشتراك أدناه. احفظها في مكان آمن."
              : "استلمنا دفعتك بنجاح. جارٍ تجهيز وتسليم الاشتراك إليك."}
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-border bg-secondary/40 p-4 text-right">
            <Row label="رقم الطلب" value={order.order_number} mono />
            <Row label="الاسم" value={order.customer_name} />
            <Row label="الجوال" value={order.customer_phone} mono />
            <Row label="الإجمالي" value={formatSAR(order.total)} bold />
            <div className="my-3 border-t border-border" />
            <div className="text-xs font-bold text-foreground">الباقات:</div>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              {order.items?.map((i, idx) => {
                const dur = i.duration_label ?? durationLabel(i.duration_months);
                return (
                  <li key={idx}>
                    • {i.product_name ?? "—"}
                    {dur ? ` — ${dur}` : ""} × {i.qty ?? 1}
                  </li>
                );
              })}
            </ul>
          </div>

          {(order.status === "paid" || isFulfilled) && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-base font-black text-white shadow-2xl transition-transform hover:scale-105 hover:bg-[#1FAD55]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.125.298-.324.447-.486.149-.162.198-.297.298-.496.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 1.448 11.89-4.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              {isFulfilled ? "تواصل مع الدعم عبر واتساب" : "استلم اشتراكك خلال 1-3 ساعات عبر واتساب"}
            </a>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to="/track-order"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
            >
              <Package className="h-4 w-4" /> تتبع الطلب
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
            >
              متابعة التسوق
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            احفظ رقم الطلب في مكان آمن لمتابعة حالته لاحقاً.
          </p>
        </div>

        {/* ─── بانر حالة paid — تجهيز وتسليم ─── */}
        {isPaid && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="flex-1 text-right">
                <p className="text-sm font-black text-amber-300">
                  جارٍ تجهيز وتسليم اشتراكك ⏳
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  سيظهر الاشتراك تلقائياً هنا فور التسليم. يتم التحقق تلقائياً كل 8 ثواني.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-amber-400 hover:bg-amber-500/20"
                title="تحديث الحالة"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {!user &&
          (order.status === "paid" || isFulfilled) &&
          order.customer_email && (
            <SaveInfoCTA orderEmail={order.customer_email} orderId={id} />
          )}

        {user && (order.status === "paid" || isFulfilled) && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-right shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-xs font-bold text-emerald-300">
                هذا الطلب محفوظ في حسابك — راجعه من <bdi>«طلباتي»</bdi> في أي وقت.
              </p>
            </div>
          </div>
        )}

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
      </section>
    </SiteLayout>
  );
}

function Row({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${
          bold ? "text-base font-black text-primary" : "font-bold text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
