import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: admin } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", data.session.user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (admin) throw redirect({ to: "/admin/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "دخول الإدارة — شاهد ستور" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

const schema = z.object({
  email: z.string().trim().email("بريد غير صحيح"),
  password: z.string().min(6, "كلمة المرور قصيرة"),
});
type Vals = z.infer<typeof schema>;

function AdminLoginPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Vals>({ resolver: zodResolver(schema) });

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  };

  const onSubmit = async (v: Vals) => {
    setSubmitting(true);
    try {
      const { data: signIn, error } = await supabase.auth.signInWithPassword(v);
      if (error || !signIn.user) {
        const msg = error?.message?.toLowerCase() || "";
        if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
          toast.error("البريد أو كلمة المرور غير صحيحة");
        } else if (msg.includes("email not confirmed")) {
          toast.error("البريد لم يتم تأكيده بعد");
        } else if (msg.includes("too many requests") || msg.includes("rate limit")) {
          toast.error("محاولات كثيرة جداً، انتظر دقيقة وحاول مرة أخرى");
        } else if (msg.includes("network") || msg.includes("fetch")) {
          toast.error("لا يوجد اتصال بالإنترنت، تحقق من الشبكة");
        } else {
          toast.error("حدث خطأ غير متوقع. تواصل مع الدعم الفني.");
          console.error("Login error:", error);
        }
        return;
      }
      if (typeof window !== "undefined") {
        if (rememberMe) {
          localStorage.setItem("admin_remember_me", "true");
          sessionStorage.removeItem("admin_session_tab");
        } else {
          localStorage.removeItem("admin_remember_me");
          // علامة هذا التبويب — تُمسح تلقائياً عند إغلاق المتصفح
          sessionStorage.setItem("admin_session_tab", "1");
        }
      }
      const { data: admin } = await supabase
        .from("admin_users")
        .select("id, is_active")
        .eq("user_id", signIn.user.id)
        .maybeSingle();
      if (!admin || !admin.is_active) {
        await supabase.auth.signOut();
        toast.error("ليس لديك صلاحية الدخول إلى لوحة الإدارة");
        return;
      }
      // update last_login_at + audit
      await supabase
        .from("admin_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", admin.id);
      await supabase.rpc("log_admin_action", {
        _action: "login",
        _entity_type: "admin_user",
        _entity_id: admin.id,
        _changes: {},
      });
      // ضمان حفظ الـ session في localStorage قبل التحويل
      await supabase.auth.getSession();
      toast.success("تم الدخول إلى لوحة الإدارة");
      // client-side navigation — يحافظ على session في localStorage
      await navigate({ to: "/admin/dashboard" });
      return;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ background: "var(--primary)" }}
          >
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">دخول الإدارة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            هذه الصفحة مخصصة للمشرفين فقط
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-xs font-bold">البريد الإلكتروني</label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              dir="ltr"
              className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-right outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs font-bold text-destructive">{errors.email.message}</p>
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
                onKeyUp={handleKeyEvent}
                onKeyDown={handleKeyEvent}
                className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 pl-10 text-right outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs font-bold text-destructive">{errors.password.message}</p>
            )}
            {capsLockOn && (
              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                Caps Lock مفعّل
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember_me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-input accent-primary"
            />
            <label
              htmlFor="remember_me"
              className="cursor-pointer select-none text-sm font-medium text-foreground"
            >
              تذكرني (إبقاء الجلسة مفتوحة)
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary px-4 py-3 text-base font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          لست مشرفاً؟{" "}
          <Link to="/" className="font-bold text-primary hover:underline">
            العودة للموقع
          </Link>
        </p>
      </div>
    </div>
  );
}
