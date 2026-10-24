/**
 * وحدة تكامل بوابة الدفع Network International (منصة N-Genius KSA) — Server-only.
 * متجر ديوان البث (Shahid-Store)
 *
 * التوثيق الرسمي:
 *  - Auth: POST https://api-gateway.ksa.ngenius-payments.com/identity/auth/access-token
 *  - Create Order: POST https://api-gateway.ksa.ngenius-payments.com/transactions/outlets/{outlet_id}/orders
 *  - Order Status: GET https://api-gateway.ksa.ngenius-payments.com/transactions/outlets/{outlet_id}/orders/{order_ref}
 *
 * تعمل هذه الوحدة حصرياً على الخادم (Server-Side) بدون أي أسرار مكشوفة في الواجهة.
 */

import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendOrderConfirmation, notifyStaffNewOrder } from "./cartat.server";
import { STORE_ID } from "./store-config";

const KNOWN_CLOUDFLARE_SECRETS = [
  "NGENIUS_API_KEY",
  "NGENIUS_OUTLET_ID",
  "NGENIUS_MID",
  "NGENIUS_UAT_API_KEY",
  "NGENIUS_UAT_OUTLET_ID",
  "NGENIUS_UAT_MID",
  "NGENIUS_WEBHOOK_SECRET",
  "GENIUS_WEBHOOK_SECRET",
  "NGENIUS_LIVE_BASE",
  "EDFAPAY_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CARTAT_API_TOKEN",
];

export interface NGeniusConfig {
  baseUrl: string;
  apiKey: string;
  outletId: string;
  mid: string;
  webhookHeaderKey: string;
  webhookSecret: string;
  environment: "live" | "sandbox";
}

export type NGeniusInitiateInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  description: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country?: string;
  };
  redirectUrl: string;
};

export type NGeniusInitiateResult =
  | { ok: true; redirectUrl: string; orderReference: string; raw: unknown }
  | { ok: false; error: string; raw?: unknown };

export type NGeniusStatusResult =
  | { ok: true; status: "success" | "failed" | "pending" | "cancelled"; raw: unknown }
  | { ok: false; error: string; raw?: unknown };

const NGENIUS_LIVE_BASE =
  process.env.NGENIUS_LIVE_BASE ||
  process.env.NGENIUS_BASE_URL ||
  "https://api-gateway.ksa.ngenius-payments.com";
const NGENIUS_UAT_BASE = "https://api-gateway.sandbox.ksa.ngenius-payments.com";

// ذاكرة مؤقتة للتوكن مفصولة لكل بيئة ومفتاح لمنع خلط توكنات الاختبار بالإنتاج
const tokenCacheMap = new Map<string, { token: string; expiresAt: number }>();

/**
 * تنظيف وتنسيق مفتاح API للربط مع N-Genius
 */
function sanitizeApiKey(raw: string): string {
  let cleaned = (raw || "").trim();
  cleaned = cleaned.replace(/^Basic\s+/i, "").replace(/^Bearer\s+/i, "").trim();

  // في حال تم إدخال المفتاح بصيغة client_id:client_secret غير المشفرة، نقوم بترميزه base64
  if (cleaned.includes(":") && !/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
    return Buffer.from(cleaned).toString("base64");
  }
  return cleaned;
}

export function getCloudflareRawEnv(): Record<string, unknown> | null {
  const g = typeof globalThis !== "undefined" ? (globalThis as any) : null;
  if (!g) return null;

  if (g.__env__ && typeof g.__env__ === "object") return g.__env__;

  try {
    const req = getRequest();
    if (req) {
      const cfEnv = (req as any)?.runtime?.cloudflare?.env || (req as any)?.env;
      if (cfEnv && typeof cfEnv === "object") return cfEnv;
    }
  } catch { }

  if (g.__CF_RAW_ENV__ && typeof g.__CF_RAW_ENV__ === "object") return g.__CF_RAW_ENV__;
  if (g.__CF_ENV__ && typeof g.__CF_ENV__ === "object") return g.__CF_ENV__;
  if (g.env && typeof g.env === "object") return g.env;

  return null;
}

