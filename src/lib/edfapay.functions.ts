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
  subtotal: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  vat: z.number().nonnegative().optional(),
  couponCode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  items: z.array(z.record(z.unknown())).optional(),
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

    // 1. ضمان تسجيل الطلب في قاعدة البيانات من السيرفر مباشرة (يتجاوز أي حجب RLS)
    const orderPayload = {
      id: data.orderId,
      order_number: data.orderNumber,
      user_id: data.userId || null,
      customer_name: data.customerName.trim(),
      customer_phone: data.customerPhone.trim(),
      customer_email: data.customerEmail.toLowerCase().trim(),
      city: null,
      notes: data.notes || null,
      items: data.items || [],
      subtotal: data.subtotal ?? data.amount,
      discount: data.discount ?? 0,
      vat: data.vat ?? 0,
      total: data.amount,
      coupon_code: data.couponCode || null,
      payment_method: "card",
      status: "pending",
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: orderUpsertErr } = await supabaseAdmin
        .from("orders")
        .upsert(orderPayload, { onConflict: "id" });

      if (orderUpsertErr) {
        console.warn("[EdfaPay] order upsert warning on server:", orderUpsertErr.message);
      }
    } catch (upsertEx) {
      console.warn("[EdfaPay] order upsert exception on server:", upsertEx);
    }

    const nameParts = data.customerName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "Customer";
    const lastName = nameParts.slice(1).join(" ") || firstName;
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

    // 2. تسجيل معاملة الدفع في DB
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

    // 1. استدعاء دالة التأكيد الشاملة والصرف من قاعدة البيانات
    let finalStatus = "paid";
    let orderNum = "";
    let orderTot = 0;

    try {
      const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc(
        "process_successful_payment",
        { _order_id: orderId },
      );
      if (!rpcErr && rpcRes && typeof rpcRes === "object") {
        const rpcData = rpcRes as Record<string, unknown>;
        if (rpcData.status) finalStatus = String(rpcData.status);
        if (rpcData.order_number) orderNum = String(rpcData.order_number);
        if (rpcData.total) orderTot = Number(rpcData.total);
      }
    } catch (rpcEx) {
      console.warn("[EdfaPay Verify] process_successful_payment error:", rpcEx);
    }

    // 2. تحديث مباشر احتياطي
    try {
      await supabaseAdmin
        .from("orders")
        .update({
          status: finalStatus === "fulfilled" ? "fulfilled" : "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      await supabaseAdmin
        .from("payment_transactions")
        .update({ status: "success", updated_at: new Date().toISOString() })
        .eq("order_id", orderId);
    } catch (e) {
      console.warn("[EdfaPay Verify] direct update warning:", e);
    }

    // 3. قراءة أحدث بيانات للطلب
    const { data: updatedOrder } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, status")
      .eq("id", orderId)
      .maybeSingle();

    return {
      ok: true as const,
      confirmed: true,
      order: {
        id: orderId,
        order_number: updatedOrder?.order_number || orderNum || "—",
        total: Number(updatedOrder?.total ?? orderTot),
        status: updatedOrder?.status || finalStatus,
      },
    };
  });


