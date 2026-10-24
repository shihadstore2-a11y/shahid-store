/**
 * N-Genius Server Functions — RPC من العميل لمتجر ديوان البث (Diwan-Store).
 *
 * `createNGeniusCheckout` ينشئ جلسة دفع في N-Genius ويُرجع `redirectUrl`.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { initiateNGeniusPayment, fetchNGeniusOrderStatus, fulfillSuccessfulOrder } from "./ngenius.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { STORE_ID } from "./store-config";
import { detectCountry } from "./phone-intl";

const E164Phone = z
  .string()
  .regex(/^\+[1-9][0-9]{6,14}$/u, "رقم جوال غير صحيح");

const CountryCode = z
  .string()
  .regex(/^[A-Z]{2}$/u, "رمز دولة غير صحيح")
  .optional();

const CreateCheckoutInput = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string().min(3).max(40),
  amount: z.number().positive().max(100000),
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

export const createNGeniusCheckout = createServerFn({ method: "POST" })
  .validator((input) => CreateCheckoutInput.parse(input))
  .handler(async ({ data }) => {
    // 1. تسجيل/تحديث الطلب في قاعدة البيانات أولاً
    const orderPayload = {
      id: data.orderId,
      store_id: STORE_ID,
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
      payment_method: "ngenius",
      status: "pending",
      updated_at: new Date().toISOString(),
    };

    try {
      let { error: orderUpsertErr } = await supabaseAdmin
        .from("orders")
        .upsert(orderPayload, { onConflict: "id" });

      if (
        orderUpsertErr &&
        (orderUpsertErr.message?.includes("orders_user_id_fkey") ||
          (orderUpsertErr as any)?.code === "23503")
      ) {
        orderPayload.user_id = null;
        await supabaseAdmin
          .from("orders")
          .upsert(orderPayload, { onConflict: "id" });
      }
    } catch (upsertEx) {
      console.warn("[N-Genius] order upsert exception on server:", upsertEx);
    }

    const nameParts = data.customerName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "عميل";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // رابط العودة بعد سداد العميل في N-Genius
    const redirectUrl = `${data.origin}/payment/success?order=${data.orderId}&provider=ngenius`;

    const result = await initiateNGeniusPayment({
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      amount: data.amount,
      currency: "SAR",
      description: data.description,
      customer: {
        firstName,
        lastName,
        email: data.customerEmail,
        phone: data.customerPhone,
        country: data.customerCountry || "SA",
      },
      redirectUrl,
    });

    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    // حفظ مرجع العملية في كائن المنتجات (items)
    if (result.orderReference) {
      try {
        const currentItems = Array.isArray(data.items) ? data.items : [];
        const updatedItems = currentItems.map((item, index) =>
          index === 0 ? { ...item, ngenius_ref: result.orderReference } : item
        );
        await supabaseAdmin
          .from("orders")
          .update({ items: updatedItems, updated_at: new Date().toISOString() })
          .eq("id", data.orderId);
      } catch (itemErr) {
        console.warn("[N-Genius] save ref in items warning:", itemErr);
      }
    }

    return {
      ok: true as const,
      redirectUrl: result.redirectUrl,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
    };
  });

const VerifyNGeniusInput = z.object({
  orderId: z.string().uuid(),
  ref: z.string().optional(),
});

export const verifyAndConfirmNGeniusPayment = createServerFn({ method: "POST" })
  .validator((input: { orderId: string; ref?: string }) => VerifyNGeniusInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, status, order_number, notes, total, customer_name, customer_phone, customer_email, items, payment_method")
        .eq("id", data.orderId)
        .maybeSingle();

      if (!order) return { ok: false, error: "Order not found" };

      if (order.status === "paid" || order.status === "completed" || order.status === "fulfilled") {
        return { ok: true, status: "success", order };
      }

      // استخراج مرجع N-Genius للتحقق من البوابة
      let ngeniusRef = data.ref || null;
      if (!ngeniusRef && Array.isArray(order.items) && order.items.length > 0) {
        ngeniusRef = (order.items[0] as any)?.ngenius_ref || null;
      }
      if (!ngeniusRef && order.notes) {
        const match = order.notes.match(/\[NGENIUS_REF:([^\]]+)\]/);
        if (match) ngeniusRef = match[1];
      }

      let isSuccess = false;

      if (ngeniusRef) {
        const check = await fetchNGeniusOrderStatus(ngeniusRef);
        console.log(`[N-Genius Verify] Status check for ${order.order_number} (${ngeniusRef}):`, check);
        if (check.ok && check.status === "success") {
          isSuccess = true;
        } else if (check.ok && (check.status === "failed" || check.status === "cancelled")) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", data.orderId);
          return { ok: false, status: check.status, error: "فشلت عملية الدفع لدى البوابة" };
        } else {
          return { ok: false, status: "pending", error: "لم يتم تأكيد الدفع من البوابة بعد" };
        }
      } else {
        console.warn("[N-Genius Verify] No N-Genius reference found for order:", order.order_number);
        return { ok: false, status: "pending", error: "معرّف العملية غير متوفر" };
      }

      if (isSuccess) {
        await fulfillSuccessfulOrder(data.orderId, "ngenius");

        const { data: updatedOrder } = await supabaseAdmin
          .from("orders")
          .select("id, status, order_number, notes, total, customer_name, customer_phone, customer_email, items, payment_method")
          .eq("id", data.orderId)
          .maybeSingle();

        return { ok: true, status: "success", order: updatedOrder || order };
      }

      return { ok: false, status: order.status, order };
    } catch (e: any) {
      console.error("[N-Genius Verify] Exception:", e);
      return { ok: false, error: e?.message || "Verification failed" };
    }
  });

const ResumePaymentInput = z.object({
  orderId: z.string().uuid(),
  origin: z.string().url(),
});

export const resumeNGeniusPayment = createServerFn({ method: "POST" })
  .validator((input: { orderId: string; origin: string }) => ResumePaymentInput.parse(input))
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, store_id, order_number, user_id, customer_name, customer_phone, customer_email, total, items, status, payment_method")
      .eq("id", data.orderId)
      .eq("store_id", STORE_ID)
      .maybeSingle();

    if (error || !order) {
      return { ok: false as const, error: "الطلب غير موجود" };
    }

    if (order.status === "paid" || order.status === "completed" || order.status === "fulfilled") {
      return { ok: false as const, error: "تم دفع هذا الطلب وتأكيده بالفعل" };
    }

    const ngeniusMerchantRef = `${order.order_number}-R${Date.now().toString().slice(-4)}`;

    const nameParts = (order.customer_name || "عميل").trim().split(/\s+/);
    const firstName = nameParts[0] ?? "عميل";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const redirectUrl = `${data.origin}/payment/success?order=${order.id}&provider=ngenius`;

    const description = (Array.isArray(order.items) && (order.items[0] as any)?.product_name)
      ? String((order.items[0] as any).product_name).slice(0, 100)
      : `طلب رقم ${order.order_number}`;

    const result = await initiateNGeniusPayment({
      orderId: order.id,
      orderNumber: ngeniusMerchantRef,
      amount: Number(order.total),
      currency: "SAR",
      description,
      customer: {
        firstName,
        lastName,
        email: order.customer_email || "customer@shahidstore.net",
        phone: order.customer_phone || "+966500000000",
        country: detectCountry(order.customer_phone || "") || "SA",
      },
      redirectUrl,
    });

    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    const currentItems = Array.isArray(order.items) ? order.items : [];
    const updatedItems = currentItems.map((item: any, index: number) =>
      index === 0 ? { ...item, ngenius_ref: result.orderReference } : item
    );

    try {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "pending",
          payment_method: "ngenius",
          items: updatedItems,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    } catch (orderUpdateErr) {
      console.warn("[resumeNGeniusPayment] update order error:", orderUpdateErr);
    }

    return {
      ok: true as const,
      redirectUrl: result.redirectUrl,
      orderId: order.id,
      orderNumber: order.order_number,
    };
  });
