// Banner للحالات النهائية السلبية (cancelled / failed / payment_failed).
// يُستخدم في order-success و account.order.
type Props = { status: string };

export function OrderStatusBanner({ status }: Props) {
  const isCancelled = status === "cancelled";
  const isFailed = status === "failed" || status === "payment_failed";
  if (!isCancelled && !isFailed) return null;

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
      <p className="text-sm font-bold text-red-200">
        {isCancelled ? "⚠️ تم إلغاء هذا الطلب" : "❌ تعذّر إتمام الدفع لهذا الطلب"}
      </p>
      <p className="mt-1 text-xs text-red-300/80">
        للمساعدة، تواصل معنا عبر واتساب.
      </p>
    </div>
  );
}
