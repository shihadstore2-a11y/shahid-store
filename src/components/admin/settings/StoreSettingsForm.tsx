import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Bot, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveStoreSettings,
  storeSettingsAdminQueryOptions,
  type StoreSettings,
} from "@/lib/admin-settings";
import { validateSaudiPhone, formatPhoneForDisplay } from "@/lib/whatsapp";

export function StoreSettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(storeSettingsAdminQueryOptions());
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof StoreSettings, string>>>({});

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const m = useMutation({
    mutationFn: saveStoreSettings,
    onSuccess: async () => {
      toast.success("تم حفظ إعدادات المتجر بنجاح ✨");
      await qc.invalidateQueries({ queryKey: ["admin", "store-settings"] });
      await qc.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !form) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
      </div>
    );
  }

  const validate = (): { ok: boolean; normalized: StoreSettings } => {
    const next: typeof errors = {};
    const normalized = { ...form };
    if (form.storeName.trim().length < 2) next.storeName = "الاسم قصير جداً";

    const phoneRes = validateSaudiPhone(form.whatsappNumber);
    if (!phoneRes.valid) {
      next.whatsappNumber = phoneRes.error;
    } else {
      normalized.whatsappNumber = phoneRes.cleaned;
    }

    if (form.officialEmail && !/^\S+@\S+\.\S+$/.test(form.officialEmail))
      next.officialEmail = "إيميل غير صحيح";
    setErrors(next);
    return { ok: Object.keys(next).length === 0, normalized };
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, normalized } = validate();
    if (!ok) return;
    setForm(normalized);
    m.mutate(normalized);
  };

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) =>
    setForm((p) => (p ? { ...p, [k]: v } : p));

  const phonePreview = (() => {
    const r = validateSaudiPhone(form.whatsappNumber);
    return r.valid ? formatPhoneForDisplay(r.cleaned) : null;
  })();

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-6">
      {/* 1. معلومات المتجر الأساسية */}
      <div>
        <div className="mb-1">
          <h3 className="text-lg font-black text-foreground">معلومات المتجر</h3>
          <p className="text-xs text-muted-foreground">تظهر للعملاء وفي رسائل التواصل والتنبيهات</p>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="اسم المتجر" error={errors.storeName}>
            <Input value={form.storeName} onChange={(e) => set("storeName", e.target.value)} />
          </Field>

          <Field
            label="رقم WhatsApp الرسمي للمتجر"
            error={errors.whatsappNumber}
            hint="يقبل 966500451602 أو 0500451602"
          >
            <Input
              dir="ltr"
              value={form.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
            />
            {phonePreview && !errors.whatsappNumber && (
              <p className="text-xs text-muted-foreground" dir="ltr">
                📞 {phonePreview}
              </p>
            )}
          </Field>

          <Field label="الإيميل الرسمي (اختياري)" error={errors.officialEmail}>
            <Input
              dir="ltr"
              type="email"
              placeholder="info@ksa-tv.com"
              value={form.officialEmail}
              onChange={(e) => set("officialEmail", e.target.value)}
            />
          </Field>

          <Field label="قناة تيليجرام (اختياري)">
            <Input
              dir="ltr"
              placeholder="@channel_name"
              value={form.telegramChannel}
              onChange={(e) => set("telegramChannel", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* 2. إعدادات بوت واتساب مؤتمت (Moatmt Bot) واستعادة السلات المتروكة */}
      <div className="pt-4 border-t border-border/60">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-black text-foreground">🤖 إعدادات بوت واتساب مؤتمت (Moatmt Bot) والسلات المتروكة</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          التحكم الكامل في رسائل السلات المتروكة، تنبيهات الإدارة، طلبات التقييم، وكوبونات الاسترجاع.
        </p>

        <div className="space-y-4">
          <Field
            label="أرقام واتساب الإدارة لاستقبال إشعارات الطلبات الجديدة"
            hint="اكتب الأرقام مفصولة بفاصلة (مثال: 966500000000, 966555555555)"
          >
            <Input
              dir="ltr"
              placeholder="966500000000, 966555555555"
              value={form.moatmtAdminPhones ?? ""}
              onChange={(e) => set("moatmtAdminPhones", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="وقت إرسال رسالة السلة المتروكة للعميل (بالساعات) ⏳"
              hint="عدد الساعات بعد بدء العميل للطلب وعدم الدفع قبل إرسال الرسالة له (مثلاً 1 ساعة، 2 ساعة، أو 0.5 لنصف ساعة)"
            >
              <Input
                dir="ltr"
                type="number"
                step="0.25"
                min="0.1"
                placeholder="1"
                value={form.moatmtAbandonedDelayHours ?? "1"}
                onChange={(e) => set("moatmtAbandonedDelayHours", e.target.value)}
              />
            </Field>

            <Field
              label="وقت إرسال طلب التقييم بعد تسليم الاشتراك (بالساعات) ⭐"
              hint="عدد الساعات بعد تسليم الطلب للعميل قبل إرسال رابط تقييم المنتج له (افتراضياً 2 ساعة)"
            >
              <Input
                dir="ltr"
                type="number"
                step="0.5"
                min="0.1"
                placeholder="2"
                value={form.moatmtReviewDelayHours ?? "2"}
                onChange={(e) => set("moatmtReviewDelayHours", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="كود الخصم الحصري في رسالة استعادة السلة 🎁"
              hint="الكود الترويجي الذي يُرسل للعميل لتحفيزه على إكمال الشراء (افتراضياً: DIWAN10)"
            >
              <Input
                dir="ltr"
                placeholder="DIWAN10"
                value={form.moatmtDiscountCode ?? "DIWAN10"}
                onChange={(e) => set("moatmtDiscountCode", e.target.value.toUpperCase())}
              />
            </Field>

            <Field
              label="نسبة الخصم المئوية المذكورة في الرسالة (٪)"
              hint="نسبة الخصم التي تظهر بنص الرسالة (مثلاً: 10 أو 15)"
            >
              <Input
                dir="ltr"
                type="number"
                min="1"
                max="100"
                placeholder="10"
                value={form.moatmtDiscountPercent ?? "10"}
                onChange={(e) => set("moatmtDiscountPercent", e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="رابط صورة رسالة السلات المتروكة (تلقائي / واتساب)"
            hint="رابط عام للصورة المرفقة مع الرسالة (افتراضياً: https://ksa-tv.com/images/abandoned-orders.png أو رابط من Supabase Storage)"
          >
            <Input
              dir="ltr"
              placeholder="https://ksa-tv.com/images/abandoned-orders.png"
              value={form.moatmtAbandonedImageUrl ?? ""}
              onChange={(e) => set("moatmtAbandonedImageUrl", e.target.value)}
            />
          </Field>

          <Field
            label="رابط صورة رسالة التقييم (اختياري - مخصصة)"
            hint="رابط صورة عام مرفق بطلب التقييم (افتراضياً: https://ksa-tv.com/images/review-banner.png)"
          >
            <Input
              dir="ltr"
              placeholder="https://ksa-tv.com/images/review-banner.png"
              value={form.moatmtReviewImageUrl ?? ""}
              onChange={(e) => set("moatmtReviewImageUrl", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* 3. أكواد التتبع والبكسلات الإعلانية */}
      <div className="pt-4 border-t border-border/60">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-black text-foreground">🎯 إعدادات أكواد التتبع والبكسلات الإعلانية (SEO & Pixels)</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          أدخل المعرفات فقط للمنصات التي تريد تفعيلها. سيتم تتبع الزيارات وعمليات الشراء وأحداث المتجر بدقة وتلقائياً.
        </p>

        <div className="space-y-4">
          <Field
            label="رمز التحقق من محرك بحث جوجل (Google Search Console)"
            hint="انسخ كود التحقق من وسم HTML Meta tag فقط (مثل: aBcD1234EfGh...)"
          >
            <Input
              dir="ltr"
              placeholder="abc123xyz-verification-code"
              value={form.googleSiteVerification ?? ""}
              onChange={(e) => set("googleSiteVerification", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Google Tag Manager (GTM)" hint="معرف الحاوية (مثال: GTM-XXXXXXX)">
              <Input
                dir="ltr"
                placeholder="GTM-XXXXXXX"
                value={form.gtmId ?? ""}
                onChange={(e) => set("gtmId", e.target.value)}
              />
            </Field>

            <Field label="Google Analytics 4 (GA4)" hint="معرف القياس (مثال: G-XXXXXXXXXX)">
              <Input
                dir="ltr"
                placeholder="G-XXXXXXXXXX"
                value={form.ga4MeasurementId ?? ""}
                onChange={(e) => set("ga4MeasurementId", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="إعلانات جوجل (Google Ads ID)" hint="معرف تحويلات إعلانات جوجل (مثال: AW-XXXXXXXXXX)">
              <Input
                dir="ltr"
                placeholder="AW-XXXXXXXXXX"
                value={form.googleAdsId ?? ""}
                onChange={(e) => set("googleAdsId", e.target.value)}
              />
            </Field>

            <Field label="تسمية تحويل الشراء (Purchase Conversion Label)" hint="تسمية التحويل لحدث الشراء في Google Ads">
              <Input
                dir="ltr"
                placeholder="مثال: AbCdEfGhIjK"
                value={form.googleAdsPurchaseLabel ?? ""}
                onChange={(e) => set("googleAdsPurchaseLabel", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="بكسل فيسبوك / ميتا (Meta Pixel ID)" hint="معرف البكسل الرقمي (مثال: 123456789012345)">
              <Input
                dir="ltr"
                placeholder="123456789012345"
                value={form.metaPixelId ?? ""}
                onChange={(e) => set("metaPixelId", e.target.value)}
              />
            </Field>

            <Field label="بكسل سناب شات (Snapchat Pixel ID)" hint="معرف البكسل الخاص بسناب شات (UUID)">
              <Input
                dir="ltr"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.snapchatPixelId ?? ""}
                onChange={(e) => set("snapchatPixelId", e.target.value)}
              />
            </Field>
          </div>

          <Field label="بكسل تيك توك (TikTok Pixel ID - اختياري)" hint="معرف بكسل تيك توك (مثال: C1234567890ABCDEF)">
            <Input
              dir="ltr"
              placeholder="C1234567890ABCDEF"
              value={form.tiktokPixelId ?? ""}
              onChange={(e) => set("tiktokPixelId", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={m.isPending} className="gap-2 font-bold px-6">
          <Save className="h-4 w-4" />
          {m.isPending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-foreground">{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
