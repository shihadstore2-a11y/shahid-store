import { useMemo, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, ExternalLink, MessageCircle, Sparkles, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  WHATSAPP_TEMPLATE_LABELS,
  WHATSAPP_MAX_LEN,
  buildOrderMessage,
  buildWhatsappLink,
  type WhatsappTemplate,
} from "@/lib/whatsapp-templates";
import {
  normalizePhoneNumber,
  formatPhoneForDisplay,
} from "@/lib/whatsapp-phone";
import { logWhatsappSent } from "@/lib/admin-whatsapp.functions";
import type { AbandonedOrderRow } from "@/lib/admin-abandoned-orders";
import { formatSAR } from "@/lib/format";

const ABANDONED_TEMPLATES: WhatsappTemplate[] = [
  "abandoned_recovery",
  "abandoned_discount",
  "custom",
];

const TEMPLATE_ICONS: Record<string, string> = {
  abandoned_recovery: "💬",
  abandoned_discount: "🎁",
  custom: "✏️",
};

export function AbandonedWhatsappModal({
  order,
  open,
  onOpenChange,
}: {
  order: AbandonedOrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const logFn = useServerFn(logWhatsappSent);

  const [template, setTemplate] =
    useState<WhatsappTemplate>("abandoned_recovery");
  const [customText, setCustomText] = useState("");
  const [discountCode, setDiscountCode] = useState("SPECIAL10");

  useEffect(() => {
    if (open && order) {
      setTemplate("abandoned_recovery");
      setCustomText("");
      setDiscountCode("SPECIAL10");
    }
  }, [open, order?.id]);

  const firstItem = order?.items?.[0];
  const productName =
    firstItem?.product_name ??
    firstItem?.name_ar ??
    firstItem?.name ??
    undefined;

  const message = useMemo(() => {
    if (!order) return "";
    return buildOrderMessage(template, {
      customer_name: order.customer_name,
      product_name: productName,
      order_number: order.order_number,
      total: Number(order.total) || undefined,
      custom_text: customText,
      discount_code: discountCode,
    });
  }, [order, template, productName, customText, discountCode]);

  const phoneNormalized = order
    ? normalizePhoneNumber(order.customer_phone)
    : "";
  const phoneDisplay = order
    ? formatPhoneForDisplay(order.customer_phone)
    : "";
  const link = order ? buildWhatsappLink(order.customer_phone, message) : "#";
  const isTooLong = message.length > WHATSAPP_MAX_LEN;
  const phoneInvalid = !phoneNormalized || phoneNormalized.length < 10;

  const logMutation = useMutation({
    mutationFn: (t: WhatsappTemplate) =>
      logFn({ data: { orderId: order!.id, template: t } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "abandoned-orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "abandoned-orders", "stats"],
      });
      toast.success("تم تسجيل إرسال رسالة الاستعادة 💬");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(`فشل تسجيل الإرسال: ${err.message}`);
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("تم نسخ نص الرسالة");
    } catch {
      toast.error("فشل النسخ");
    }
  };

  const handleOpenAndLog = () => {
    if (!order || phoneInvalid) return;
    window.open(link, "_blank", "noopener,noreferrer");
    logMutation.mutate(template);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            استعادة السلة المتروكة عبر واتساب
          </DialogTitle>
          <DialogDescription className="text-right">
            تواصل مع العميل{" "}
            <span className="font-bold text-foreground">
              {order?.customer_name}
            </span>{" "}
            لمساعدته في إكمال الدفع أو تقديم عرض خاص.
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            {/* ملخص السلة المتروكة */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">رقم الطلب:</span>
                  <span className="font-mono font-bold">
                    #{order.order_number}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">المنتج:</span>
                  <span className="font-bold text-foreground">
                    {productName || "اشتراك"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">المبلغ:</span>
                  <span className="font-black text-primary">
                    {formatSAR(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* اختيار القالب */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">اختر نوع الرسالة</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ABANDONED_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemplate(t)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition",
                      template === t
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                        : "border-border bg-card text-muted-foreground hover:border-emerald-500/50 hover:text-foreground",
                    )}
                  >
                    <span>{TEMPLATE_ICONS[t]}</span>
                    <span>{WHATSAPP_TEMPLATE_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* حقول إضافية حسب القالب */}
            {template === "abandoned_discount" && (
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  كود الخصم المراد تقديمه للعميل
                </Label>
                <Input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="مثال: SAVE15 أو VIP"
                  className="font-mono text-sm"
                />
              </div>
            )}

            {template === "custom" && (
              <div className="space-y-2">
                <Label className="text-xs font-bold">نص الرسالة المخصصة</Label>
                <Textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="اكتب رسالتك المخصصة هنا..."
                  rows={4}
                  className="text-sm leading-relaxed"
                />
              </div>
            )}

            {/* معاينة الرسالة */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">
                  معاينة الرسالة:
                </span>
                <span
                  className={cn(
                    "text-[11px] font-mono",
                    isTooLong
                      ? "text-destructive font-bold"
                      : "text-muted-foreground",
                  )}
                >
                  {message.length} / {WHATSAPP_MAX_LEN} حرف
                </span>
              </div>
              <div className="relative rounded-xl border border-border bg-muted/40 p-4">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
                  {message}
                </pre>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="absolute bottom-2 left-2 h-7 gap-1 px-2 text-[11px]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  نسخ
                </Button>
              </div>
            </div>

            {/* أزرار الإجراء */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-muted-foreground">
                رقم العميل: <span dir="ltr" className="font-mono font-bold text-foreground">{phoneDisplay || order.customer_phone}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 sm:flex-initial"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  onClick={handleOpenAndLog}
                  disabled={phoneInvalid || isTooLong || logMutation.isPending}
                  className="flex-1 sm:flex-initial gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>فتح WhatsApp ومراسلة العميل</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
