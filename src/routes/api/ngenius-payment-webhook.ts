/**
 * مسار N-Genius Webhook المباشر لمتجر شاهد ستور (Shahid-Store)
 *
 * الرابط المسجل في بوابة N-Genius:
 * https://shahidstore.net/api/ngenius-payment-webhook
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getNGeniusConfig, fetchNGeniusOrderStatus, fulfillSuccessfulOrder } from "@/lib/ngenius.server";

async function parseRequestBody(request: Request): Promise<Record<string, any>> {
  const text = (await request.text()).trim();
  if (!text) return {};

  const firstChar = text[0];
  if (firstChar === "{" || firstChar === "[") {
    try {
      return JSON.parse(text);
    } catch {
      /* fallback */
    }
  }

  const ct = (request.headers.get("content-type") ?? "").toLowerCase();
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      /* fallback */
    }
  }

  const params = new URLSearchParams(text);
  const obj: Record<string, any> = {};
  params.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
}

export const Route = createFileRoute("/api/ngenius-payment-webhook")({
  server: {
    handlers: {
      GET: async () => {
        return new Response("N-Genius payment webhook endpoint is active", { status: 200 });
      },

      POST: async ({ request }) => {
        const config = await getNGeniusConfig();
        const authHeader =
          request.headers.get("authorization") ||
          request.headers.get("Authorization") ||
          request.headers.get(config.webhookHeaderKey.toLowerCase()) ||
          "";

        let payload: Record<string, any> = {};
        try {
          payload = await parseRequestBody(request);
        } catch (err) {
          console.error("[N-Genius Webhook] Failed to parse payload:", err);
          return new Response("Bad Request", { status: 400 });
        }

        const secretMatches =
          Boolean(config.webhookSecret) &&
          (authHeader.trim() === config.webhookSecret.trim() ||
            authHeader.trim() === `Bearer ${config.webhookSecret.trim()}`);

        const hasNGeniusShape = Boolean(
          payload?.order?.merchantOrderReference ||
          payload?.order?.reference ||
          payload?._embedded?.payment ||
          payload?.eventName ||
          payload?.merchantOrderReference
        );

        if (!secretMatches && !hasNGeniusShape) {
          console.warn("[N-Genius Webhook] Unauthorized request or invalid payload shape.");
          return new Response("Unauthorized", { status: 401 });
        }

        console.log("[N-Genius Webhook] Received payload:", JSON.stringify(payload));

        const merchantOrderRef =
          payload?.order?.merchantOrderReference ||
          payload?.merchantOrderReference ||
          payload?.orderReference ||
          payload?.order_id ||
          payload?.orderId ||
          null;

        const orderRef =
          payload?.order?.reference ||
          payload?.reference ||
          payload?.orderReference ||
          null;

        const eventName = (
          payload?.eventName ||
          payload?.event ||
          payload?.type ||
          payload?.state ||
          payload?.action ||
          ""
        ).toUpperCase();

        if (!merchantOrderRef && !orderRef) {
          console.warn("[N-Genius Webhook] Missing order reference in payload:", payload);
          return new Response(JSON.stringify({ ok: false, error: "Missing order reference" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // البحث عن الطلب في قاعدة البيانات (برقم الطلب أو الـ ID)
        let targetOrderId: string | null = null;
        let targetOrderNumber: string | null = null;

        if (merchantOrderRef) {
          const { data: matchedOrder } = await supabaseAdmin
            .from("orders")
            .select("id, order_number, status")
            .or(`order_number.eq.${merchantOrderRef},id.eq.${merchantOrderRef}`)
            .limit(1)
            .maybeSingle();

          if (matchedOrder) {
            targetOrderId = matchedOrder.id;
            targetOrderNumber = matchedOrder.order_number;
          }
        }

        if (!targetOrderId) {
          console.warn(`[N-Genius Webhook] Order not found for ref: ${merchantOrderRef || orderRef}`);
          return new Response(JSON.stringify({ ok: true, note: "Order not found" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // التحقق من حالة الدفع
        let isSuccessful = false;

        if (orderRef) {
          const check = await fetchNGeniusOrderStatus(orderRef);
          if (check.ok && check.status === "success") {
            isSuccessful = true;
          }
        }

        if (!isSuccessful && secretMatches) {
          isSuccessful =
            eventName.includes("SUCCESS") ||
            eventName.includes("CAPTURED") ||
            eventName.includes("AUTHORISED") ||
            eventName === "PURCHASE";
        }

        if (isSuccessful) {
          console.log(`[N-Genius Webhook] ✅ Payment SUCCESS for order ${targetOrderNumber} (${targetOrderId})`);
          await fulfillSuccessfulOrder(targetOrderId, "ngenius");
        } else if (eventName.includes("FAIL") || eventName.includes("DECLIN")) {
          console.log(`[N-Genius Webhook] ❌ Payment FAILED for order ${targetOrderNumber}`);
        }

        return new Response(JSON.stringify({ ok: true, received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
