import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Eye, EyeOff, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { fulfillOrder } from "@/lib/admin-fulfillment.functions";
import type { AdminOrderRow } from "@/lib/admin-orders";

export function FulfillModal({
  order,
  open,
  onOpenChange,
}: {
  order: AdminOrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const fulfillFn = useServerFn(fulfillOrder);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [url, setUrl] = useState("");
  const [extraJson, setExtraJson] = useState("");
  const orderId = order?.id;

  const targetEmail = order?.customer_email || order?.customer_phone || "";

  useEffect(() => {
    if (open && orderId) {
      setUsername(targetEmail);
      setPassword("");
      setShowPassword(false);
      setUrl("");
      setExtraJson("");
    }
  }, [open, orderId, targetEmail]);

  const jsonValidation = useMemo(() => {
    const raw = extraJson.trim();
    if (!raw)
      return { ok: true as const, parsed: undefined as Record<string, unknown> | undefined };
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false as const, error: "يجب أن يكون JSON object (مفاتيح/قيم)" };
      }
      const keys = Object.keys(parsed);
      if (keys.length > 50) return { ok: false as const, error: "تجاوز 50 مفتاحاً" };
      return { ok: true as const, parsed: parsed as Record<string, unknown> };
    } catch {
      return { ok: false as const, error: "صيغة JSON غير صالحة" };
    }
  }, [extraJson]);

  type FulfillVars = {
    orderId: string;
    subscription_username: string;
    subscription_password: string;
    subscription_url?: string;
    subscription_extra_info?: Record<string, unknown>;
  };

  const mutation = useMutation({
    mutationFn: async (vars: FulfillVars) => {
      const nowIso = new Date().toISOString();
      const targetUsername = vars.subscription_username || order.customer_email || order.customer_phone || "عميل المتجر";
      const targetPassword = vars.subscription_password || "555555";

      // 1. تحديث مباشر للطلب في قاعدة البيانات
      const { data: directData, error: directErr } = await supabase
        .from("orders")
        .update({
          subscription_username: targetUsername,
          subscription_password: targetPassword,
          subscription_url: vars.subscription_url ?? null,
          subscription_extra_info: (vars.subscription_extra_info ?? {}) as any,
          fulfilled_at: nowIso,
          status: "fulfilled",
          updated_at: nowIso,
        })
        .eq("id", vars.orderId)
        .select("id, status, subscription_username, subscription_password, fulfilled_at")
        .maybeSingle();

      if (!directErr && directData) {
        return directData;
      }

      // 2. استخدام دالة RPC كإجراء احتياطي
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "fulfill_order_admin",
        {
          _order_id: vars.orderId,
          _username: targetUsername,
          _password: targetPassword,
          _url: vars.subscription_url ?? null,
          _extra_info: vars.subscription_extra_info ?? {},
        },
      );

      if (!rpcError && rpcData && typeof rpcData === "object" && (rpcData as Record<string, unknown>).success) {
        return rpcData;
      }

      // 3. محاولة السيرفر
      return fulfillFn({
        data: {
          ...vars,
          subscription_username: targetUsername,
          subscription_password: targetPassword,
        },
      });
    },
    onSuccess: () => {
      toast.success("تم تسليم الاشتراك بنجاح ✅");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      if (order) {
        queryClient.invalidateQueries({ queryKey: ["admin", "orders", "detail", order.id] });
      }
      onOpenChange(false);
    },

    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "خطأ غير معروف";
      toast.error("فشل التسليم: " + message);
    },
  });

  const handleSubmit = () => {
    if (!order) return;

    let extraInfoToSend: Record<string, unknown> | undefined = undefined;
    const raw = extraJson.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed) &&
          Object.keys(parsed).length <= 50
        ) {
          extraInfoToSend = parsed as Record<string, unknown>;
        } else {
          return;
        }
      } catch {
        return;
      }
    }

    mutation.mutate({
      orderId: order.id,
      subscription_username: order.customer_email || username.trim() || order.customer_phone || "عميل المتجر",
      subscription_password: password || "N/A",
      subscription_url: url.trim() || undefined,
      subscription_extra_info: extraInfoToSend,
    });
  };

  if (!order) return null;

  const disabled = (!username.trim() && !password) || !jsonValidation.ok || mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto sm:w-full">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-right">
            <Gift className="h-5 w-5 text-amber-500" />
            تسليم الاشتراك — {order.customer_name}
          </DialogTitle>
          <DialogDescription className="text-right font-mono text-xs">
            #{order.order_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
            أدخل بيانات الاشتراك أو كود التفعيل للعميل. بعد الحفظ، تتحوّل حالة الطلب إلى &quot;fulfilled&quot; ويستلم العميل بياناته فوراً.
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              👤 بريد / حساب العميل المستلم (تلقائي)
            </Label>
            <Input
              value={order.customer_email || username || order.customer_phone || "عميل المتجر"}
              readOnly
              disabled
              className="bg-muted/50 text-foreground cursor-not-allowed opacity-90 font-medium"
              dir="ltr"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              🔐 كلمة المرور / كود التفعيل
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة السر أو كود التفعيل (مثل: 555555)"
                dir="ltr"
                maxLength={255}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              🔗 رابط التفعيل (اختياري)
            </Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              maxLength={500}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              📋 بيانات إضافية (JSON اختياري)
            </Label>
            <p className="mb-2 text-[11px] text-muted-foreground/80">
              اتركه فارغاً، أو أدخل JSON object بصيغة:
              <code
                dir="ltr"
                className="mx-1 rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px]"
              >
                {'{"key":"value"}'}
              </code>
            </p>
            <Textarea
              value={extraJson}
              onChange={(e) => setExtraJson(e.target.value)}
              placeholder=""
              rows={5}
              dir="ltr"
              className="font-mono text-xs"
            />
            <details className="mt-1 cursor-pointer">
              <summary className="text-[11px] text-muted-foreground hover:text-foreground">
                💡 عرض مثال
              </summary>
              <pre
                dir="ltr"
                className="mt-1 rounded border border-border bg-muted/30 p-2 font-mono text-[10px]"
              >
{`{
  "device_limit": "2",
  "expires": "2027-05-23",
  "package": "premium"
}`}
              </pre>
            </details>
            {!jsonValidation.ok && (
              <p className="mt-1 text-xs font-bold text-destructive">⚠️ {jsonValidation.error}</p>
            )}
          </div>



          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={disabled}
              className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Gift className="h-4 w-4" />
              {mutation.isPending ? "جاري الحفظ…" : "حفظ وتسليم"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
