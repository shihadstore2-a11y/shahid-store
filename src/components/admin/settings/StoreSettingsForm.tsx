import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
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
      toast.success("تم حفظ إعدادات المتجر");
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
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-1">
        <h3 className="text-lg font-black">معلومات المتجر</h3>
        <p className="text-xs text-muted-foreground">تظهر للعملاء وفي رسائل التواصل</p>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="اسم المتجر" error={errors.storeName}>
          <Input value={form.storeName} onChange={(e) => set("storeName", e.target.value)} />
        </Field>

        <Field
          label="رقم WhatsApp الرسمي"
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
            placeholder="info@shahidstore.net"
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

        <Button type="submit" disabled={m.isPending} className="gap-2">
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
      <Label className="text-sm font-bold">{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
