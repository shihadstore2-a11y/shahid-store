import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/),
  durationMonths: z.number().int().min(1).max(36),
  subtotalIncl: z.number().positive().max(100000),
});

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const cleanCode = data.code.trim();

    // 1. محاولة الفحص الذري والآمن عبر RPC يتجاوز أي قيود RLS
    try {
      const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc("validate_coupon_code", {
        _code: cleanCode,
        _duration_months: data.durationMonths,
      });

      if (!rpcErr && rpcRes && typeof rpcRes === "object") {
        const res = rpcRes as Record<string, unknown>;
        if (res.valid === false) {
          return { valid: false as const, error: String(res.error || "كود غير صالح") };
        }
        if (res.valid === true && res.discount_percent) {
          const discPercent = Number(res.discount_percent);
          const discAmt = Math.round(((data.subtotalIncl * discPercent) / 100) * 100) / 100;
          return {
            valid: true as const,
            coupon: {
              code: String(res.code || cleanCode),
              discount_percent: discPercent,
              discount_amount: discAmt,
            },
          };
        }
      }
    } catch (rpcEx) {
      console.warn("[validateCoupon] RPC fallback:", rpcEx);
    }

    // 2. فحص احتياطي مباشر من الجدول
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("code, discount_percent, applies_to_duration_min, valid_until, is_active")
      .ilike("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[validateCoupon] db error:", error);
      return { valid: false as const, error: "تعذّر التحقّق من الكود حالياً. يرجى المحاولة لاحقاً." };
    }

    if (!coupon) {
      return { valid: false as const, error: "كود الخصم غير صحيح أو غير مفعّل" };
    }

    // 2. التحقق من تاريخ انتهاء الصلاحية
    if (coupon.valid_until && new Date(coupon.valid_until).getTime() < Date.now()) {
      return { valid: false as const, error: "عذراً، انتهت صلاحية هذا الكوبون" };
    }

    // 3. التحقق من الحد الأدنى للمدة (دعم الإدخال بالأشهر أو بالأيام)
    const rawMin = coupon.applies_to_duration_min ?? 0;
    const minMonths = rawMin > 12 ? Math.round(rawMin / 30) : rawMin;

    if (minMonths > 0 && data.durationMonths < minMonths) {
      return {
        valid: false as const,
        error: `هذا الكود مخصص للباقات مدة ${minMonths} أشهر فأكثر (مدة الباقة الحالية: ${data.durationMonths} شهر)`,
      };
    }

    const discountIncl = Math.round(((data.subtotalIncl * coupon.discount_percent) / 100) * 100) / 100;

    return {
      valid: true as const,
      coupon: {
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        discount_amount: discountIncl,
      },
    };
  });
