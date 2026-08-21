import { ORDER_STATUS_LABELS } from "@/lib/admin-orders";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  initiated: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  payment_failed: "bg-red-500/10 text-red-300 border-red-500/30",
  cancelled: "bg-gray-500/10 text-gray-300 border-gray-500/30",
  failed: "bg-red-500/10 text-red-300 border-red-500/30",
  refunded: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  fulfilled: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40",
};

// شارة "بانتظار التسليم" البرتقالية للطلبات المدفوعة غير المُسلَّمة (fulfilled_at IS NULL).
const AWAITING_FULFILLMENT_STYLE = "bg-orange-500/15 text-orange-300 border-orange-500/40";

/**
 * شارة حالة الطلب — مع اشتقاق "بانتظار التسليم":
 *  - status='paid' AND لا يوجد fulfilledAt  → "بانتظار التسليم" (برتقالي).
 *  - status='fulfilled'                      → "مُسلَّم 🎁" (أخضر، الشارة العادية).
 *  - الباقي                                  → الشارة العادية الدفاعية.
 * مرّر fulfilledAt من صفوف الجدول/التفاصيل لتفعيل الاشتقاق.
 */
export function OrderStatusBadge({
  status,
  fulfilledAt,
  className,
}: {
  status: string;
  fulfilledAt?: string | null;
  className?: string;
}) {
  const awaiting = status === "paid" && !fulfilledAt;
  const label = awaiting ? "بانتظار التسليم" : (ORDER_STATUS_LABELS[status] ?? status);
  const style = awaiting
    ? AWAITING_FULFILLMENT_STYLE
    : (STYLES[status] ?? "bg-muted text-muted-foreground border-border");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold whitespace-nowrap",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
