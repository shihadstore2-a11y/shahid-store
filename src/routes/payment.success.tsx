import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
import { verifyAndConfirmPayment } from "@/lib/edfapay.functions";

const SearchSchema = z.object({
  order: z.string().uuid().optional(),
});

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 1500;

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
  const verifyPaymentFn = useServerFn(verifyAndConfirmPayment);

  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      navigate({ to: "/" });
      return;
    }

    let isMounted = true;

    async function handleSuccess() {
      try {
        // تأكيد الدفع فوراً عبر دالة السيرفر والـ RPC المباشر
        const [res] = await Promise.allSettled([
          verifyPaymentFn({ data: { orderId: orderId! } }),
          supabase.rpc("process_successful_payment", { _order_id: orderId! }),
        ]);

        if (isMounted && res.status === "fulfilled" && res.value.ok && res.value.order?.order_number) {
          setOrderNumber(res.value.order.order_number);
        }
      } catch (e) {
        console.warn("[PaymentSuccess] instant verify exception:", e);
      }

      // الانتقال المباشر إلى صفحة ملخص الطلب والتسليم
      if (isMounted) {
        setTimeout(() => {
          navigate({ to: "/order-success/$id", params: { id: orderId! } });
        }, 600);
      }
    }

    handleSuccess();

    return () => {
      isMounted = false;
    };
  }, [orderId, navigate, verifyPaymentFn]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-3xl font-black">تم تأكيد الدفع بنجاح ✅</h1>
        <p className="mt-3 text-base text-muted-foreground">
          استلمنا دفعتك بنجاح. جارٍ نقلك إلى تفاصيل الطلب والتسليم...
        </p>
        {orderNumber && (
          <p className="mt-2 text-sm font-bold text-accent">
            رقم الطلب: {orderNumber}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </section>
    </SiteLayout>
  );
}
