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

// DRY: projection + masking مشترك بين الـ guest والـ auth fns.
function projectAndMask(row: Record<string, unknown>): CustomerOrderView {
  const isFulfilled = row.status === "fulfilled";
  return {
    id: String(row.id),
    order_number: String(row.order_number),
    status: String(row.status),
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
    subscription_username: isFulfilled ? ((row.subscription_username as string | null) ?? null) : null,
    subscription_password: isFulfilled ? ((row.subscription_password as string | null) ?? null) : null,
    subscription_url: isFulfilled ? ((row.subscription_url as string | null) ?? null) : null,
    subscription_extra_info: isFulfilled ? sanitizeExtraInfo(row.subscription_extra_info) : null,
  };
}

// === Guest view — UUID-gated + Hybrid lock for linked orders (F.7) ===
// Backwards compatible: orders with user_id=NULL → UUID gate only (existing behavior).
// Orders with user_id set (post-F.3 webhook / F.5 claim) → require auth + match,
// else return locked state with deliberately vague UX (no info leak).
export const getCustomerOrderView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<CustomerOrderResult> => {
    // F.7: Optional auth — don't break guest flow on missing/invalid token.
    let callerUid: string | null = null;
    try {
      const authHeader = getRequestHeader("authorization");
      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (token) {
          const { data: userData } = await supabaseAdmin.auth.getUser(token);
          if (userData?.user) callerUid = userData.user.id;
        }
      }
    } catch {
      callerUid = null;
    }

    // Include user_id + customer_email in query for gate check and conditional guest exposure.
    // customer_email is masked by projectAndMask by default; we re-add it ONLY for guest rows below.
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select(`${ORDER_COLUMNS},user_id,customer_email`)
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw notFound();

    // F.7: Hybrid gate
    const rowUserId = (row as unknown as { user_id: string | null }).user_id;
    if (rowUserId && callerUid !== rowUserId) {
      return { locked: true };
    }

    const baseView = projectAndMask(row as unknown as Record<string, unknown>);
    // H.6: Expose customer_email ONLY on guest path (user_id IS NULL).
    // Authenticated rows never leak email through this endpoint.
    const order: CustomerOrderView =
      rowUserId === null
        ? { ...baseView, customer_email: String((row as unknown as { customer_email: string | null }).customer_email ?? "") }
        : baseView;
    return { locked: false, order };
  });

// === Authenticated view — UUID + user_id match (defense-in-depth) ===
export const getMyOrderView = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<CustomerOrderView> => {
    const { userId } = context;
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw notFound();

    return projectAndMask(row as unknown as Record<string, unknown>);
  });
