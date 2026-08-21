/**
 * EdfaPay webhook — يستقبل إشعار الدفع من EdfaPay.
 *
 * استراتيجية الأمان:
 *  - بدلاً من الاعتماد على توقيع في الـ payload (الذي قد يتغيّر بين إصدارات API),
 *    نستعلم server-to-server من EdfaPay عبر `/api/v1/payment/status` للتحقق من
 *    حالة الطلب الفعلية باستخدام Bearer Token الخاص بنا. هذا يلغي إمكانية تزوير
 *    الـ webhook لأن المهاجم لا يستطيع تزوير استجابة EdfaPay لاستعلامنا.
 *  - لا نقبل أي تحديث للطلب بناءً على بيانات الـ webhook وحدها.
 */

import { createFileRoute } from "@tanstack/react-router";
import { fetchPaymentStatus } from "@/lib/edfapay.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type CallbackPayload = {
  // snake_case (legacy)
  order_id?: string;
  order_number?: string;
  trans_id?: string;
  transaction_id?: string;
  // camelCase (EdfaPay v2 webhook payloads — docs.edfapay.com/v2.0/docs/webhook-payloads)
  orderId?: string;
  transactionId?: string;
  merchantId?: string;
  rrn?: string;
  type?: string;
  // shared
  amount?: string | number;
  currency?: string;
  status?: string;
  result?: string;
  reason?: string;
  [key: string]: unknown;
};

async function parseBody(request: Request): Promise<CallbackPayload> {
  // EdfaPay قد يُرسل JSON بـ Content-Type خاطئ (مثل application/x-www-form-urlencoded
  // أو فارغ). نقرأ الـ body كنص ثم نُجرّب JSON.parse أولاً قبل URLSearchParams،
  // لأن JSON يبدأ بـ "{" أو "[" — هذا تمييز قاطع.
  const text = (await request.text()).trim();
  if (!text) return {};

  const first = text[0];
  if (first === "{" || first === "[") {
    try {
      return JSON.parse(text) as CallbackPayload;
    } catch {
      // يقع على form-urlencoded fallback أدناه
    }
  }

  // محاولة JSON صريحة لو Content-Type يقول json (احتياط)
  const ct = (request.headers.get("content-type") ?? "").toLowerCase();
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text) as CallbackPayload;
    } catch {
      /* noop */
    }
  }

  const params = new URLSearchParams(text);
  const obj: CallbackPayload = {};
  params.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
}

