import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useState } from "react";
import { AlertCircle, Loader2, MessageCircle, RotateCw, X } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { formatSAR } from "@/lib/format";
import { useWhatsappLink } from "@/lib/whatsapp";
import { cancelOrder, getOrderRecovery } from "@/lib/order.functions";

const SearchSchema = z.object({
  order: z.string().uuid().optional(),
});

export const Route = createFileRoute("/payment/failed")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "تعذّر إتمام الدفع — شاهد ستور" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PaymentFailedPage,
});

function PaymentFailedPage() {
  const { order: orderId } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const fetchRecovery = useServerFn(getOrderRecovery);
  const cancelOrderFn = useServerFn(cancelOrder);

  const recoveryQuery = useQuery({
    queryKey: ["payment-failed-recovery", orderId],
    queryFn: () => fetchRecovery({ data: { orderId: orderId! } }),
    enabled: !!orderId,
    staleTime: 30_000,
  });

  const data = recoveryQuery.data?.ok ? recoveryQuery.data : null;
  const order = data?.order ?? null;
  const payment = data?.payment ?? null;
  const checkoutUrl = payment?.checkoutUrl ?? null;
  const isCancelled = order?.status === "cancelled";

  // رسالة واتساب جاهزة للعميل عند طلب المساعدة بعد فشل الدفع
  const waMessage = order
    ? [
        "السلام عليكم 👋",
        "واجهت مشكلة في إتمام الدفع وأحتاج مساعدتكم.",
        "",
        `📋 رقم الطلب: ${order.orderNumber}`,
        `👤 الاسم: ${order.customerName}`,
        `💰 المبلغ: ${formatSAR(order.total)}`,
      ].join("\n")
    : "السلام عليكم، واجهت مشكلة في إتمام الدفع وأحتاج مساعدتكم.";

  const waHref = useWhatsappLink(waMessage);

  const [confirming, setConfirming] = useState(false);
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error("لا يوجد رقم طلب");
      await cancelOrderFn({ data: { orderId } });
    },
    onSuccess: async () => {
      await recoveryQuery.refetch();
      router.invalidate();
    },
    onError: (err: Error) => {
      alert(err?.message || "تعذّر إلغاء الطلب، حاول مرة أخرى.");
    },
    onSettled: () => setConfirming(false),
  });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-9 w-9" />
          </div>
          <h1 className="mt-5 text-2xl font-black sm:text-3xl">تعذّر إتمام الدفع</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            لم تكتمل عملية الدفع ولم يُخصم أي مبلغ من بطاقتك. اختر أحد الخيارات بالأسفل
            لإكمال طلبك أو التواصل معنا.
          </p>
        </div>

        {/* Loading */}
        {orderId && recoveryQuery.isLoading && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Order summary */}
        {order && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">رقم الطلب</span>
              <span dir="ltr" className="font-black tracking-wide">
                {order.orderNumber}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">المبلغ</span>
              <span className="font-black text-accent">{formatSAR(order.total)}</span>
            </div>
            {isCancelled && (
              <div className="mt-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-center text-xs font-bold text-muted-foreground">
                تم إلغاء هذا الطلب
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {/* Retry */}
          {checkoutUrl && !isCancelled && (
            <a
              href={checkoutUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-black text-accent-foreground transition hover:opacity-90"
            >
              <RotateCw className="h-4 w-4" />
              إعادة المحاولة
            </a>
          )}

          {/* WhatsApp */}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/50 bg-card px-6 py-3 text-sm font-black text-foreground transition hover:border-accent hover:text-accent"
          >
            <MessageCircle className="h-4 w-4 text-accent" />
            تواصل عبر واتساب
          </a>

          {/* Cancel */}
          {orderId && order && !isCancelled && (
            <>
              {!confirming ? (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-muted-foreground transition hover:border-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                  إلغاء الطلب
                </button>
              ) : (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-center">
                  <p className="text-sm font-bold text-foreground">
                    هل أنت متأكد من إلغاء الطلب؟ لا يمكن التراجع.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-black text-destructive-foreground disabled:opacity-60"
                    >
                      {cancelMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      نعم، إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={cancelMutation.isPending}
                      className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-bold"
                    >
                      تراجع
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-muted-foreground transition hover:text-foreground"
          >
            العودة للصفحة الرئيسية
          </button>

          {orderId && (
            <Link
              to="/order-success/$id"
              params={{ id: orderId }}
              className="text-center text-xs text-muted-foreground underline-offset-4 hover:text-accent hover:underline"
            >
              عرض تفاصيل الطلب
            </Link>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          لو واجهت مشكلة، تواصل معنا عبر واتساب وسنساعدك فوراً.
        </p>
      </section>
    </SiteLayout>
  );
}
