import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, MessageCircle, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
import { formatSAR } from "@/lib/format";
import {
  formatDateTimeArabic,
  formatRelativeArabic,
} from "@/lib/admin-orders";
import {
  customerOrdersQueryOptions,
  waLink,
  type Customer,
} from "@/lib/admin-customers";

export function CustomerDetailSheet({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const phone = customer?.customer_phone ?? "";
  const { data: orders, isLoading } = useQuery({
    ...customerOrdersQueryOptions(phone),
    enabled: !!phone && open,
  });

  const stats = useMemo(() => {
    if (!customer) return null;
    const avg = customer.order_count
      ? customer.total_spent / customer.order_count
      : 0;
    return { avg };
  }, [customer]);

  const copyPhone = () => {
    if (!customer) return;
    navigator.clipboard.writeText(customer.customer_phone);
    toast.success("تم نسخ الرقم");
  };
  const openWa = () => {
    if (!customer) return;
    window.open(waLink(customer.customer_phone), "_blank");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
        {!customer ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            —
          </div>
        ) : (
          <>
            <SheetHeader className="text-right">
              <SheetTitle className="text-lg">{customer.customer_name}</SheetTitle>
              <SheetDescription className="text-right">
                عميل منذ {formatDateTimeArabic(customer.first_order_at)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Contact */}
              <section>
                <h4 className="mb-2 text-xs font-black text-muted-foreground">
                  معلومات الاتصال
                </h4>
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <span dir="ltr" className="font-mono text-sm">
                    {customer.customer_phone}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyPhone} aria-label="نسخ">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openWa} aria-label="مراسلة">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {customer.customer_email && (
                  <p className="mt-2 text-xs text-muted-foreground" dir="ltr">
                    {customer.customer_email}
                  </p>
                )}
              </section>

              <Separator />

              {/* Stats */}
              <section className="grid grid-cols-2 gap-3">
                <Stat label="إجمالي الطلبات" value={String(customer.order_count)} />
                <Stat
                  label="إجمالي الإنفاق"
                  value={formatSAR(customer.total_spent)}
                  highlight
                />
                <Stat label="متوسط الطلب" value={formatSAR(stats?.avg ?? 0)} />
                <Stat
                  label="آخر طلب"
                  value={formatRelativeArabic(customer.last_order_at)}
                />
              </section>

              <Separator />

              {/* Orders */}
              <section>
                <h4 className="mb-3 text-xs font-black text-muted-foreground">
                  طلبات العميل
                </h4>
                {isLoading ? (
                  <div className="h-24 animate-pulse rounded-lg bg-muted" />
                ) : !orders || orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                    <Package className="mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">لا توجد طلبات</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold">
                              #{o.order_number}
                            </span>
                            <OrderStatusBadge status={o.status} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatRelativeArabic(o.created_at)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-black">
                          {formatSAR(o.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 truncate text-base font-black text-[var(--gold)]"
            : "mt-1 truncate text-base font-black"
        }
      >
        {value}
      </p>
    </div>
  );
}