export function syncCloudflareSecrets(): void {
  const rawEnv = getCloudflareRawEnv();
  if (!rawEnv || typeof rawEnv !== "object") return;

  for (const key of KNOWN_CLOUDFLARE_SECRETS) {
    try {
      const val = (rawEnv as any)[key];
      if (val !== undefined && val !== null && val !== "") {
        const valStr = String(val).trim();
        if (typeof process !== "undefined" && process.env) {
          process.env[key] = valStr;
        }
        if (typeof globalThis !== "undefined") {
          (globalThis as any)[key] = valStr;
        }
      }
    } catch { }
  }
}

/**
 * استخراج قيمة متغير بيئة من كافة مصادر Cloudflare الممكنة
 */
export function getEnvValue(candidateNames: string[]): string {
  syncCloudflareSecrets();
  const rawEnv = getCloudflareRawEnv();

  for (const name of candidateNames) {
    if (rawEnv && typeof rawEnv === "object") {
      try {
        const val = (rawEnv as any)[name];
        if (val !== undefined && val !== null && val !== "") return String(val).trim();
      } catch { }
      try {
        const valUpper = (rawEnv as any)[name.toUpperCase()];
        if (valUpper !== undefined && valUpper !== null && valUpper !== "") return String(valUpper).trim();
      } catch { }
    }
    if (typeof process !== "undefined" && process.env) {
      if (process.env[name]) return String(process.env[name]).trim();
      if (process.env[name.toUpperCase()]) return String(process.env[name.toUpperCase()]).trim();
    }
    if (typeof globalThis !== "undefined") {
      if ((globalThis as any)[name] !== undefined && (globalThis as any)[name] !== null) return String((globalThis as any)[name]).trim();
      if ((globalThis as any)[name.toUpperCase()] !== undefined && (globalThis as any)[name.toUpperCase()] !== null) return String((globalThis as any)[name.toUpperCase()]).trim();
    }
  }

  return "";
}

const OUTLET_ID_CANDIDATES = [
  "NGENIUS_OUTLET_ID",
  "NGENIUS_OUTLET",
  "NGENIUS_LIVE_OUTLET_ID",
  "NGENIUS_LIVE_OUTLET",
  "NGENIUS_OUTLET_REF",
  "NGENIUS_OUTLET_REFERENCE",
  "OUTLET_ID",
];

const API_KEY_CANDIDATES = [
  "NGENIUS_API_KEY",
  "NGENIUS_LIVE_API_KEY",
  "NGENIUS_KEY",
  "NGENIUS_LIVE_KEY",
  "NETWORK_API_KEY",
];

const MID_CANDIDATES = [
  "NGENIUS_MID",
  "NGENIUS_LIVE_MID",
  "NETWORK_MID",
  "MID",
];

/**
 * فحص هل تم تفعيل وضع التجربة (Test Mode) من إعدادات المتجر في قاعدة البيانات
 */
export async function isNGeniusTestMode(): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("store_settings")
      .select("value")
      .eq("store_id", STORE_ID)
      .eq("key", "payment_settings")
      .maybeSingle();

    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        return Boolean(parsed.ngenius_test_mode || parsed.test_mode);
      } catch { }
    }
  } catch { }

  const envMode = getEnvValue(["NGENIUS_TEST_MODE", "PAYMENT_MODE"]);
  return envMode === "true" || envMode === "test" || envMode === "sandbox";
}

/**
 * جلب الإعدادات المعتمدة للبوابة
 */
