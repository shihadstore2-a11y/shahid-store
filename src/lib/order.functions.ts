/**
 * Server functions related to customer orders (recovery + cancellation).
 *
 * Lives in its own *.functions.ts module so the client bundle never imports
 * `client.server` transitively from `src/lib/order.ts` (which is consumed by
 * client routes).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OrderIdInput = z.object({ orderId: z.string().uuid() });

/**
 * يُرجِع تفاصيل الطلب الكافية لصفحة "فشل الدفع" + أحدث جلسة دفع (status +
 * checkout_url). يستخدم supabaseAdmin لأن العميل قد يكون مجهول (RLS لطلبات
 * anon لا تسمح SELECT للعموم).
 */
export const getOrderRecovery = createServerFn({ method: "POST" })
  .inputValidator((input) => OrderIdInput.parse(input))
  .handler(async ({ data }) => {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total, status, items")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderError) throw new Error(orderError.message);
    if (!order) return { ok: false as const, error: "not_found" };

    const { data: payment } = await supabaseAdmin
      .from("payment_transactions")
      .select("status, checkout_url, provider_order_id, amount, updated_at")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ok: true as const,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        total: Number(order.total ?? 0),
        status: order.status,
      },
      payment: payment
        ? {
            status: payment.status,
            checkoutUrl: payment.checkout_url,
            providerOrderId: payment.provider_order_id,
            amount: Number(payment.amount ?? 0),
          }
        : null,
    };
  });

/**
 * إلغاء طلب لم يكتمل دفعه. يرفض الإلغاء لو آخر معاملة دفع نجحت فعلاً
 * (حماية: لا نُلغي طلباً مدفوعاً عن طريق الخطأ).
 */
export const cancelOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => OrderIdInput.parse(input))
  .handler(async ({ data }) => {
    // 1. Safety: don't cancel a successfully paid order
    const { data: latestPayment } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, status")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPayment?.status === "success" || latestPayment?.status === "paid") {
      throw new Error("لا يمكن إلغاء طلب تم دفعه بنجاح. تواصل مع الدعم.");
    }

    // 2. Update order
    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", data.orderId);

    if (orderError) throw new Error(orderError.message);

    // 3. Mark latest payment transaction as cancelled (if any, and not terminal)
    if (latestPayment && latestPayment.status !== "cancelled") {
      await supabaseAdmin
        .from("payment_transactions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", latestPayment.id);
    }

    return { success: true };
  });
