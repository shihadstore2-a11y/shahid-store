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
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("code, discount_percent, applies_to_duration_min, valid_until, is_active")
      .eq("code", data.code)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[validateCoupon] db error", error);
      return { valid: false as const, error: "تعذّر التحقّق من الكود حالياً" };
    }

    if (!coupon) {
      return { valid: false as const, error: "كود غير صالح" };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { valid: false as const, error: "انتهت صلاحية هذا الكود" };
    }

    // applies_to_duration_min مُخزَّن كأيام
    const durationDays = data.durationMonths * 30;
    if ((coupon.applies_to_duration_min ?? 0) > durationDays) {
      return {
        valid: false as const,
        error: `هذا الكود يتطلب اشتراكاً مدته ${coupon.applies_to_duration_min} يوماً على الأقل`,
      };
    }

    const discountIncl = Math.round((data.subtotalIncl * coupon.discount_percent) / 100 * 100) / 100;

    return {
      valid: true as const,
      coupon: {
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        discount_amount: discountIncl,
      },
    };
  });
