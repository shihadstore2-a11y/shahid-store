import { useMemo, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, ExternalLink, MessageCircle } from "lucide-react";
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
import type { AdminOrderRow } from "@/lib/admin-orders";
import { formatSAR } from "@/lib/format";

const TEMPLATE_ICONS: Record<WhatsappTemplate, string> = {
  confirmation: "✅",
  credentials: "🔑",
  delay: "⏰",
  follow_up: "📞",
  custom: "✏️",
};

export function WhatsappModal({
  order,
  open,
  onOpenChange,
}: {
  order: AdminOrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const logFn = useServerFn(logWhatsappSent);

  const [template, setTemplate] = useState<WhatsappTemplate>("confirmation");
  const [customText, setCustomText] = useState("");
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    url: "",
  });
  const [timeEstimate, setTimeEstimate] = useState("15-30 دقيقة");

  // إعادة تعيين الحقول عند فتح طلب جديد
  useEffect(() => {
    if (open && order) {
      setTemplate("confirmation");
      setCustomText("");
      setCredentials({ username: "", password: "", url: "" });
      setTimeEstimate("15-30 دقيقة");
    }
  }, [open, order?.id]);

  const firstItem = order?.items?.[0];
  const productName =
    firstItem?.product_name ?? firstItem?.name_ar ?? firstItem?.name ?? undefined;

  const message = useMemo(() => {
    if (!order) return "";
    return buildOrderMessage(template, {
      customer_name: order.customer_name,
      product_name: productName,
      order_number: order.order_number,
      total: Number(order.total) || undefined,
      username: credentials.username || undefined,
      password: credentials.password || undefined,
      url: credentials.url || undefined,
      custom_text: customText,
      time_estimate: timeEstimate,
    });
  }, [order, template, productName, credentials, customText, timeEstimate]);

  const phoneNormalized = order ? normalizePhoneNumber(order.customer_phone) : "";
  const phoneDisplay = order ? formatPhoneForDisplay(order.customer_phone) : "";
  const link = order ? buildWhatsappLink(order.customer_phone, message) : "#";
  const isTooLong = message.length > WHATSAPP_MAX_LEN;
  const phoneInvalid = !phoneNormalized || phoneNormalized.length < 10;

  const logMutation = useMutation({
    mutationFn: (t: WhatsappTemplate) =>
      logFn({ data: { orderId: order!.id, template: t } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: any) => {
      toast.error("فشل تسجيل الإرسال: " + (e?.message ?? "غير معروف"));
    },
  });

  const handleSend = () => {
    if (!order) return;
    if (phoneInvalid) {
      toast.error("رقم الجوال غير صالح — راجع بيانات العميل");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
    logMutation.mutate(template);
    toast.success("تم فتح WhatsApp + تسجيل الإرسال");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("تم نسخ الرسالة");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto sm:w-full">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-right">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            إرسال WhatsApp — {order.customer_name}
          </DialogTitle>
          <DialogDescription className="text-right">
            اختر القالب وأدخل البيانات، ثم افتح WhatsApp يدوياً.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* معلومات العميل */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span dir="ltr" className="font-mono font-bold">
                📱 {phoneDisplay}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                📦 #{order.order_number}
              </span>
              <span className="text-xs text-muted-foreground">
                💰 {formatSAR(order.total)}
              </span>
            </div>
            {phoneInvalid && (
              <p className="mt-2 text-xs font-bold text-destructive">
                ⚠️ رقم الجوال غير صالح — قد لا يفتح WhatsApp بشكل صحيح.
              </p>
            )}
          </div>

          {/* اختيار القالب */}
          <div>
            <Label className="mb-2 block text-sm font-black">اختر نوع الرسالة:</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(WHATSAPP_TEMPLATE_LABELS) as WhatsappTemplate[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplate(t)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-right text-sm font-bold transition-colors",
                    t === "custom" && "col-span-2",
                    template === t
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-200"
                      : "border-border bg-card hover:border-emerald-500/50 hover:bg-emerald-500/5",
                  )}
                >
                  <span className="me-2">{TEMPLATE_ICONS[t]}</span>
                  {WHATSAPP_TEMPLATE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* حقول ديناميكية */}
          {template === "credentials" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="اسم المستخدم">
                <Input
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  placeholder="user@example.com"
                  dir="ltr"
                />
              </Field>
              <Field label="كلمة المرور">
                <Input
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  placeholder="••••••••"
                  dir="ltr"
                />
              </Field>
              <Field label="الرابط (اختياري)" className="sm:col-span-2">
                <Input
                  value={credentials.url}
                  onChange={(e) =>
                    setCredentials({ ...credentials, url: e.target.value })
                  }
                  placeholder="https://..."
                  dir="ltr"
                />
              </Field>
            </div>
          )}

          {template === "delay" && (
            <Field label="الوقت المتوقّع">
              <Input
                value={timeEstimate}
                onChange={(e) => setTimeEstimate(e.target.value)}
                placeholder="مثال: 30 دقيقة"
              />
            </Field>
          )}

          {template === "custom" && (
            <Field label="نص الرسالة">
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={8}
                placeholder="اكتب الرسالة بحرّية..."
              />
            </Field>
          )}

          {/* المعاينة */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-black">معاينة الرسالة:</Label>
              <span
                className={cn(
                  "text-xs",
                  isTooLong ? "font-bold text-destructive" : "text-muted-foreground",
                )}
              >
                {message.length} / {WHATSAPP_MAX_LEN}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm leading-relaxed">
              {message || <span className="text-muted-foreground">— الرسالة فارغة —</span>}
            </div>
            {isTooLong && (
              <p className="mt-1 text-xs font-bold text-destructive">
                ⚠️ الرسالة تتجاوز حدّ WhatsApp ({WHATSAPP_MAX_LEN} حرف). قسّمها لرسالتين.
              </p>
            )}
          </div>

          {/* الأكشن */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={handleSend}
              disabled={phoneInvalid || !message.trim()}
              className="flex-1 gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <ExternalLink className="h-4 w-4" />
              فتح WhatsApp + تسجيل الإرسال
            </Button>
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              <Copy className="h-4 w-4" />
              نسخ
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
