import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Gift, MessageCircle, MoreVertical, Package } from "lucide-react";

import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { PaymentMethodBadge } from "./PaymentMethodBadge";
import { WhatsappModal } from "./WhatsappModal";
import { FulfillModal } from "./FulfillModal";
import {
  ADMIN_SELECTABLE_STATUSES,
  ORDER_STATUS_LABELS,
  adminOrderDetailQueryOptions,
  formatDateTimeArabic,
  formatRelativeArabic,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/admin-orders";
import { formatSAR } from "@/lib/format";
import { durationLabel } from "@/lib/order";
import { useAdminUser } from "@/hooks/useAdminUser";
import { WHATSAPP_TEMPLATE_LABELS, type WhatsappTemplate } from "@/lib/whatsapp-templates";

export function OrderDetailSheet({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { can } = useAdminUser();
  const canModifyOrders = can("canModifyOrders");
  const canFulfillOrders = can("canFulfillOrders");
  const [waOpen, setWaOpen] = useState(false);
  const [fulfillOpen, setFulfillOpen] = useState(false);
  const { data: order, isLoading } = useQuery({
    ...adminOrderDetailQueryOptions(orderId ?? ""),
    enabled: !!orderId && open,
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId!, status),
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: any) => {
      toast.error("تعذّر التحديث: " + (e?.message ?? "خطأ غير معروف"));
    },
  });

  const copyDetails = () => {
    if (!order) return;
    const items = order.items
      .map((i) => {
        const nm = i.product_name ?? i.name_ar ?? i.name ?? "—";
        const price = (i.unit_price ?? i.price ?? 0) * (i.qty ?? i.quantity ?? 1);
        return `• ${nm} — ${formatSAR(price)}`;
      })
      .join("\n");
    const text = `طلب #${order.order_number}
العميل: ${order.customer_name}
الجوال: ${order.customer_phone}
${items}
الإجمالي: ${formatSAR(order.total)}`;
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ التفاصيل");
  };

  const lastWhatsapp = (() => {
    const arr = order?.whatsapp_messages_sent ?? [];
    if (!arr.length) return null;
    const last = arr[arr.length - 1];
    return {
      label: WHATSAPP_TEMPLATE_LABELS[last.template as WhatsappTemplate] ?? last.template,
      when: formatRelativeArabic(last.sent_at),
      count: arr.length,
    };
  })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        {isLoading || !order ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            جاري التحميل…
          </div>
        ) : (
          <>
            <SheetHeader className="text-right">
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="font-mono text-base">#{order.order_number}</SheetTitle>
                <OrderStatusBadge status={order.status} fulfilledAt={order.fulfilled_at} />
              </div>
              <SheetDescription className="text-right">
                {formatDateTimeArabic(order.created_at)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <section>
                <h4 className="mb-2 text-xs font-black text-muted-foreground">معلومات العميل</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">الاسم:</span> {order.customer_name}</p>
                  <p dir="ltr" className="text-right"><span className="text-muted-foreground">الجوال:</span> {order.customer_phone}</p>
                  <p><span className="text-muted-foreground">الإيميل:</span> {order.customer_email || "—"}</p>
                  {order.city && <p><span className="text-muted-foreground">المدينة:</span> {order.city}</p>}
                  {order.notes && <p><span className="text-muted-foreground">ملاحظات:</span> {order.notes}</p>}
                </div>
                {lastWhatsapp && (
                  <div className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1.5 text-[11px] text-emerald-300">
                    💬 آخر رسالة: {lastWhatsapp.when} ({lastWhatsapp.label})
                    {lastWhatsapp.count > 1 && ` — إجمالي ${lastWhatsapp.count} رسائل`}
                  </div>
                )}
              </section>

              <Separator />

              <section>
                <h4 className="mb-3 text-xs font-black text-muted-foreground">المنتجات</h4>
                <div className="space-y-2">
                  {order.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">لا توجد منتجات</p>
                  ) : (
                    order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {item.product_name ?? item.name_ar ?? item.name ?? "—"}
                          </p>
                          {(() => {
                            const dur = item.duration_label ?? durationLabel(item.duration_months);
                            const q = item.qty ?? item.quantity ?? 1;
                            const meta = [dur, q > 1 ? `× ${q}` : ""].filter(Boolean).join(" ");
                            return meta ? (
                              <p className="text-xs text-muted-foreground">{meta}</p>
                            ) : null;
                          })()}
                        </div>
                        <span className="shrink-0 text-sm font-bold">
                          {formatSAR((item.unit_price ?? item.price ?? 0) * (item.qty ?? item.quantity ?? 1))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{formatSAR(order.subtotal)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-[var(--sale-price)]">
                    <span>الخصم{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                    <span>- {formatSAR(order.discount)}</span>
                  </div>
                )}
                {Number(order.vat) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الضريبة</span>
                    <span>{formatSAR(order.vat)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-black">
                  <span>الإجمالي</span>
                  <span className="text-[var(--gold)]">{formatSAR(order.total)}</span>
                </div>
              </section>

              <Separator />

              <section>
                <h4 className="mb-2 text-xs font-black text-muted-foreground">طريقة الدفع</h4>
                <PaymentMethodBadge method={order.payment_method} />
              </section>

              {order.fulfilled_at && (
                <>
                  <Separator />
                  <section>
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
                      <Gift className="h-4 w-4" />
                      تم التسليم — {formatDateTimeArabic(order.fulfilled_at)}
                    </div>
                    <div className="space-y-2">
                      <CredentialRow label="اسم المستخدم" value={order.subscription_username ?? "—"} />
                      <CredentialRow label="كلمة السر" value={order.subscription_password ?? "—"} mono />
                      {order.subscription_url && (
                        <CredentialRow label="رابط التفعيل" value={order.subscription_url} />
                      )}
                      {order.subscription_extra_info &&
                        Object.keys(order.subscription_extra_info).length > 0 && (
                          <div className="rounded-lg border border-border bg-muted/30 p-2">
                            <p className="mb-1 text-[11px] font-bold text-muted-foreground">
                              بيانات إضافية
                            </p>
                            <pre dir="ltr" className="overflow-x-auto text-[11px]">
                              {JSON.stringify(order.subscription_extra_info, null, 2)}
                            </pre>
                          </div>
                        )}
                    </div>
                  </section>
                </>
              )}

              <Separator />

              <section className="flex flex-col gap-2 pb-6">
                {canModifyOrders ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full justify-between" disabled={statusMutation.isPending}>
                        تغيير الحالة
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                      {ADMIN_SELECTABLE_STATUSES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => statusMutation.mutate(s)}
                          disabled={s === order.status}
                        >
                          {ORDER_STATUS_LABELS[s]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-[11px] text-muted-foreground">
                    وضع المشاهدة فقط — لا تملك صلاحية تغيير حالة الطلب
                  </div>
                )}

                <Button variant="outline" onClick={copyDetails} className="gap-2">
                  <Copy className="h-4 w-4" />
                  نسخ تفاصيل الطلب
                </Button>

                {order.status === "paid" && !order.fulfilled_at && canFulfillOrders && (
                  <Button
                    onClick={() => setFulfillOpen(true)}
                    className="gap-2 bg-amber-500 text-black hover:bg-amber-600"
                  >
                    <Gift className="h-4 w-4" />
                    🎁 تسليم الاشتراك
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setWaOpen(true)}
                  className="gap-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                >
                  <MessageCircle className="h-4 w-4" />
                  إرسال رسالة WhatsApp
                </Button>
              </section>
            </div>
          </>
        )}
      </SheetContent>
      <WhatsappModal order={order ?? null} open={waOpen} onOpenChange={setWaOpen} />
      <FulfillModal order={order ?? null} open={fulfillOpen} onOpenChange={setFulfillOpen} />
    </Sheet>
  );
}

function CredentialRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success("تم النسخ");
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p
          dir="ltr"
          className={`truncate text-right text-sm ${mono ? "font-mono" : "font-medium"}`}
        >
          {value}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={copy} className="h-8 w-8 shrink-0">
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
