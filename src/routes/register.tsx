import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PhoneInputIntl } from "@/components/forms/PhoneInputIntl";
import { E164_REGEX, toE164 } from "@/lib/phone-intl";

// H.5: prefill from checkout — low-PII fields via URL (phone uses sessionStorage)
const prefillSchema = z.object({
  email: fallback(z.string().email(), "").default(""),
  full_name: fallback(z.string().max(80), "").default(""),
});

export const Route = createFileRoute("/register")({
  validateSearch: zodValidator(prefillSchema),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/account" });
  },
  head: () => ({
    meta: [
      { title: "إنشاء حساب — شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

// J.1 ACTIVATED 28 May 2026 — E.164 international phone.
const E164Phone = z.string().trim().regex(E164_REGEX, "رقم الجوال غير صحيح");

const schema = z
  .object({
    full_name: z.string().trim().min(2, "الاسم قصير").max(80),
    phone: E164Phone,
    email: z.string().trim().email("بريد غير صحيح"),
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "كلمة المرور غير متطابقة",
    path: ["confirm"],
  });
type Vals = z.infer<typeof schema>;

function RegisterPage() {
  // H.5: prefill from checkout — email + full_name via URL, phone via sessionStorage
  const sp = Route.useSearch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phoneInitial, setPhoneInitial] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Vals>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: sp.full_name || "",
      email: sp.email || "",
      phone: "",
      password: "",
      confirm: "",
    },
  });

  // H.5: read phone from sessionStorage (one-shot, deleted after read for privacy)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("h5_prefill_phone");
      if (!stored) return;
      sessionStorage.removeItem("h5_prefill_phone");
      const e164 = toE164(stored, "SA");
      if (!e164) return;
      setPhoneInitial(e164);
      setPhoneValid(true);
      setValue("phone", e164, { shouldValidate: true });
    } catch {
      // sessionStorage unavailable (private mode) — silent degraded UX
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (v: Vals) => {
    if (!E164_REGEX.test(v.phone)) {
      toast.error("صيغة الجوّال غير صحيحة");
      return;
    }
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: v.email.trim(),
      password: v.password,
      options: {
        emailRedirectTo: window.location.origin + "/account",
        data: { full_name: v.full_name.trim(), phone: v.phone.trim() },
      },
    });

    if (signUpErr) {
      const msg = (signUpErr.message || "").toLowerCase();
      const code = (signUpErr as { code?: string }).code || "";

      if (
        msg.includes("weak_password") ||
        msg.includes("pwned") ||
        msg.includes("compromised") ||
        code === "weak_password"
      ) {
        toast.error("كلمة المرور ضعيفة. اختر كلمة أقوى (8+ أحرف، أرقام ورموز).");
      } else if (
        msg.includes("already") ||
        msg.includes("registered") ||
        code === "user_already_exists"
      ) {
        toast.error("هذا البريد مسجَّل مسبقاً. جاري تحويلك لتسجيل الدخول...");
        setTimeout(() => navigate({ to: "/login" }), 1500);
      } else if (
        msg.includes("rate") ||
        msg.includes("too many") ||
        code === "over_request_rate_limit"
      ) {
        toast.error("محاولات كثيرة. انتظر دقيقة وحاول مرّة أخرى.");
      } else if (msg.includes("invalid") && msg.includes("email")) {
        toast.error("البريد الإلكتروني غير صحيح.");
      } else {
        toast.error(signUpErr.message || "تعذّر إنشاء الحساب. حاول مرّة أخرى.");
      }
      return;
    }

    // تسجيل الدخول المباشر فوراً لإنشاء الجلسة في المتصفح
    try {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: v.email.trim(),
        password: v.password,
      });

      if (signInData?.session) {
        toast.success("تم إنشاء الحساب وتسجيل الدخول بنجاح 🎉");
        navigate({ to: "/account" });
        return;
      }
    } catch (e) {
      console.warn("[Register] auto-login fallback:", e);
    }

    toast.success("تم إنشاء حسابك بنجاح");
    navigate({ to: "/account" });
  };


  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className="text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ background: "var(--gradient-gold)" }}
          >
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">إنشاء حساب</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أنشئ حسابك لمتابعة طلباتك بسهولة
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <Field label="الاسم الكامل" error={errors.full_name?.message}>
            <input {...register("full_name")} className="inputx" autoComplete="name" />
          </Field>
          {/* J.1 — International phone (activated 28 May 2026) */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-foreground">رقم الجوال</span>
            <PhoneInputIntl
              value={phoneInitial}
              onChange={(e164, meta) => {
                setPhoneValid(meta.valid);
                setValue("phone", e164, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              invalid={!!errors.phone}
            />
            {errors.phone && <p className="mt-1 text-xs font-bold text-destructive">{errors.phone.message}</p>}
          </label>
          <Field label="البريد الإلكتروني" error={errors.email?.message}>
            <input {...register("email")} type="email" dir="ltr" autoComplete="email" className="inputx text-right" />
          </Field>
          <Field label="كلمة المرور" error={errors.password?.message}>
            <PasswordInput
              {...register("password")}
              autoComplete="new-password"
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
          </Field>
          <Field label="تأكيد كلمة المرور" error={errors.confirm?.message}>
            <PasswordInput
              {...register("confirm")}
              autoComplete="new-password"
              show={showConfirm}
              onToggle={() => setShowConfirm((s) => !s)}
            />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary px-4 py-3 text-base font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
          </button>


          <style>{`.inputx{display:block;width:100%;border-radius:0.5rem;border:1px solid var(--input);background:var(--background);padding:0.625rem 0.75rem;font-size:0.875rem;color:var(--foreground);outline:none}.inputx:focus{box-shadow:0 0 0 2px var(--ring)}`}</style>
        </form>

        <p className="mt-4 text-center text-sm">
          لديك حساب؟{" "}
          <Link to="/login" search={{ redirect: "/account", force: false }} className="font-black text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-foreground">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs font-bold text-destructive">{error}</p>}
    </label>
  );
}

const PasswordInput = (() => {
  const Cmp = (
    {
      show,
      onToggle,
      ...props
    }: React.InputHTMLAttributes<HTMLInputElement> & {
      show: boolean;
      onToggle: () => void;
    },
    ref: React.Ref<HTMLInputElement>,
  ) => (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={show ? "text" : "password"}
        dir="ltr"
        className="inputx pe-10 text-right"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
  return React.forwardRef(Cmp);
})();