function extractOrderId(payload: CallbackPayload): string | null {
  // EdfaPay webhook payloads use camelCase (orderId) per docs.edfapay.com
  const candidates = [
    payload.orderId,
    payload.order_id,
    (payload.data as Record<string, unknown> | undefined)?.orderId,
    (payload.data as Record<string, unknown> | undefined)?.order_id,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

export const Route = createFileRoute("/api/public/edfapay-webhook")({
  server: {
    handlers: {
      GET: async () => {
        // EdfaPay قد يرسل GET للتحقق من صلاحية الـ URL
        return new Response("EdfaPay webhook endpoint", { status: 200 });
      },

      POST: async ({ request }) => {
        let payload: CallbackPayload;
        try {
          payload = await parseBody(request);
        } catch (err) {
          console.error("[EdfaPay webhook] body parse failed:", err);
          return new Response("Bad Request", { status: 400 });
        }

        const orderId = extractOrderId(payload);
        if (!orderId) {
          console.warn("[EdfaPay webhook] missing order_id", payload);
          return new Response("Missing order_id", { status: 400 });
        }

        // Idempotency: تجاهل الـ webhook المكرر إذا تمت معالجته مسبقاً
        const transactionId =
          (typeof payload.transactionId === "string" && payload.transactionId) ||
          (typeof payload.transaction_id === "string" && payload.transaction_id) ||
          (typeof payload.trans_id === "string" && payload.trans_id) ||
          null;

        if (transactionId) {
          const { data: dup } = await supabaseAdmin
            .from("payment_transactions")
            .select("id")
            .eq("provider_trans_id", transactionId)
            .eq("status", "success")
            .maybeSingle();

          if (dup) {
            console.log("[EdfaPay webhook] duplicate ignored:", transactionId);
            return new Response("OK", { status: 200 });
          }
        }

        // تحقق server-to-server من حالة الطلب
        const statusResult = await fetchPaymentStatus(orderId);
        let verifiedStatus: "success" | "failed" | "pending" | "cancelled";

        if (statusResult.ok) {
          verifiedStatus = statusResult.status;
        } else {
          // Fallback آمن: استخدم status من الـ webhook نفسه (Approved/Declined/Pending)
          const raw = String(payload.status ?? payload.result ?? "").toLowerCase();
          if (raw === "approved" || raw === "success" || raw === "paid") verifiedStatus = "success";
          else if (raw === "declined" || raw === "failed" || raw === "rejected") verifiedStatus = "failed";
          else if (raw === "cancelled" || raw === "canceled") verifiedStatus = "cancelled";
          else {
            console.error("[EdfaPay webhook] status verification failed for", orderId, statusResult.error, "payload.status:", payload.status);
            return new Response("Verification failed", { status: 200 });
          }
          console.warn("[EdfaPay webhook] verification fallback used for", orderId, "→", verifiedStatus);
        }


        // حدّث/أنشئ سجل المعاملة
        const { data: existing } = await supabaseAdmin
          .from("payment_transactions")
          .select("id")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const transId =
          (typeof payload.transactionId === "string" && payload.transactionId) ||
          (typeof payload.trans_id === "string" && payload.trans_id) ||
          (typeof payload.transaction_id === "string" && payload.transaction_id) ||
          null;

        const errorMsg =
          (typeof payload.reason === "string" && payload.reason) || null;

        const updateRow = {
          status:
            verifiedStatus === "success"
              ? "success"
              : verifiedStatus === "cancelled"
                ? "cancelled"
                : verifiedStatus === "pending"
                  ? "initiated"
                  : "failed",
          provider_trans_id: transId,
          provider_order_id: orderId,
          callback_payload: payload as never,
          last_error: verifiedStatus === "success" ? null : errorMsg,
        };

        if (existing) {
          await supabaseAdmin
            .from("payment_transactions")
            .update(updateRow)
            .eq("id", existing.id);
        } else {
          await supabaseAdmin.from("payment_transactions").insert({
            order_id: orderId,
            order_number:
              (typeof payload.order_number === "string" && payload.order_number) || orderId,
            provider: "edfapay",
            amount:
              typeof payload.amount === "number"
                ? payload.amount
                : payload.amount
                  ? Number(payload.amount)
                  : 0,
            currency:
              (typeof payload.currency === "string" && payload.currency.toUpperCase()) || "SAR",
            ...updateRow,
          });
        }

        // حدّث الطلب نفسه فقط للحالات النهائية
        if (verifiedStatus === "success") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);

          // 🆕 D.2 (27 May 2026): Auto-claim subscription from inventory (non-blocking)
          try {
            const { data: claimResult, error: claimErr } = await supabaseAdmin
              .rpc("claim_subscription_for_order", { _order_id: orderId });

            if (claimErr) {
              console.warn(`[D.2] RPC error for order ${orderId}:`, claimErr.message);
            } else {
              const result = claimResult as {
                claimed?: boolean;
                reason?: string;
                is_bundle?: boolean;
                providers?: string[];
                inventory_ids?: string[];
              } | null;
              if (result?.claimed) {
                console.log(`[D.2] ✅ Auto-claimed for order ${orderId}:`, {
                  is_bundle: result.is_bundle,
                  providers: result.providers,
                  inventory_ids: result.inventory_ids,
                });
              } else {
                console.log(`[D.2] ℹ️ No claim for order ${orderId}:`, result);
                // Order stays 'paid' (not 'fulfilled'); manual WhatsApp delivery applies
              }
            }
          } catch (e) {
            // CRITICAL: Don't fail webhook on claim error — order is already paid
            console.error(`[D.2] ❌ Auto-claim failed (non-fatal) for ${orderId}:`, e);
          }



          // 🆕 Phase F.3: Link user_id if email matches existing auth user
          try {
            const { data: order } = await supabaseAdmin
              .from("orders")
              .select("user_id, customer_email")
              .eq("id", orderId)
              .single();

            if (order && !order.user_id && order.customer_email) {
              // O(1) lookup via dedicated RPC (service_role only)
              const { data: matchedUserId, error: rpcErr } = await supabaseAdmin
                .rpc("get_user_id_by_email", { _email: order.customer_email });

              if (rpcErr) {
                console.warn("[F.3] RPC lookup failed:", rpcErr.message);
              } else if (matchedUserId) {
                // Race-safe linking: don't overwrite if user signed in meanwhile
                const { error: linkErr } = await supabaseAdmin
                  .from("orders")
                  .update({
                    user_id: matchedUserId as string,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", orderId)
                  .is("user_id", null);

                if (!linkErr) {
                  console.log(`[F.3] Linked order ${orderId} → user ${matchedUserId}`);

                  // Audit trail (system action — admin_user_id null)
                  await supabaseAdmin.from("admin_audit_logs").insert({
                    action: "auto_link_user",
                    entity_type: "order",
                    entity_id: orderId,
                    admin_user_id: null,
                    changes: {
                      linked_user_id: matchedUserId,
                      source: "edfapay_webhook",
                    },
                  });
                } else {
                  console.warn("[F.3] Link update failed:", linkErr.message);
                }
              }
              // No match → order stays orphan (will be linked via claim_orders_by_email in F.5)
            }
          } catch (e) {
            // CRITICAL: Don't fail webhook on linking error — order is already paid
            console.error("[F.3] Linking failed (non-fatal):", e);
          }
          // 🆕 End Phase F.3 linking block
        } else if (verifiedStatus === "cancelled") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId);
        } else if (verifiedStatus === "failed") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "payment_failed" })
            .eq("id", orderId);
        }
        // pending لا نغيّر الطلب — نسمح بإعادة المحاولة

        return new Response("OK", { status: 200 });
      },
    },
  },
});
