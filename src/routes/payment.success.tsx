import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { verifyAndConfirmNGeniusPayment } from "@/lib/ngenius.functions";
import { verifyAndConfirmPayment as verifyEdfaPayPayment } from "@/lib/edfapay.functions";

const SearchSchema = z.object({
  order: z.string().uuid().optional(),
  provider: z.string().optional(),
  ref: z.string().optional(),
}).catchall(z.unknown());

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

function PaymentSuccessPage() {
  const searchParams = Route.useSearch();
  const orderId = searchParams.order;
  const provider = searchParams.provider;
  const ref = (searchParams as any).ref as string | undefined;

  const navigate = useNavigate();
  const verifyNGeniusFn = useServerFn(verifyAndConfirmNGeniusPayment);
  const verifyEdfaPayFn = useServerFn(verifyEdfaPayPayment);

  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      navigate({ to: "/" });
      return;
    }

    let isMounted = true;

    async function handleSuccess() {
      try {
        const verifyResult =
          provider === "edfapay"
            ? await verifyEdfaPayFn({ data: { orderId: orderId! } })
            : await verifyNGeniusFn({ data: { orderId: orderId!, ref } });

        if (!isMounted) return;

        if (verifyResult && (verifyResult as any).ok && (verifyResult as any).status === "success") {
          if ((verifyResult as any)?.order?.order_number) {
            setOrderNumber((verifyResult as any).order.order_number);
          }
          setTimeout(() => {
            navigate({ to: "/order-success/$id", params: { id: orderId! } });
          }, 600);
        } else {
          navigate({ to: "/payment/failed", search: { order: orderId!, reason: "unconfirmed" } });
        }
      } catch (e) {
        console.warn("[PaymentSuccess] instant verify exception:", e);
        if (isMounted) {
          navigate({ to: "/payment/failed", search: { order: orderId!, reason: "error" } });
        }
      }
    }

    handleSuccess();

    return () => {
      isMounted = false;
    };
  }, [orderId, provider, ref, navigate, verifyNGeniusFn, verifyEdfaPayFn]);

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
