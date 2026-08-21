import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { PaymentMethodBadge } from "./PaymentMethodBadge";
import { formatSAR } from "@/lib/format";
import { formatRelativeArabic, type AdminOrderRow } from "@/lib/admin-orders";

export function OrderCard({
  order,
  onOpen,
}: {
  order: AdminOrderRow;
  onOpen: (id: string) => void;
}) {
  const first = order.items[0];
  const firstName = first?.product_name ?? first?.name_ar ?? first?.name ?? "—";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">#{order.order_number}</span>
        <OrderStatusBadge status={order.status} fulfilledAt={order.fulfilled_at} />
      </div>
      <p className="font-bold">{order.customer_name}</p>
      <p className="text-xs text-muted-foreground" dir="ltr">{order.customer_phone}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="truncate text-sm">{firstName}</span>
        <span className="shrink-0 font-bold text-[var(--gold)]">{formatSAR(order.total)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <PaymentMethodBadge method={order.payment_method} />
        <span className="text-muted-foreground">{formatRelativeArabic(order.created_at)}</span>
      </div>

      <Button
        variant="outline"
        className="mt-3 w-full"
        onClick={() => onOpen(order.id)}
      >
        تفاصيل الطلب
      </Button>
    </div>
  );
}
