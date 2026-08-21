import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  orderId: z.string().uuid(),
  template: z.enum(["confirmation", "credentials", "delay", "follow_up", "custom"]),
});

export const logWhatsappSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // تحقّق أن المستخدم أدمن نشط
    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (adminErr || !adminRow) {
      throw new Error("Unauthorized: admin only");
    }

    const { data: order, error: readErr } = await supabaseAdmin
      .from("orders")
      .select("whatsapp_messages_sent")
      .eq("id", data.orderId)
      .single();

    if (readErr) throw new Error(readErr.message);

    const existing = Array.isArray(order?.whatsapp_messages_sent)
      ? (order!.whatsapp_messages_sent as Array<Record<string, unknown>>)
      : [];

    const next = [
      ...existing,
      {
        template: data.template,
        sent_at: new Date().toISOString(),
        sent_by: userId,
      },
    ];

    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({
        whatsapp_messages_sent: next as unknown as never,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.orderId);

    if (updErr) throw new Error(updErr.message);

    return { ok: true as const, count: next.length };
  });
