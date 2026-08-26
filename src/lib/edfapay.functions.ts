/**
 * EdfaPay server functions — RPC من العميل.
 *
 * `createEdfaPayCheckout` ينشئ جلسة دفع في EdfaPay ويُرجع `redirectUrl`.
 * العميل يوجّه المتصفح إلى هذا الرابط لفتح صفحة الدفع المستضافة.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { initiatePayment } from "./edfapay.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// International E.164 (any country). EdfaPay accepts the phone as metadata.
// Enablement 28 May 2026 — Saudi-only restriction lifted (EdfaPay supports global cards).
const E164Phone = z
  .string()
  .regex(/^\+[1-9][0-9]{6,14}$/u, "رقم جوال غير صحيح");

// ISO 3166-1 alpha-2 country code (derived from phone on the client via detectCountry).
const CountryCode = z
  .string()
  .regex(/^[A-Z]{2}$/u, "رمز دولة غير صحيح")
  .optional();

const CreateCheckoutInput = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string().min(3).max(40),
  amount: z.number().positive().max(10000),
  description: z.string().min(1).max(100),
  customerName: z.string().min(2).max(120),
  customerPhone: E164Phone,
  customerCountry: CountryCode,
  customerEmail: z.string().email().max(120),
  origin: z.string().url(),
});


export const createEdfaPayCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) => CreateCheckoutInput.parse(input))
  .handler(async ({ data }) => {
    // Capture customer IP from request headers (for EdfaPay fraud engine)
    let customerIp = "0.0.0.0";
    try {
      const request = getRequest();
      if (request) {
        customerIp =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-real-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          "0.0.0.0";
      }
    } catch (err) {
      console.warn("[EdfaPay] could not capture IP:", err);
    }

    // تحقق من الطلب في DB لمنع التلاعب (إن كان متاحاً للقراءة)
    try {
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, total, customer_phone, status, payment_method")
        .eq("id", data.orderId)
        .maybeSingle();

      if (order) {
        if (order.status !== "pending") {
          return { ok: false as const, error: "الطلب لم يعد متاحاً للدفع (حالة الطلب غير معلقة)" };
        }
        if (Number(order.total) !== Number(data.amount)) {
          return { ok: false as const, error: "عدم تطابق المبلغ" };
        }
        if (order.payment_method !== "card") {
          return { ok: false as const, error: "طريقة الدفع غير صحيحة لهذا الطلب" };
        }
      } else if (orderError) {
        console.warn("[EdfaPay] order read skipped due to RLS:", orderError.message);
      }
    } catch (err) {
      console.warn("[EdfaPay] order check exception:", err);
    }

    const nameParts = data.customerName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "Customer";
    const lastName = nameParts.slice(1).join(" ") || firstName;
    // Phone is already E.164 (+9665XXXXXXXX) from frontend — no conversion needed.
    const phoneIntl = data.customerPhone;

    const callbackUrl = `${data.origin}/api/public/edfapay-webhook`;
    const successUrl = `${data.origin}/payment/success?order=${data.orderId}`;
    const failUrl = `${data.origin}/payment/failed?order=${data.orderId}`;

    const result = await initiatePayment({
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      amount: data.amount,
      currency: "SAR",
      description: data.description,
      customer: {
        firstName,
        lastName,
        email: data.customerEmail,
        phone: phoneIntl,
      },
      callbackUrl,
      successUrl,
      failUrl,
      customerIp,
      customerCountry: data.customerCountry,
    });


    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    // سجّل محاولة الدفع
    const { error: insertError } = await supabaseAdmin
      .from("payment_transactions")
      .insert({
        order_id: data.orderId,
        order_number: data.orderNumber,
        provider: "edfapay",
        amount: data.amount,
        currency: "SAR",
        status: "initiated",
        checkout_url: result.redirectUrl ?? null,
        provider_order_id: result.sessionId ?? null,
      });

    if (insertError) {
      console.error("payment_transactions insert failed:", insertError);
    }

    return {
      ok: true as const,
      redirectUrl: result.redirectUrl,
    };
  });

const VerifyPaymentInput = z.object({
  orderId: z.string().uuid(),
});

export const verifyAndConfirmPayment = createServerFn({ method: "POST" })
  .inputValidator((input) => VerifyPaymentInput.parse(input))
  .handler(async ({ data }) => {
    const { orderId } = data;

    // 1. فحص الطلب في DB أولاً (idempotent — إذا كان مدفوع/مسلّم مسبقاً)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, status, customer_name, customer_phone, customer_email")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      console.warn("[EdfaPay Verify] order not found in DB:", orderErr);
      return { ok: false as const, confirmed: false, error: "الطلب غير موجود" };
    }

    // إذا كان الطلب مدفوع أو مُسلَّم مسبقاً → أرجع نجاح مباشرة (idempotent)
    if (order.status === "paid" || order.status === "fulfilled") {
      return {
        ok: true as const,
        confirmed: true,
        order: {
          id: orderId,
          order_number: order.order_number,
          total: order.total,
          status: order.status,
        },
      };
    }

    // إذا كان الطلب فاشل أو ملغي → أرجع فشل
    if (order.status === "payment_failed" || order.status === "cancelled") {
      return { ok: true as const, confirmed: false, status: order.status as string };
    }

    // 2. الطلب ما زال pending → استعلام S2S من EdfaPay للتحقق الفعلي
    let edfaStatus: "success" | "failed" | "pending" | "cancelled" | null = null;
    try {
      const { fetchPaymentStatus } = await import("./edfapay.server");
      const statusRes = await fetchPaymentStatus(orderId);
      console.log("[EdfaPay Verify] S2S status check for", orderId, "→", statusRes.ok ? statusRes.status : statusRes.error);
      if (statusRes.ok) {
        edfaStatus = statusRes.status;
      }
    } catch (err) {
      console.warn("[EdfaPay Verify] S2S status check failed:", err);
    }

    // 3. التعامل مع نتيجة EdfaPay
    if (edfaStatus === "success") {
      // ✅ EdfaPay أكدت النجاح → تأكيد الدفع في DB
      // نستخدم confirm_order_paid (بدون auto-claim — الـ webhook يتولى ذلك)
      try {
        const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc(
          "confirm_order_paid",
          { _order_id: orderId },
        );
        if (!rpcErr && rpcRes && typeof rpcRes === "object" && (rpcRes as Record<string, unknown>).success) {
          const rpcData = rpcRes as Record<string, unknown>;
          return {
            ok: true as const,
            confirmed: true,
            order: {
              id: orderId,
              order_number: (rpcData.order_number as string) || order.order_number,
              total: (rpcData.total as number) || order.total,
              status: (rpcData.status as string) || "paid",
            },
          };
        }
      } catch (rpcEx) {
        console.warn("[EdfaPay Verify] confirm_order_paid RPC exception:", rpcEx);
      }

      // Fallback: تحديث مباشر إذا فشل RPC
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .in("status", ["pending", "initiated"]);

      await supabaseAdmin
        .from("payment_transactions")
        .update({ status: "success", updated_at: new Date().toISOString() })
        .eq("order_id", orderId);

      return {
        ok: true as const,
        confirmed: true,
        order: { id: orderId, order_number: order.order_number, total: order.total, status: "paid" },
      };
    }

    if (edfaStatus === "failed") {
      return { ok: true as const, confirmed: false, status: "failed" as const };
    }

    if (edfaStatus === "cancelled") {
      return { ok: true as const, confirmed: false, status: "cancelled" as const };
    }

    // 4. EdfaPay ما زالت pending أو فشل الاستعلام → أخبر الـ frontend بالانتظار
    return { ok: true as const, confirmed: false, status: "pending" as const };
  });


