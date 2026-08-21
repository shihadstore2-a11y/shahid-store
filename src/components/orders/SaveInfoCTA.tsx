import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  /** Email known from the guest order (server-trusted, not user-typed here). */
  orderEmail: string;
  /** Order UUID — used for context/logging only (redirect uses current URL). */
  orderId: string;
};

/**
 * H.6 — Save My Info CTA (guest order success page).
 *
 * Flow: guest order → click → Magic Link to known email →
 * user opens link → useAuth.onAuthStateChange (F.5) → auto claim_orders_by_email (F.2).
 *
 * Magic Link pattern: 60s cooldown + error handling.
 */
export function SaveInfoCTA({ orderEmail, orderId: _orderId }: Props) {
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const isOnCooldown = now < cooldownUntil;
  const cooldownSeconds = isOnCooldown
    ? Math.max(1, Math.ceil((cooldownUntil - now) / 1000))
    : 0;

  const email = (orderEmail || "").trim().toLowerCase();
  const hasEmail = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    if (magicLoading || isOnCooldown || !hasEmail) return;
    setMagicLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.href,
          shouldCreateUser: true,
        },
      });
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("rate") || msg.includes("seconds") || msg.includes("limit")) {
          setCooldownUntil(Date.now() + 60_000);
          setNow(Date.now());
          toast.error("الرجاء الانتظار 60 ثانية قبل إعادة الإرسال");
        } else {
          toast.error("تعذّر إرسال الرابط: " + error.message);
        }
      } else {
        setMagicSent(true);
        setCooldownUntil(Date.now() + 60_000);
        setNow(Date.now());
        toast.success("تم إرسال رابط الدخول إلى بريدك ✉️");
      }
    } catch (err) {
      toast.error("تعذّر الإرسال، حاول لاحقاً");
      console.error("[SaveInfoCTA] Magic link error:", err);
    } finally {
      setMagicLoading(false);
    }
  };

  if (!hasEmail) return null;

  // ─────────── State 2: Magic Link sent ───────────
  if (magicSent) {
    return (
      <div className="rounded-2xl border border-accent/50 bg-gradient-to-br from-accent/10 to-accent/5 p-5 text-right shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
            <Mail className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black sm:text-base">
              ✉️ تحقَّق من بريدك <bdi dir="ltr" className="text-foreground">{email}</bdi>
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              اضغط الرابط داخل الرسالة من نفس الجهاز لتفعيل حسابك + حفظ اشتراكك تلقائياً.
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground/80">
              💡 لم تجد الرسالة؟ تحقَّق من مجلد <bdi>«Spam»</bdi> أو الرسائل غير المرغوبة.
            </p>
            <button
              type="button"
              aria-label="إعادة إرسال رابط الدخول"
              onClick={handleSend}
              disabled={magicLoading || isOnCooldown}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {magicLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {isOnCooldown ? `إعادة الإرسال خلال ${cooldownSeconds}s` : "إعادة الإرسال"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────── Default: 3-benefits CTA ───────────
  return (
    <div className="rounded-2xl border border-accent/50 bg-gradient-to-br from-accent/10 via-card to-card p-5 text-right shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black sm:text-lg">احفظ اشتراكك + سجِّل دخولك</h3>
          <p className="mt-1 text-xs text-muted-foreground">بضغطة واحدة احصل على:</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5 text-right">
        <li className="flex items-start gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-foreground">
            احفظ بيانات اشتراكك <span className="text-muted-foreground">(اسم المستخدم وكلمة المرور)</span> للرجوع إليها في أي وقت
          </span>
        </li>
        <li className="flex items-start gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-foreground">
            تابع طلباتك القادمة من <bdi>«طلباتي»</bdi>
          </span>
        </li>
        <li className="flex items-start gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-foreground">تجديد سريع عند انتهاء الاشتراك</span>
        </li>
      </ul>

      <button
        type="button"
        aria-label="إرسال رابط الدخول إلى البريد"
        onClick={handleSend}
        disabled={magicLoading || isOnCooldown}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent/80 px-4 py-3.5 text-sm font-black text-accent-foreground shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
      >
        {magicLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {isOnCooldown
          ? `انتظر ${cooldownSeconds}s`
          : magicLoading
            ? "جارٍ الإرسال..."
            : <>إرسال رابط الدخول لـ <bdi dir="ltr" className="font-bold">{email}</bdi></>}
      </button>

      <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
        🔒 لن نطلب منك إنشاء كلمة مرور — رابط فقط.
      </p>
    </div>
  );
}