export async function getNGeniusConfig(): Promise<NGeniusConfig> {
  const isTest = await isNGeniusTestMode();
  const liveBase = getEnvValue(["NGENIUS_LIVE_BASE", "NGENIUS_BASE_URL"]) || NGENIUS_LIVE_BASE;
  const baseUrl = isTest ? NGENIUS_UAT_BASE : liveBase;

  const rawApiKey = isTest
    ? getEnvValue(["NGENIUS_UAT_API_KEY"])
    : getEnvValue(API_KEY_CANDIDATES);

  const rawOutletId = isTest
    ? getEnvValue(["NGENIUS_UAT_OUTLET_ID"])
    : getEnvValue(OUTLET_ID_CANDIDATES);

  const rawMid = isTest
    ? getEnvValue(["NGENIUS_UAT_MID"])
    : getEnvValue(MID_CANDIDATES);

  const apiKey = sanitizeApiKey(rawApiKey);
  const outletId = (rawOutletId || "").trim();
  const mid = (rawMid || "").trim();

  const webhookSecret = (
    (isTest && getEnvValue(["NGENIUS_UAT_WEBHOOK_SECRET"])) ||
    getEnvValue(["NGENIUS_WEBHOOK_SECRET", "GENIUS_WEBHOOK_SECRET"]) ||
    "KSA-STORE"
  ).trim();

  return {
    baseUrl,
    apiKey,
    outletId,
    mid,
    webhookHeaderKey: "Authorization",
    webhookSecret,
    environment: isTest ? "sandbox" : "live",
  };
}

/**
 * استخراج أو تجديد رمز الوصول (Bearer Token) من N-Genius
 */
