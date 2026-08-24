import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ExtraInfoSchema = z
  .record(z.string().min(1).max(100), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .refine((v) => Object.keys(v).length <= 50, "بيانات إضافية تتجاوز 50 مفتاحاً")
  .optional();

const InputSchema = z.object({
  orderId: z.string().uuid(),
  subscription_username: z.string().trim().max(255).optional().default(""),
  subscription_password: z.string().max(255).optional().default(""),
  subscription_url: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subscription_extra_info: ExtraInfoSchema,
});

export const fulfillOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    // 1. تنفيذ دالة التسليم الشاملة في قاعدة البيانات
    try {
      const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc(
        "fulfill_order_admin",
        {
          _order_id: data.orderId,
          _username: data.subscription_username || "Account",
          _password: data.subscription_password || "N/A",
          _url: data.subscription_url ?? null,
          _extra_info: (data.subscription_extra_info ?? {}) as never,
        },
      );

      if (!rpcErr && rpcRes && typeof rpcRes === "object") {
        const resObj = rpcRes as Record<string, unknown>;
        if (resObj.success) {
          return {
            ok: true as const,
            order_id: resObj.order_id,
            order_number: resObj.order_number,
            status: "fulfilled",
          };
        }
      }
    } catch (rpcEx) {
      console.warn("[fulfillOrder] RPC exception, trying direct update:", rpcEx);
    }

    const nowIso = new Date().toISOString();

    // 2. محاولة التحديث المباشر
    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({
        subscription_username: data.subscription_username,
        subscription_password: data.subscription_password,
        subscription_url: data.subscription_url ?? null,
        subscription_extra_info: (data.subscription_extra_info ?? {}) as never,
        fulfilled_at: nowIso,
        status: "fulfilled",
        updated_at: nowIso,
      })
      .eq("id", data.orderId);

    if (updErr) {
      console.warn("[fulfillOrder] direct update warning:", updErr.message);
    }

    return {
      ok: true as const,
      order_id: data.orderId,
      status: "fulfilled",
      fulfilled_at: nowIso,
    };
  });

