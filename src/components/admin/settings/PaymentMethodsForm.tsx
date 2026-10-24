import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, MessageCircle, Truck, Save, Loader2, ShieldCheck, CheckCircle2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  paymentMethodsConfigQueryOptions,
  savePaymentMethodsConfig,
  type PaymentMethodsConfig,
  DEFAULT_PAYMENT_METHODS,
} from "@/lib/admin-settings";

export function PaymentMethodsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(paymentMethodsConfigQueryOptions());
  const [config, setConfig] = useState<PaymentMethodsConfig>(DEFAULT_PAYMENT_METHODS);

  useEffect(() => {
    if (data) {
      setConfig(data);
    }
  }, [data]);

  const saveM = useMutation({
    mutationFn: savePaymentMethodsConfig,
    onSuccess: async () => {
      toast.success("تم حفظ إعدادات طرق الدفع بنجاح");
      await qc.invalidateQueries({ queryKey: ["admin", "payment-methods-config"] });
    },
    onError: (e: Error) => toast.error(e.message || "فشل حفظ إعدادات طرق الدفع"),
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 0. Network International (N-Genius KSA) Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">بوابة N-Genius Network International</h3>
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-400">
                  N-Genius
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                قبول مدفوعات البطاقات البنكية ومدى وApple Pay عبر شبكة Network International
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ngenius-enabled" className="text-xs font-bold text-muted-foreground">
              {config.ngenius?.enabled ? "مُفعَّلة" : "معطَّلة"}
            </Label>
            <Switch
              id="ngenius-enabled"
              checked={Boolean(config.ngenius?.enabled)}
              onCheckedChange={(val) =>
                setConfig((prev) => ({
                  ...prev,
                  ngenius: { ...(prev.ngenius || DEFAULT_PAYMENT_METHODS.ngenius), enabled: val },
                }))
              }
            />
          </div>
        </div>

        {config.ngenius?.enabled && (
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="ngenius-test" className="text-sm font-bold">
                  وضع الاختبار (Sandbox / Test Mode)
                </Label>
                <Switch
                  id="ngenius-test"
                  checked={config.ngenius?.testMode}
                  onCheckedChange={(val) =>
                    setConfig((prev) => ({
                      ...prev,
                      ngenius: { ...(prev.ngenius || DEFAULT_PAYMENT_METHODS.ngenius), testMode: val },
                    }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {config.ngenius?.testMode ? (
                  <>
                    البوابة تعمل حالياً بوضع الاختبار (UAT Sandbox) التجريبي:
                    <br />
                    <code className="text-[11px] text-amber-400 font-mono">https://api-gateway-uat.ngenius-payments.com</code>
                  </>
                ) : (
                  <>
                    البوابة تعمل بالوضع المباشر (Live Production) لمعالجة المدفوعات الحقيقية:
                    <br />
                    <code className="text-[11px] text-purple-300 font-mono">https://api-gateway.ksa.ngenius-payments.com</code>
                  </>
                )}
              </p>
            </div>

            {config.ngenius?.testMode ? (
              <div className="sm:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2.5">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-amber-300">بيانات بيئة الاختبار التجريبية (UAT Sandbox)</h4>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                    بيانات تجريبية غير حساسة
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  هذه البيانات خاصة ببيئة الاختبار التجريبية (Sandbox) ولا تسحب أي أموال حقيقية. يمكنك استخدام المفاتيح الافتراضية أو تعديلها لاختبار الدفع.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="ngenius-uat-api-key" className="text-xs font-bold">
                      مفتاح API التجريبي (UAT API Key)
                    </Label>
                    <Input
                      id="ngenius-uat-api-key"
                      type="text"
                      placeholder="OTQyMzI4MWQtNzlhOC00MDE4LWIzOWMtNGYxYmIxZTA1Zjkz..."
                      dir="ltr"
                      value={config.ngenius?.uatApiKey || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          ngenius: { ...(prev.ngenius || DEFAULT_PAYMENT_METHODS.ngenius), uatApiKey: e.target.value.trim() },
                        }))
                      }
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ngenius-uat-outlet-id" className="text-xs font-bold">
                      معرّف المنفذ التجريبي (UAT Outlet ID)
                    </Label>
                    <Input
                      id="ngenius-uat-outlet-id"
                      type="text"
                      placeholder="1b6c1ea9-4a87-495e-8ff4-963d6f835dd9"
                      dir="ltr"
                      value={config.ngenius?.uatOutletId || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          ngenius: { ...(prev.ngenius || DEFAULT_PAYMENT_METHODS.ngenius), uatOutletId: e.target.value.trim() },
                        }))
                      }
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ngenius-uat-mid" className="text-xs font-bold">
                      معرّف التاجر التجريبي (UAT MID - اختياري)
                    </Label>
                    <Input
                      id="ngenius-uat-mid"
                      type="text"
                      placeholder="202250910001"
                      dir="ltr"
                      value={config.ngenius?.uatMid || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          ngenius: { ...(prev.ngenius || DEFAULT_PAYMENT_METHODS.ngenius), uatMid: e.target.value.trim() },
                        }))
                      }
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-emerald-300">
                    بيانات الإنتاج المباشر محمية في Cloudflare 🔒
                  </h4>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    مفتاح الدفع الحي السري (Live API Key) محفوظ في{" "}
                    <span className="text-foreground font-semibold">Cloudflare Worker Secrets</span> عبر المتغيرات:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                    <span className="rounded-md bg-background px-2.5 py-1 border border-border text-emerald-400 font-bold">
                      NGENIUS_API_KEY 🔒
                    </span>
                    <span className="rounded-md bg-background px-2.5 py-1 border border-border text-emerald-400 font-bold">
                      NGENIUS_OUTLET_ID 🔒
                    </span>
                    <span className="rounded-md bg-background px-2.5 py-1 border border-border text-emerald-400 font-bold">
                      NGENIUS_WEBHOOK_SECRET 🔒
                    </span>
                  </div>
                  <div className="pt-1 text-[11px] text-muted-foreground">
                    نقطة النهاية للإنتاج الحي:{" "}
                    <code className="text-emerald-300 font-mono">https://api-gateway.ksa.ngenius-payments.com</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Edfapay Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">بوابة ادفع باي - Edfapay</h3>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-black text-blue-400">
                  Edfapay
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                قبول الدفع بالبطاقات الائتمانية وبطاقات مدى والمحافظ الإلكترونية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="edfapay-enabled" className="text-xs font-bold text-muted-foreground">
              {config.edfapay.enabled ? "مُفعَّلة" : "معطَّلة"}
            </Label>
            <Switch
              id="edfapay-enabled"
              checked={config.edfapay.enabled}
              onCheckedChange={(val) =>
                setConfig((prev) => ({
                  ...prev,
                  edfapay: { ...prev.edfapay, enabled: val },
                }))
              }
            />
          </div>
        </div>

        {config.edfapay.enabled && (
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="edfapay-test" className="text-sm font-bold">
                  وضع الاختبار (Sandbox / Test Mode)
                </Label>
                <Switch
                  id="edfapay-test"
                  checked={config.edfapay.testMode}
                  onCheckedChange={(val) =>
                    setConfig((prev) => ({
                      ...prev,
                      edfapay: { ...prev.edfapay, testMode: val },
                    }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {config.edfapay.testMode
                  ? "البوابة تعمل حالياً بوضع الاختبار ولا تسحب مبالغ حقيقية."
                  : "البوابة تعمل بالوضع المباشر (Live) لمعالجة المدفوعات الحقيقية."}
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-2.5 text-xs text-blue-300">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              <span>
                يتم إدارة مفاتيح الربط وسرية بوابة ادفع باي عبر إعدادات بيئة Cloudflare المشفرة (EDFAPAY_API_KEY) لضمان أقصى درجات الأمان المالي.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. WhatsApp Order Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">الطلب المباشر عبر واتساب (WhatsApp Order)</h3>
              <p className="text-xs text-muted-foreground">
                يتيح للعميل تأكيد الطلب وإرسال تفاصيله مباشرة لرقم المتجر مع عدم تحصيل أي رسوم إضافية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="whatsapp-enabled" className="text-xs font-bold text-muted-foreground">
              {config.whatsapp.enabled ? "مُفعَّلة" : "معطَّلة"}
            </Label>
            <Switch
              id="whatsapp-enabled"
              checked={config.whatsapp.enabled}
              onCheckedChange={(val) =>
                setConfig((prev) => ({
                  ...prev,
                  whatsapp: { ...prev.whatsapp, enabled: val },
                }))
              }
            />
          </div>
        </div>

        {config.whatsapp.enabled && (
          <div className="space-y-4 pt-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number" className="text-sm font-bold">
                  رقم الواتساب المستلم للطلبات
                </Label>
                <Input
                  id="whatsapp-number"
                  value={config.whatsapp.number}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      whatsapp: { ...prev.whatsapp, number: e.target.value },
                    }))
                  }
                  placeholder="966500451602"
                  dir="ltr"
                  className="font-mono text-left"
                />
                <p className="text-xs text-muted-foreground">
                  أدخل الرقم بالصيغة الدولية بدون علامة + (مثال: 966500451602)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-note" className="text-sm font-bold">
                  ملاحظة إرشادية تظهر للعميل في صفحة الدفع
                </Label>
                <Input
                  id="whatsapp-note"
                  value={config.whatsapp.customNote}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      whatsapp: { ...prev.whatsapp, customNote: e.target.value },
                    }))
                  }
                  placeholder="إرسال تفاصيل الطلب مباشرة عبر واتساب للمتجر للاستلام السريع"
                />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>
                عند اختيار العميل لهذه الوسيلة: يتم تسجيل الطلب تلقائياً في المتجر، وتوليد رسالة واتساب جاهزة بكامل بيانات الطلب (رقم الطلب، اسم العميل، المنتج، الكوبون، والإجمالي)، مع فتح الواتساب وتحويل العميل فوراً لصفحة نجاح الطلب.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Cash on Delivery (COD) Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">الدفع عند الاستلام (Cash on Delivery)</h3>
              <p className="text-xs text-muted-foreground">
                السماح بالدفع بعد الاستلام دون فرض أي رسوم إضافية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="cod-enabled" className="text-xs font-bold text-muted-foreground">
              {config.cod.enabled ? "مُفعَّلة" : "معطَّلة"}
            </Label>
            <Switch
              id="cod-enabled"
              checked={config.cod.enabled}
              onCheckedChange={(val) =>
                setConfig((prev) => ({
                  ...prev,
                  cod: { ...prev.cod, enabled: val },
                }))
              }
            />
          </div>
        </div>

        {config.cod.enabled && (
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <Label htmlFor="cod-instructions" className="text-sm font-bold">
                تعليمات الدفع عند الاستلام المعروضة للعميل
              </Label>
              <Textarea
                id="cod-instructions"
                rows={2}
                value={config.cod.instructions}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    cod: { ...prev.cod, instructions: e.target.value },
                  }))
                }
                placeholder="الدفع عند الاستلام — بدون أي رسوم إضافية"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => saveM.mutate(config)}
          disabled={saveM.isPending}
          className="gap-2 font-bold px-6"
        >
          {saveM.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          حفظ إعدادات طرق الدفع
        </Button>
      </div>
    </div>
  );
}
