import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "استعادة كلمة المرور — شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "أدخل بريدك الإلكتروني")
    .email("بريد إلكتروني غير صحيح")
    .max(255),
});
type Vals = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<Vals>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Vals) => {
    const email = v.email.trim().toLowerCase();
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const centralRelay = "https://shahidstore.net/auth/callback";
    
    // إذا كان الطلب من نطاق مختلف عن المنصة الرئيسية، يمر عبر بوابة المصادقة المركزية لنقله لمتجره فوراً
    const redirectUrl = (currentOrigin && !currentOrigin.includes("shahidstore.net"))
      ? `${centralRelay}?return_to=${encodeURIComponent(`${currentOrigin}/reset-password`)}`
      : `${centralRelay}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("rate") || msg.includes("limit") || msg.includes("seconds")) {
        toast.error("الرجاء الانتظار قليلاً قبل إعادة المحاولة");
      } else {
        toast.error("تعذّر إرسال رابط الاستعادة، حاول لاحقاً");
      }
      return;
    }

    setSent(true);
    toast.success("تم إرسال رابط الاستعادة لبريدك ✉️");
    setTimeout(() => {
      navigate({ to: "/login", search: { redirect: "/account", force: false } });
    }, 3000);
  };

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
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">استعادة كلمة المرور</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.
          </p>
        </div>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-6 text-center shadow-[var(--shadow-card)]">
            <Mail className="mx-auto h-10 w-10 text-emerald-400" />
            <h2 className="mt-3 text-base font-black">تحقَّق من بريدك</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              أرسلنا رابطاً إلى{" "}
              <bdi dir="ltr" className="font-bold text-foreground">
                {getValues("email")}
              </bdi>
              . اضغط الرابط داخل الرسالة لإعادة تعيين كلمة المرور.
            </p>
            <p className="mt-3 text-[11px] text-muted-foreground/80">
              لم تجد الرسالة؟ تحقَّق من مجلد <bdi>«Spam»</bdi>.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              ستعود لصفحة الدخول خلال 3 ثوانٍ...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
          >
            <div>
              <label className="mb-1 block text-xs font-bold">البريد الإلكتروني</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                dir="ltr"
                inputMode="email"
                className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-right outline-none focus:ring-2 focus:ring-ring"
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-bold text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary px-4 py-3 text-base font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm">
          <Link
            to="/login"
            search={{ redirect: "/account", force: false }}
            className="inline-flex items-center gap-1 font-black text-primary hover:underline"
          >
            <ArrowRight className="h-4 w-4" />
            العودة لتسجيل الدخول
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}
