import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Smartphone, Eye, EyeOff } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/account",
    force: s.force === "1" || s.force === "true",
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session && !search.force) throw redirect({ to: search.redirect as never });
  },
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

// H.9: auto-detect email vs phone (supports all countries and Saudi local)
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhoneCandidate = (v: string) => {
  const cleaned = v.replace(/[\s\-()]/g, "");
  return /^(?:\+|00)?[1-9]\d{6,14}$/.test(cleaned) || /^(?:0)?5\d{8}$/.test(cleaned);
};

const schema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "أدخل البريد أو رقم الجوال")
    .refine(
      (v) => isEmail(v) || isPhoneCandidate(v),
      "أدخل بريداً صحيحاً أو رقم جوال مع مفتاح الدولة",
    ),
  password: z.string().min(6, "كلمة المرور قصيرة"),
});
type Vals = z.infer<typeof schema>;

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [identifierValue, setIdentifierValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !search.force) {
      navigate({ to: (search.redirect as string) || "/account", replace: true });
    }
  }, [user, search.redirect, search.force, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Vals>({ resolver: zodResolver(schema) });

  // UX hint — show when phone detected
  const showsPhoneHint =
    identifierValue.length > 0 && isPhoneCandidate(identifierValue) && !isEmail(identifierValue);

  const onSubmit = async (v: Vals) => {
    let emailToUse: string;

    if (isEmail(v.identifier)) {
      emailToUse = v.identifier.trim();
    } else if (isPhoneCandidate(v.identifier)) {
      try {
        const { data: email, error: lookupErr } = await supabase.rpc(
          "get_email_by_phone",
          { _phone: v.identifier.trim() },
        );
        if (lookupErr || !email) {
          toast.error("بيانات الدخول غير صحيحة (تأكد من رقم الجوال أو استخدم البريد الإلكتروني).");
          return;
        }
        emailToUse = email;
      } catch (err) {
        console.warn("[login] get_email_by_phone exception:", err);
        toast.error("تعذّر التحقق من رقم الجوال، يرجى تجربة البريد الإلكتروني.");
        return;
      }
    } else {
      toast.error("أدخل بريداً صحيحاً أو رقم جوال صالح");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: v.password,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("email not confirmed")) {
        toast.error("الحساب قيد التفعيل. حاول مرة أخرى أو تواصل مع الدعم.");
      } else if (
        msg.includes("invalid login credentials") ||
        msg.includes("invalid_credentials")
      ) {
        toast.error("بيانات الدخول غير صحيحة (تأكد من صحة البريد/الجوال وكلمة المرور).");
      } else if (msg.includes("database error") || msg.includes("schema")) {
        toast.error("حصل خطأ مؤقت في التحقق. يرجى تجربة تسجيل الدخول عبر البريد الإلكتروني مباشرة.");
      } else {
        toast.error(error.message || "بيانات الدخول غير صحيحة");
      }
      return;
    }
    toast.success("تم تسجيل الدخول بنجاح");
    navigate({ to: search.redirect as never });
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className="text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ background: "var(--gradient-gold)" }}
          >
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ادخل لإدارة طلباتك ومتابعة حالتها
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <div>
            <label className="mb-1 block text-xs font-bold">
              البريد أو رقم الجوال
            </label>
            <input
              {...register("identifier", {
                onChange: (e) => setIdentifierValue(e.target.value),
              })}
              type="text"
              autoComplete="username"
              dir="ltr"
              inputMode="email"
              className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-right outline-none focus:ring-2 focus:ring-ring"
              placeholder="name@example.com أو 05XXXXXXXX"
            />
            {errors.identifier && (
              <p className="mt-1 text-xs font-bold text-destructive">
                {errors.identifier.message}
              </p>
            )}
            {showsPhoneHint && !errors.identifier && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                <Smartphone className="h-3 w-3 text-accent" />
                تم التعرّف على رقم جوّال — سيُستخدم البريد المرتبط به للدخول
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">كلمة المرور</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                dir="ltr"
                className="block w-full rounded-lg border border-input bg-background py-2.5 pe-10 ps-3 text-right outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                aria-pressed={showPassword}
                tabIndex={-1}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs font-bold text-destructive">
                {errors.password.message}
              </p>
            )}
            <div className="mt-2 text-left">
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-accent hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary px-4 py-3 text-base font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          ليس لديك حساب؟{" "}
          <Link to="/register" className="font-black text-primary hover:underline">
            أنشئ حساباً جديداً
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}
