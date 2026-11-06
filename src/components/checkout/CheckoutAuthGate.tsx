import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutAuthMode = "new" | "returning";

type Props = {
  /** هل المستخدم مسجّل دخوله بالفعل */
  isLoggedIn: boolean;
  /** بريد المستخدم المسجّل (لعرضه في الحالة 1) */
  loggedInEmail?: string | null;
  /** هل البريد المُدخل في النموذج صالح — حقل كلمة المرور يظهر فقط بعد ذلك */
  emailValid: boolean;
  /** قيمة كلمة المرور (مُدارة من الأب عبر RHF) */
  password: string;
  onPasswordChange: (value: string) => void;
  /** رسالة خطأ كلمة المرور من RHF */
  passwordError?: string;
  /** وضع المصادقة: جديد أو عائد */
  mode: CheckoutAuthMode;
  onModeChange: (mode: CheckoutAuthMode) => void;
};

/**
 * Option A — بوابة المصادقة داخل الدفع (28 May 2026).
 * 3 حالات: مسجّل / زائر جديد (افتراضي) / زائر عائد.
 * auto-confirm مُفعّل → signUp يُنشئ session فوري → الدفع سلس.
 */
export function CheckoutAuthGate({
  isLoggedIn,
  loggedInEmail,
  emailValid,
  password,
  onPasswordChange,
  passwordError,
  mode,
  onModeChange,
}: Props) {
  const [show, setShow] = useState(false);

  // STATE 1 — مسجّل دخول
  if (isLoggedIn) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-300">
              أنت مسجَّل دخولك — سيُحفظ هذا الطلب تلقائياً في حسابك
            </p>
            {loggedInEmail && (
              <p dir="ltr" className="truncate text-right text-xs text-emerald-400/80">
                {loggedInEmail}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isReturning = mode === "returning";

  return (
    <div className="rounded-2xl border border-accent/40 bg-card p-4 shadow-[var(--shadow-card)] md:p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          {isReturning ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
        </span>
        <div>
          <h2 className="text-base font-black text-card-foreground">
            {isReturning ? "لديك حساب — سجّل دخولك" : "أنشئ حساباً لمتابعة طلباتك"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isReturning
              ? "أدخل كلمة المرور المرتبطة ببريدك لإكمال الطلب"
              : "سيُنشأ حسابك تلقائياً عند إتمام الدفع"}
          </p>
        </div>
      </div>

      {/* حقل كلمة المرور — يظهر دائماً وبشكل واضح ومطلوب لتسجيل الدخول مستقبلاً */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-accent" />
            {isReturning ? "كلمة المرور *" : "تعيين كلمة مرور الحساب *"}
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            (6 أحرف على الأقل)
          </span>
        </label>
        <div className="relative">
          <input
            id="checkout-password-input"
            name="password"
            type={show ? "text" : "password"}
            dir="ltr"
            autoComplete={isReturning ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={cn(
              "block h-12 w-full rounded-lg border bg-background py-2.5 pe-10 ps-3 text-right text-base outline-none transition-colors focus:ring-2 focus:ring-ring",
              passwordError ? "border-destructive/60" : "border-input",
            )}
            placeholder={
              isReturning
                ? "أدخل كلمة مرور حسابك"
                : "اكتب كلمة مرور لتسجيل الدخول بها مستقبلاً"
            }
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            aria-pressed={show}
            tabIndex={-1}
            className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {passwordError ? (
          <p className="mt-1.5 text-xs font-bold text-destructive">{passwordError}</p>
        ) : (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            🔒 احفظ كلمة المرور هذه لتتمكن من تسجيل الدخول إلى حسابك في أي وقت ومتابعة اشتراكاتك وبيانات التفعيل.
          </p>
        )}

        {/* روابط التبديل */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs">
          {isReturning ? (
            <>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1 font-bold text-accent hover:underline"
              >
                <KeyRound className="h-3 w-3" />
                نسيت كلمة المرور؟
              </Link>
              <button
                type="button"
                onClick={() => onModeChange("new")}
                className="font-bold text-accent hover:underline"
              >
                عميل جديد؟ أنشئ حساباً بكلمة مرور جديدة
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onModeChange("returning")}
              className="font-bold text-accent hover:underline"
            >
              لديك حساب بالفعل؟ سجّل دخولك
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
