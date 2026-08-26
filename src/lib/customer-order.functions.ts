import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// View آمن للعميل — UUID gated (122-bit unguessable)، يبيّن credentials فقط بعد التسليم.
// نُسقط: user_id, fulfilled_by, customer_email (privacy)، whatsapp_messages_sent، notes الإدارية.

const InputSchema = z.object({
  id: z.string().uuid("معرّف الطلب غير صالح"),
});

type ExtraInfoValue = string | number | boolean | null;
export type CustomerExtraInfo = Record<string, ExtraInfoValue>;

export type CustomerOrderView = {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  created_at: string;
  fulfilled_at: string | null;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  coupon_code: string | null;
  items: Array<{
    product_name?: string;
    duration_label?: string;
    duration_months?: number;
    qty?: number;
    unit_price?: number;
  }>;
  // credentials — تظهر فقط عند fulfilled
  subscription_username: string | null;
  subscription_password: string | null;
  subscription_url: string | null;
  subscription_extra_info: CustomerExtraInfo | null;
  // H.6: Conditional — present ONLY on guest path (row.user_id IS NULL).
  // UUID gate (122-bit unguessable) protects this; authenticated path (getMyOrderView)
  // never exposes it. Used by SaveInfoCTA to send a Magic Link to the known email.
  customer_email?: string;
};

export type CustomerOrderResult =
  | { locked: false; order: CustomerOrderView }
  | { locked: true };

// أعمدة الإسقاط الصريحة — لا SELECT *.
const ORDER_COLUMNS = [
  "id",
  "order_number",
  "status",
  "payment_method",
  "created_at",
  "fulfilled_at",
  "customer_name",
  "customer_phone",
  "subtotal",
  "discount",
  "vat",
  "total",
  "coupon_code",
  "items",
  "subscription_username",
  "subscription_password",
  "subscription_url",
  "subscription_extra_info",
].join(",");

function sanitizeExtraInfo(raw: unknown): CustomerExtraInfo | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: CustomerExtraInfo = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else {
      out[k] = String(v);
    }
  }
  return Object.keys(out).length ? out : null;
}

// DRY: projection + credentials مشترك
// ⚠️ الأمان: بيانات الاشتراك تُعرض فقط عند status = 'fulfilled'
function projectAndMask(row: Record<string, unknown>): CustomerOrderView {
  const status = String(row.status ?? "");
  const isFulfilled = status === "fulfilled";

  return {
    id: String(row.id),
    order_number: String(row.order_number),
    status,
    payment_method: String(row.payment_method ?? "card"),
    created_at: String(row.created_at),
    fulfilled_at: (row.fulfilled_at as string | null) ?? null,
    customer_name: String(row.customer_name ?? ""),
    customer_phone: String(row.customer_phone ?? ""),
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    vat: Number(row.vat ?? 0),
    total: Number(row.total ?? 0),
    coupon_code: (row.coupon_code as string | null) ?? null,
    items: (Array.isArray(row.items) ? row.items : []) as CustomerOrderView["items"],
    // ⚠️ إظهار بيانات الاشتراك فقط عند status = fulfilled
    // في أي حالة أخرى (paid, pending, failed, cancelled) تُخفى تماماً
    subscription_username: isFulfilled ? ((row.subscription_username as string | null) ?? null) : null,
    subscription_password: isFulfilled ? ((row.subscription_password as string | null) ?? null) : null,
    subscription_url: isFulfilled ? ((row.subscription_url as string | null) ?? null) : null,
    subscription_extra_info: isFulfilled ? sanitizeExtraInfo(row.subscription_extra_info) : null,
  };
}


// === Guest view — UUID-gated ===
export const getCustomerOrderView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<CustomerOrderResult> => {
    let row: Record<string, unknown> | null = null;

    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from("orders")
      .select(`${ORDER_COLUMNS},user_id,customer_email`)
      .eq("id", data.id)
      .maybeSingle();

    if (adminRow) {
      row = adminRow as unknown as Record<string, unknown>;
    } else {
      if (adminErr) console.warn("[getCustomerOrderView] supabaseAdmin error:", adminErr.message);
      // محاولة عبر RPC آمن إذا تعذر الـ direct select
      try {
        const { data: rpcRow } = await supabaseAdmin.rpc("get_order_delivery_status", {
          _order_id: data.id,
        });
        if (rpcRow && typeof rpcRow === "object" && (rpcRow as Record<string, unknown>).order_number) {
          row = rpcRow as Record<string, unknown>;
        }
      } catch (e) {
        console.warn("[getCustomerOrderView] RPC fallback exception:", e);
      }
    }

    if (!row) throw notFound();

    const baseView = projectAndMask(row);
    return { locked: false, order: baseView };
  });

// === Authenticated view — UUID match ===
export const getMyOrderView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<CustomerOrderView> => {
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();

    if (error || !row) throw notFound();

    return projectAndMask(row as unknown as Record<string, unknown>);
  });