export async function getNGeniusAccessToken(config?: NGeniusConfig): Promise<string> {
  const cfg = config || (await getNGeniusConfig());

  if (!cfg.apiKey) {
    if (cfg.environment === "live") {
      throw new Error(
        "لم يتم العثور على مفتاح الربط الحي (NGENIUS_API_KEY) في أسرار السيرفر (Cloudflare Secrets)."
      );
    } else {
      throw new Error("لم يتم العثور على مفتاح API التجريبي لبوابة N-Genius.");
    }
  }

  const now = Date.now();
  const cacheKey = `${cfg.environment}:${cfg.baseUrl}:${cfg.apiKey}`;
  const cached = tokenCacheMap.get(cacheKey);
  if (cached && cached.expiresAt > now + 30_000) {
    return cached.token;
  }

  const candidateUrls = [cfg.baseUrl];
  if (cfg.environment === "live" && !candidateUrls.includes("https://api-gateway.ksa.ngenius-payments.com")) {
    candidateUrls.push("https://api-gateway.ksa.ngenius-payments.com");
  }

  const realmCandidates = cfg.environment === "live" ? ["ni", "NIARABIA"] : ["NIARABIA", "ni"];
  let lastErrText = "";

  for (const url of candidateUrls) {
    const tokenUrl = `${url}/identity/auth/access-token`;

    for (const realmName of realmCandidates) {
      try {
        const res = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${cfg.apiKey}`,
            "Content-Type": "application/vnd.ni-identity.v1+json",
            Accept: "application/vnd.ni-identity.v1+json",
          },
          body: JSON.stringify({ realmName }),
        });

        if (res.ok) {
          const data = (await res.json()) as { access_token: string; expires_in?: number };
          if (data.access_token) {
            const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 300;
            tokenCacheMap.set(cacheKey, {
              token: data.access_token,
              expiresAt: now + expiresInSec * 1000,
            });
            cfg.baseUrl = url;
            return data.access_token;
          }
        } else {
          lastErrText = await res.text();
          if (!lastErrText.includes("realmNameNotAvailable") && !lastErrText.includes("Unable to find a tenant") && res.status !== 404) {
            console.error(`[N-Genius] Token request failed on ${url} (${realmName}):`, res.status, lastErrText);
          }
        }
      } catch (fetchErr: any) {
        lastErrText = fetchErr?.message || String(fetchErr);
      }
    }
  }

  throw new Error(`فشل الحصول على توكن N-Genius: ${lastErrText}`);
}

/**
 * إنشاء جلسة دفع جديدة لدى N-Genius واستخراج رابط الدفع
 */
export async function initiateNGeniusPayment(
  input: NGeniusInitiateInput
): Promise<NGeniusInitiateResult> {
  try {
    const config = await getNGeniusConfig();
    if (!config.outletId) {
      console.error("[N-Genius] Missing outletId in Live mode.");
      throw new Error(
        config.environment === "live"
          ? "لم يتم العثور على معرّف المنفذ الحي (NGENIUS_OUTLET_ID) في أسرار السيرفر (Cloudflare Secrets)."
          : "لم يتم العثور على معرّف المنفذ التجريبي لبوابة N-Genius."
      );
    }
    const token = await getNGeniusAccessToken(config);

    const orderUrl = `${config.baseUrl}/transactions/outlets/${config.outletId}/orders`;
    const minorUnits = Math.round(input.amount * 100);

    const firstName = input.customer.firstName?.trim() || "عميل";
    const lastName = input.customer.lastName?.trim() || "المتجر";

    const payload = {
      action: "PURCHASE",
      amount: {
        currencyCode: input.currency || "SAR",
        value: minorUnits,
      },
      merchantOrderReference: input.orderNumber,
      emailAddress: input.customer.email.toLowerCase().trim(),
      billingAddress: {
        firstName,
        lastName,
      },
      merchantAttributes: {
        redirectUrl: input.redirectUrl,
        cancelUrl: input.redirectUrl.replace("/payment/success", "/payment/failed"),
        skipConfirmationPage: true,
      },
      redirectUrl: input.redirectUrl,
      skipConfirmationPage: true,
    };

    const res = await fetch(orderUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.ni-payment.v2+json",
        Accept: "application/vnd.ni-payment.v2+json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      console.error("[N-Genius] Create order failed:", res.status, data);
      const msg =
        data?.message ||
        data?.errors?.[0]?.message ||
        data?.error_description ||
        `فشل إنشاء العملية (${res.status})`;
      return { ok: false, error: msg, raw: data };
    }

    const paymentUrl = data?._links?.payment?.href;
    const orderReference = data?.reference || data?._id;

    if (!paymentUrl) {
      console.error("[N-Genius] Missing payment URL in response:", data);
      return { ok: false, error: "لم يتم العثور على رابط الدفع في رد البوابة", raw: data };
    }

    return {
      ok: true,
      redirectUrl: paymentUrl,
      orderReference,
      raw: data,
    };
  } catch (err: any) {
    console.error("[N-Genius] Exception in initiateNGeniusPayment:", err);
    return { ok: false, error: err?.message || "خطأ غير متوقع أثناء الاتصال ببوابة N-Genius" };
  }
}

/**
 * فحص والتحقق من حالة الطلب مباشرة لدى N-Genius (Server-to-Server)
 */
export async function fetchNGeniusOrderStatus(
  orderReference: string
): Promise<NGeniusStatusResult> {
  try {
    const config = await getNGeniusConfig();
    const token = await getNGeniusAccessToken(config);

    const queryUrl = `${config.baseUrl}/transactions/outlets/${config.outletId}/orders/${encodeURIComponent(
      orderReference
    )}`;

    const res = await fetch(queryUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.ni-payment.v2+json",
      },
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      return { ok: false, error: data?.message || `Status check failed (${res.status})`, raw: data };
    }

    const payments = data?._embedded?.payment || [];
    const latestPayment = Array.isArray(payments) && payments.length > 0 ? payments[0] : null;

    const captureState = (latestPayment?._embedded?.["cnp:capture"]?.[0]?.state || "").toUpperCase();
    const threeDsState = (latestPayment?.["3ds"]?.status || "").toUpperCase();
    const pState = (latestPayment?.state || "").toUpperCase();
    const actionState = (data?.action || data?.state || "").toUpperCase();

    const isSuccess =
      ["CAPTURED", "PURCHASED", "SUCCESS", "AUTHORIZED", "AUTHORISED", "COMPLETE", "COMPLETED"].includes(pState) ||
      ["SUCCESS", "CAPTURED"].includes(captureState) ||
      (threeDsState === "SUCCESS" && !["FAILED", "DECLINED", "CANCELLED"].includes(pState));

    if (isSuccess) {
      return { ok: true, status: "success", raw: data };
    }

    if (
      pState === "FAILED" ||
      pState === "DECLINED" ||
      captureState === "FAILED" ||
      actionState === "FAILED"
    ) {
      return { ok: true, status: "failed", raw: data };
    }

    if (
      pState === "CANCELLED" ||
      pState === "CANCELED" ||
      actionState === "CANCELLED"
    ) {
      return { ok: true, status: "cancelled", raw: data };
    }

    return { ok: true, status: "pending", raw: data };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Status check exception" };
  }
}

/**
 * تنفيذ إجراءات تأكيد الطلب الناجح (تحديث الحالة إلى paid، إرسال إشعارات الواتساب، وتوثيق السجل)
 */
export async function fulfillSuccessfulOrder(orderId: string, providerName: string = "ngenius") {
  const { data: currentOrder } = await supabaseAdmin
    .from("orders")
    .select("id, status, order_number, customer_name, customer_phone, customer_email, total, items, user_id, notes, payment_method")
    .eq("id", orderId)
    .maybeSingle();

  if (!currentOrder) {
    console.warn(`[Order Fulfillment] Order not found: ${orderId}`);
    return;
  }

  // 1. تحديث حالة الطلب فوراً إلى 'paid' في قاعدة البيانات
  const nowIso = new Date().toISOString();
  try {
    await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        payment_method: providerName,
        updated_at: nowIso,
      })
      .eq("id", orderId);
    console.log(`[Order Fulfillment] ✅ Order ${currentOrder.order_number} (${orderId}) marked as 'paid' in DB.`);
  } catch (updErr) {
    console.error(`[Order Fulfillment] Failed to update order status to paid:`, updErr);
  }

  // 2. محاولة ربط user_id بالبريد إن وجد
  try {
    if (!currentOrder.user_id && currentOrder.customer_email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .ilike("email", currentOrder.customer_email.trim())
        .maybeSingle();

      if (profile?.user_id) {
        await supabaseAdmin
          .from("orders")
          .update({
            user_id: profile.user_id,
            updated_at: nowIso,
          })
          .eq("id", orderId)
          .is("user_id", null);
      }
    }
  } catch (linkEx) {
    console.warn("[Order Fulfillment] Linking user skipped:", linkEx);
  }

  // 3. إرسال إشعارات الواتساب عبر Cartat (للعميل وللموظفين) إذا تم ضبط البيانات
  try {
    const existingNotes = currentOrder.notes || "";
    const alreadyNotified =
      existingNotes.includes('"template":"confirmation"') ||
      existingNotes.includes('"template":"paid_confirmation"');

    if (!alreadyNotified) {
      const items = Array.isArray(currentOrder.items) ? currentOrder.items : [];
      const firstItem = items[0] as any;
      const productName =
        firstItem?.name_ar || firstItem?.product_name || firstItem?.name || "اشتراك ديوان البث";

      // أ) إرسال تأكيد الطلب للعميل عبر الواتساب
      try {
        await sendOrderConfirmation({
          orderNumber: currentOrder.order_number,
          customerName: currentOrder.customer_name,
          customerPhone: currentOrder.customer_phone,
          productName,
          total: Number(currentOrder.total) || undefined,
        });
      } catch (waCustErr) {
        console.warn("[Order Fulfillment] WhatsApp confirmation to customer failed:", waCustErr);
      }

      // ب) إشعار الموظفين/الإدارة
      try {
        await notifyStaffNewOrder({
          orderNumber: currentOrder.order_number,
          customerName: currentOrder.customer_name,
          customerPhone: currentOrder.customer_phone,
          customerEmail: currentOrder.customer_email || undefined,
          total: Number(currentOrder.total) || 0,
          productName,
          paymentMethod: "بطاقة بنكية 💳 (N-Genius)",
        });
      } catch (waStaffErr) {
        console.warn("[Order Fulfillment] WhatsApp staff alert failed:", waStaffErr);
      }

      // توثيق نجاح الإرسال في الملاحظات notes
      const logTag = `\n[WHATSAPP_LOG:{"template":"confirmation","sent_at":"${new Date().toISOString()}","source":"ngenius_verify"}]`;
      await supabaseAdmin
        .from("orders")
        .update({
          notes: (existingNotes + logTag).trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }
  } catch (waErr) {
    console.error("[Order Fulfillment] Cartat WhatsApp Hook Exception:", waErr);
  }
}
