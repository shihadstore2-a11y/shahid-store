import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة — شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z
      .string()
      .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
      .max(72, "كلمة المرور طويلة جداً"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "كلمتا المرور غير متطابقتين",
  });
type Vals = z.infer<typeof schema>;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState<"checking" | "ready" | "missing">(
    "checking",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Vals>({ resolver: zodResolver(schema) });

  // Recovery flow: Supabase puts a recovery session in the URL hash and the
  // client SDK consumes it automatically, then fires PASSWORD_RECOVERY event.
  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessionReady("ready");
      }
    });

    // Initial check: if SDK already parsed the hash before we mounted
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setSessionReady("ready");
      } else {
        // Give the SDK 2s to consume the hash before giving up
        timeout = setTimeout(() => {
          if (!cancelled) {
            setSessionReady((s) => (s === "checking" ? "missing" : s));
          }
        }, 2000);
      }
    });

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (v: Vals) => {
    const { error } = await supabase.auth.updateUser({ password: v.password });
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("same") || msg.includes("different")) {
        toast.error("كلمة المرور الجديدة يجب أن تختلف عن السابقة");
      } else if (msg.includes("session") || msg.includes("token") || msg.includes("expired")) {
        toast.error("انتهت صلاحية رابط الاستعادة — اطلب رابطاً جديداً");
        setTimeout(() => navigate({ to: "/forgot-password" }), 2000);
      } else {
        toast.error("تعذّر تحديث كلمة المرور: " + error.message);
      }
      return;
    }
    toast.success("تم تحديث كلمة المرور ✓");
    setTimeout(() => navigate({ to: "/account" }), 1500);
  };

  if (sessionReady === "checking") {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="h-10 w-10 mx-auto animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            جارٍ التحقق من رابط الاستعادة...
          </p>
        </section>
      </SiteLayout>
    );
  }

  if (sessionReady === "missing") {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-8">
            <h1 className="text-xl font-black sm:text-2xl">رابط الاستعادة غير صالح</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              قد يكون الرابط منتهي الصلاحية أو تم استخدامه مسبقاً.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90"
            >
              طلب رابط استعادة جديد
            </Link>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className="text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ background: "var(--gradient-gold)" }}
          >
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">كلمة مرور جديدة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            اختر كلمة مرور قوية لا تقل عن 8 أحرف.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <div>
            <label className="mb-1 block text-xs font-bold">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                dir="ltr"
                className="block w-full rounded-lg border border-input bg-background py-2.5 pe-10 ps-3 text-right outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "إخفاء" : "إظهار"}
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
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">تأكيد كلمة المرور</label>
            <div className="relative">
              <input
                {...register("confirm")}
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                dir="ltr"
                className="block w-full rounded-lg border border-input bg-background py-2.5 pe-10 ps-3 text-right outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "إخفاء" : "إظهار"}
                tabIndex={-1}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirm && (
              <p className="mt-1 text-xs font-bold text-destructive">
                {errors.confirm.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            {isSubmitting ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
          </button>
        </form>
      </section>
    </SiteLayout>
  );
}
