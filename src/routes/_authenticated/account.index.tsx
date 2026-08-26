import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/")({
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير").max(80),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => {
        const cleaned = v.replace(/[\s\-()]/g, "");
        return /^(?:\+|00)?[1-9]\d{6,14}$/.test(cleaned) || /^(?:0)?5\d{8}$/.test(cleaned);
      },
      "يرجى إدخال رقم جوال صحيح مع رمز الدولة (مثل: +966500451602)",
    ),
});
type Vals = z.infer<typeof schema>;

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Vals>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", user.id)
          .maybeSingle();

        // فحص هل المستخدم لديه حساب إداري وجلب بياناته
        const { data: adminData } = await supabase
          .from("admin_users")
          .select("id, role, is_active, full_name, phone")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (adminData && !cancelled) {
          setIsAdmin(true);
        }

        if (cancelled) return;
        const metaName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "";
        const metaPhone = (user.user_metadata?.phone as string) || (user.phone as string) || "";

        const finalName = data?.full_name || adminData?.full_name || metaName || "";
        const finalPhone = data?.phone || adminData?.phone || metaPhone || "";

        reset({
          full_name: finalName,
          phone: finalPhone,
        });

        // مزامنة تلقائية لجدول profiles في حال وجود بيانات في metadata
        if (user.id && ((!data?.full_name && metaName) || (!data?.phone && metaPhone))) {
          supabase.from("profiles").upsert(
            {
              id: user.id,
              user_id: user.id,
              full_name: finalName,
              phone: finalPhone,
              email: user.email,
            },
            { onConflict: "user_id" },
          ).then(() => { });
        }
      } catch (e) {
        console.error("[account] unexpected error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, reset]);

  const onSubmit = async (v: Vals) => {
    if (!user) return;
    const cleanName = v.full_name.trim();
    const cleanPhone = v.phone.trim();

    // 1. تحديث بيانات المصادقة في Supabase Auth
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          phone: cleanPhone,
        },
      });
    } catch (authErr) {
      console.warn("[account] updateUser error:", authErr);
    }

    // 2. تحديث جدول profiles
    try {
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          phone: cleanPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updErr) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            user_id: user.id,
            full_name: cleanName,
            phone: cleanPhone,
            email: user.email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }
    } catch (profErr) {
      console.warn("[account] profiles write error:", profErr);
    }

    // 3. تحديث admin_users إن كان المشرف مسجلاً فيه
    try {
      await supabase
        .from("admin_users")
        .update({
          full_name: cleanName,
          phone: cleanPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } catch (adminErr) {
      console.warn("[account] admin_users update error (non-blocking):", adminErr);
    }

    toast.success("تم حفظ الملف الشخصي بنجاح");
    // claim guest orders
    try {
      await supabase.rpc("claim_orders_by_phone", { _phone: normalizePhone(v.phone) });
    } catch (e) {
      console.warn("[account] claim_orders_by_phone error:", e);
    }
  };

  if (loading) return <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">جارٍ التحميل...</div>;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg">👑</span>
            <div>
              <p className="text-sm font-black text-foreground">حساب إداري للمتجر</p>
              <p className="text-xs text-muted-foreground">أنت مسجّل بصلاحية إدارية في لوحة التحكم.</p>
            </div>
          </div>
          <Link
            to="/admin/dashboard"
            className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground hover:bg-primary/90 transition"
          >
            الانتقال للوحة الإدارة ⚡
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
      >
      <h2 className="text-lg font-black">الملف الشخصي</h2>
      <Field label="الاسم الكامل" error={errors.full_name?.message}>
        <input {...register("full_name")} className="inputx" autoComplete="name" />
      </Field>
      <Field label="رقم الجوال" error={errors.phone?.message}>
        <input {...register("phone")} dir="ltr" inputMode="tel" autoComplete="tel" placeholder="05xxxxxxxx" className="inputx text-right" />
      </Field>
      <Field label="البريد الإلكتروني">
        <input value={user?.email ?? ""} disabled dir="ltr" className="inputx text-right opacity-70" />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {isSubmitting ? "جارٍ الحفظ..." : "حفظ التغييرات"}
      </button>
      <style>{`.inputx{display:block;width:100%;border-radius:0.5rem;border:1px solid var(--input);background:var(--background);padding:0.625rem 0.75rem;font-size:0.875rem;color:var(--foreground);outline:none}.inputx:focus{box-shadow:0 0 0 2px var(--ring)}`}</style>
    </form>
    </div>
  );
}

function normalizePhone(p: string) {
  let s = p.trim().replace(/[\s\-()]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("00")) return "+" + s.slice(2);
  if (s.startsWith("05") && s.length === 10) return "+966" + s.slice(1);
  if (s.startsWith("5") && s.length === 9) return "+966" + s;
  return s.startsWith("+") ? s : "+" + s;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-foreground">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs font-bold text-destructive">{error}</p>}
    </label>
  );
}
