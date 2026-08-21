import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MessageCircle,
  RotateCw,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatSAR } from "@/lib/format";
import { useWhatsappLink } from "@/lib/whatsapp";

const SearchSchema = z.object({
  order: z.string().uuid().optional(),
});

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2000;

export const Route = createFileRoute("/payment/success")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "تم الدفع بنجاح — شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentSuccessPage,
});

type PaymentStatus = {
  order_id: string;
  order_number: string;
  status: string;
  amount: number;
  provider: string;
  updated_at: string;
};

function isSuccessStatus(s?: string | null) {
  return s === "success" || s === "paid";
}

function isTerminalFailureStatus(s?: string | null) {
  return s === "cancelled" || s === "failed";
}

function PaymentSuccessPage() {
  const { order: orderId } = Route.useSearch();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [polling, setPolling] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const pollOnce = useCallback(async (): Promise<PaymentStatus | null> => {
    if (!orderId) return null;
    const { data } = await supabase.rpc("get_payment_status", {
      _order_id: orderId,
    });
    return (data as PaymentStatus[] | null)?.[0] ?? null;
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setPolling(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let localAttempts = 0;

    async function poll() {
      const row = await pollOnce();
      if (cancelled) return;

      if (row) {
        setPayment(row);
        if (isSuccessStatus(row.status)) {
          setPolling(false);
          setTimeout(() => {
            navigate({ to: "/order-success/$id", params: { id: orderId! } });
          }, 2000);
          return;
        }
        if (isTerminalFailureStatus(row.status)) {
          setPolling(false);
          navigate({ to: "/payment/failed", search: { order: orderId! } });
          return;
        }
      }

      localAttempts += 1;
      setAttempts(localAttempts);

      if (localAttempts < MAX_ATTEMPTS) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        setPolling(false);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, retryCount, pollOnce, navigate]);

  const waMessage = payment
    ? `السلام عليكم، أحتاج التحقق من حالة دفع طلبي رقم ${payment.order_number} بمبلغ ${formatSAR(payment.amount)}. شكراً.`
    : orderId
      ? `السلام عليكم، أحتاج التحقق من حالة دفعة طلب رقم: ${orderId}. شكراً.`
      : "السلام عليكم، أحتاج المساعدة بشأن طلب دفع.";

  const waHref = useWhatsappLink(waMessage);

  const handleRetry = () => {
    setAttempts(0);
    setPayment(null);
    setPolling(true);
    setRetryCount((n) => n + 1);
  };

  // ─────── State 1: Polling in progress ───────
  if (polling && !isSuccessStatus(payment?.status)) {
    const progress = Math.min(((attempts + 1) / MAX_ATTEMPTS) * 100, 100);
    return (
      <SiteLayout>
        <section className="mx-auto max-w-xl px-4 py-16 text-center sm:py-20">
          <Loader2 className="mx-auto h-14 w-14 animate-spin text-accent" />
          <h1 className="mt-6 text-2xl font-black sm:text-3xl">
            جارٍ تأكيد الدفع...
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            نتحقق من حالة دفعتك مع البنك. لا تغلق الصفحة.
          </p>

          <div className="mx-auto mt-8 max-w-xs">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              محاولة {Math.min(attempts + 1, MAX_ATTEMPTS)} من {MAX_ATTEMPTS}
            </p>
          </div>
        </section>
      </SiteLayout>
    );
  }

  // ─────── State 2: Success confirmed ───────
  if (isSuccessStatus(payment?.status)) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
          <h1 className="mt-6 text-3xl font-black">تم الدفع بنجاح</h1>
          <p className="mt-3 text-muted-foreground">
            تم استلام مبلغ {formatSAR(payment!.amount)} — رقم الطلب{" "}
            <span className="font-bold text-accent">{payment!.order_number}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            يتم نقلك إلى صفحة الطلب...
          </p>
        </section>
      </SiteLayout>
    );
  }

  // ─────── State 3: Timeout — recovery options ───────
  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400">
            <Clock className="h-9 w-9" />
          </div>
          <h1 className="mt-5 text-2xl font-black sm:text-3xl">
            قيد التحقق من الدفع
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            لم نتلقَّ تأكيداً نهائياً من البنك بعد. هذا طبيعي وقد يستغرق حتى 5
            دقائق.
          </p>
          <p className="mx-auto mt-3 max-w-md rounded-xl border border-amber-400/40 bg-amber-400/5 px-4 py-3 text-sm font-bold text-amber-200">
            دفعتك قد تكون مكتملة بالفعل — لا تعيد الدفع.
          </p>
        </div>

        {payment && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">رقم الطلب</span>
              <span dir="ltr" className="font-black tracking-wide">
                {payment.order_number}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">المبلغ</span>
              <span className="font-black text-accent">
                {formatSAR(payment.amount)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-black text-accent-foreground transition hover:opacity-90"
          >
            <RotateCw className="h-4 w-4" />
            إعادة التحقق
          </button>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/50 bg-card px-6 py-3 text-sm font-black text-foreground transition hover:border-accent hover:text-accent"
          >
            <MessageCircle className="h-4 w-4 text-accent" />
            تواصل دعم واتساب
          </a>

          {orderId && (
            <Link
              to="/order-success/$id"
              params={{ id: orderId }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-muted-foreground transition hover:border-accent hover:text-accent"
            >
              <ExternalLink className="h-4 w-4" />
              عرض تفاصيل الطلب
            </Link>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          سيصلك تأكيد عبر واتساب فور تأكيد البنك للدفع.
        </p>
      </section>
    </SiteLayout>
  );
}
