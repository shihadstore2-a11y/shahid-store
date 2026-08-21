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
  subscription_username: z.string().trim().min(1, "اسم المستخدم مطلوب").max(255),
  subscription_password: z.string().min(1, "كلمة السر مطلوبة").max(255),
  subscription_url: z
    .string()
    .trim()
    .max(500)
    .url("رابط غير صالح")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subscription_extra_info: ExtraInfoSchema,
});

export const fulfillOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Layer 1: admin check
    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (adminErr || !adminRow) {
      throw new Error("Unauthorized: admin only");
    }

    // Layer 2: order paid + not fulfilled (race condition guard)
    const { data: order, error: readErr } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, status, fulfilled_at")
      .eq("id", data.orderId)
      .single();

    if (readErr || !order) {
      throw new Error("الطلب غير موجود");
    }
    if (order.status !== "paid") {
      throw new Error(`لا يمكن تسليم طلب بحالة "${order.status}" — يجب أن يكون paid`);
    }
    if (order.fulfilled_at) {
      throw new Error("هذا الطلب مُسلَّم بالفعل");
    }

    const nowIso = new Date().toISOString();

    // Layer 3: race-safe UPDATE
    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({
        subscription_username: data.subscription_username,
        subscription_password: data.subscription_password,
        subscription_url: data.subscription_url ?? null,
        subscription_extra_info: (data.subscription_extra_info ?? {}) as never,
        fulfilled_at: nowIso,
        fulfilled_by: adminRow.id,
        status: "fulfilled",
        updated_at: nowIso,
      })
      .eq("id", data.orderId)
      .eq("status", "paid")
      .is("fulfilled_at", null);

    if (updErr) throw new Error(updErr.message);

    // Audit log (failure لا يُسقط التسليم)
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_user_id: adminRow.id,
        action: "fulfill_order",
        entity_type: "order",
        entity_id: data.orderId,
        changes: {
          order_number: order.order_number,
          customer_name: order.customer_name,
          has_url: !!data.subscription_url,
          has_extra: !!(
            data.subscription_extra_info && Object.keys(data.subscription_extra_info).length
          ),
        },
      });
    } catch (e) {
      console.error("[fulfillOrder] audit log failed:", e);
    }

    return { ok: true as const, fulfilled_at: nowIso };
  });
