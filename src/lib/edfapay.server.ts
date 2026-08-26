/**
 * EdfaPay REST API — Server-only helpers.
 *
 * النمط الحديث: Bearer Token + REST JSON (وليس Hosted Form القديم).
 *
 * Endpoints (من توثيق EdfaPay الرسمي):
 *   POST /api/v1/payment-gateway/initiate       → ينشئ جلسة دفع ويُرجع رابط Checkout
 *   GET  /api/v1/transactions/filterTransaction  → يُعيد حالة الدفع لطلب معيّن (للتحقق)
 *
 * الاستيثاق:
 *   X-API-KEY: <EDFAPAY_API_KEY>   (مؤكد من docs.edfapay.com + Ashraf Emad)
 *
 * هذا الملف يعمل على الخادم فقط.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type EdfaPayMode = "test" | "live";

export type EdfaPayInitiateInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  description: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string; // E.164 (+966...)
  };
  callbackUrl: string;
  successUrl: string;
  failUrl: string;
  customerIp?: string; // ⭐ للـ fraud check
  customerCountry?: string; // ISO alpha-2 (derived from phone). Default "SA".
};

export type EdfaPayInitiateResult =
  | { ok: true; redirectUrl: string; sessionId?: string; raw: unknown }
  | { ok: false; error: string; raw?: unknown };

export type EdfaPayStatusResult =
  | { ok: true; status: "success" | "failed" | "pending" | "cancelled"; raw: unknown }
  | { ok: false; error: string; raw?: unknown };

// EdfaPay base URL — default يبقى app-api.edfapay.com (السلوك الحالي).
// يمكن override عبر EDFAPAY_BASE_URL (مثل https://api.edfapay.com).
const EDFAPAY_BASE_DEFAULT = "https://app-api.edfapay.com";

type EdfaPayAuthMode = "bearer" | "x-sdk-token" | "x-api-key";

function getMode(): EdfaPayMode {
  return (process.env.EDFAPAY_MODE === "live" ? "live" : "test") as EdfaPayMode;
}

function getBaseUrl(): string {
  const raw = process.env.EDFAPAY_BASE_URL;
  if (raw && raw.trim().length > 0) {
    const cleaned = raw.trim().replace(/\/+$/, "");
    console.log(`[EdfaPay] base URL override: ${cleaned}`);
    return cleaned;
  }
  console.log(`[EdfaPay] base URL default: ${EDFAPAY_BASE_DEFAULT}`);
  return EDFAPAY_BASE_DEFAULT;
}

function getApiKey(): string {
  const key =
    process.env.EDFAPAY_API_KEY ||
    "5862984044E9C33DB3BB2812800CACB8A6A6B3CE221F25E467AA19BD06B3AE80";
  if (!key) throw new Error("EDFAPAY_API_KEY is not configured");
  return key.trim();
}

function getSdkToken(): string | undefined {
  const t = process.env.EDFAPAY_SDK_TOKEN;
  return t && t.trim().length > 0 ? t.trim() : undefined;
}

function getAuthMode(): EdfaPayAuthMode {
  const raw = (process.env.EDFAPAY_AUTH_MODE ?? "x-api-key").toLowerCase().trim();
  if (raw === "bearer" || raw === "x-sdk-token" || raw === "x-api-key") {
    return raw;
  }
  console.warn(`[EdfaPay] unknown EDFAPAY_AUTH_MODE="${raw}", falling back to x-api-key`);
  return "x-api-key";
}

/** يُرجع آخر 8 أحرف فقط من الـ token للـ logging الآمن. */
function tail8(token: string): string {
  return token.length <= 8 ? "****" : "..." + token.slice(-8);
}

function logAuth(mode: EdfaPayAuthMode, token: string) {
  if (process.env.NODE_ENV === "production") {
    console.log(`[EdfaPay] auth mode: ${mode}`);
  } else {
    console.log(`[EdfaPay] auth mode: ${mode} (token: ${tail8(token)})`);
  }
}

function authHeaders(): Record<string, string> {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const mode = getAuthMode();

  if (mode === "bearer" || mode === "x-sdk-token") {
    const sdkToken = getSdkToken();
    if (!sdkToken) throw new Error("EDFAPAY_SDK_TOKEN is not configured");

    if (mode === "bearer") {
      base["Authorization"] = `Bearer ${sdkToken}`;
      logAuth("bearer", sdkToken);
      return base;
    }

    base["X-SDK-Token"] = sdkToken;
    logAuth("x-sdk-token", sdkToken);
    return base;
  }

  const apiKey = getApiKey();
  base["X-API-KEY"] = apiKey;
  logAuth("x-api-key", apiKey);
  return base;
}

/** يستخرج sessionId من الرد (nested data.id أولاً، ثم fallback root snake_case/camelCase) */
function extractSessionId(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const obj = json as Record<string, unknown>;

  // الأشيع: EdfaPay يضع sessionId في data.id (nested)
  const data = obj.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.id === "string" && d.id.length > 1) {
      return d.id;
    }
    if (typeof d.sessionId === "string" && d.sessionId.length > 1) {
      return d.sessionId;
    }
    if (typeof d.session_id === "string" && d.session_id.length > 1) {
      return d.session_id;
    }
  }

  // احتياط: snake_case أو camelCase في root
  if (typeof obj.session_id === "string" && obj.session_id.length > 1) {
    return obj.session_id;
  }
  if (typeof obj.sessionId === "string" && obj.sessionId.length > 1) {
    return obj.sessionId;
  }

  return undefined;
}

/** يستخرج رابط الـ checkout من ردود مختلفة محتملة (camelCase أولاً — EdfaPay v2) */
function extractRedirectUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const data = p.data as Record<string, unknown> | undefined;
  const nestedData = data?.data as Record<string, unknown> | undefined;
  const result = p.result as Record<string, unknown> | undefined;
  const candidates = [
    // camelCase (EdfaPay current API)
    p.redirectUrl,
    p.checkoutUrl,
    data?.redirectUrl,
    data?.checkoutUrl,
    nestedData?.redirectUrl,
    nestedData?.checkoutUrl,
    result?.redirectUrl,
    // snake_case (backward compat)
    p.redirect_url,
    p.checkout_url,
    p.payment_url,
    p.url,
    data?.redirect_url,
    data?.checkout_url,
    data?.payment_url,
    data?.url,
    result?.redirect_url,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  // Diagnostic: dump available keys to help debug future API shape changes
  console.error("[EdfaPay] extractRedirectUrl: no URL found. Top-level keys:", Object.keys(p), "data keys:", data ? Object.keys(data) : "(no data)");
  return null;
}

function extractStatus(payload: unknown): EdfaPayStatusResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "invalid status payload" };
  }
  const p = payload as Record<string, unknown>;

  // filterTransaction يرجّع غالباً مصفوفة (data/transactions/content) — نأخذ الأحدث
  function pickFromArray(arr: unknown): Record<string, unknown> | null {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const items = arr.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
    if (items.length === 0) return null;
    // فرز تنازلي حسب finishedAt/createdAt/updatedAt إن وُجدت
    const ts = (o: Record<string, unknown>) =>
      String(o.finishedAt ?? o.createdAt ?? o.updatedAt ?? o.created_at ?? "");
    items.sort((a, b) => ts(b).localeCompare(ts(a)));
    return items[0];
  }

  const dataObj = p.data as unknown;
  const fromArr =
    pickFromArray(dataObj) ??
    pickFromArray(p.transactions) ??
    pickFromArray(p.content) ??
    pickFromArray((dataObj as Record<string, unknown> | undefined)?.content);

  // EdfaPay docs: status values هي Approved/Declined/Pending/Redirect (PascalCase)
  const raw = (
    p.status ??
    (dataObj && typeof dataObj === "object" && !Array.isArray(dataObj)
      ? (dataObj as Record<string, unknown>).status
      : undefined) ??
    fromArr?.status ??
    ""
  ).toString();

  if (raw === "Approved") return { ok: true, status: "success", raw: payload };
  if (raw === "Declined") return { ok: true, status: "failed", raw: payload };
  if (raw === "Pending" || raw === "Redirect")
    return { ok: true, status: "pending", raw: payload };

  // fallback case-insensitive
  const lower = raw.toLowerCase();
  if (lower === "approved" || lower === "success" || lower === "settled" || lower === "paid" || lower === "completed")
    return { ok: true, status: "success", raw: payload };
  if (lower === "declined" || lower === "failed" || lower === "error" || lower === "rejected")
    return { ok: true, status: "failed", raw: payload };
  if (lower === "pending" || lower === "redirect" || lower === "processing" || lower === "initiated" || lower === "authorized")
    return { ok: true, status: "pending", raw: payload };
  if (lower === "cancelled" || lower === "canceled")
    return { ok: true, status: "cancelled", raw: payload };

  return { ok: false, error: `unknown status: ${raw}`, raw: payload };
}

type BillingAddress = { country: string; city: string; zip: string; address: string };

// Country-appropriate billing defaults for EdfaPay's fraud engine.
// We don't collect the customer's street address, so we send a neutral,
// country-consistent placeholder. Country itself is derived from the phone.
const BILLING_DEFAULTS: Record<string, BillingAddress> = {
  SA: { country: "SA", city: "Riyadh", zip: "12345", address: "Riyadh, Saudi Arabia" },
  AE: { country: "AE", city: "Dubai", zip: "00000", address: "Dubai, United Arab Emirates" },
  KW: { country: "KW", city: "Kuwait City", zip: "00000", address: "Kuwait City, Kuwait" },
  BH: { country: "BH", city: "Manama", zip: "00000", address: "Manama, Bahrain" },
  QA: { country: "QA", city: "Doha", zip: "00000", address: "Doha, Qatar" },
  OM: { country: "OM", city: "Muscat", zip: "100", address: "Muscat, Oman" },
  EG: { country: "EG", city: "Cairo", zip: "11511", address: "Cairo, Egypt" },
  JO: { country: "JO", city: "Amman", zip: "11118", address: "Amman, Jordan" },
  IQ: { country: "IQ", city: "Baghdad", zip: "10001", address: "Baghdad, Iraq" },
  LB: { country: "LB", city: "Beirut", zip: "0000", address: "Beirut, Lebanon" },
  SY: { country: "SY", city: "Damascus", zip: "0000", address: "Damascus, Syria" },
  YE: { country: "YE", city: "Sanaa", zip: "0000", address: "Sanaa, Yemen" },
  PS: { country: "PS", city: "Gaza", zip: "0000", address: "Gaza, Palestine" },
  SD: { country: "SD", city: "Khartoum", zip: "11111", address: "Khartoum, Sudan" },
  LY: { country: "LY", city: "Tripoli", zip: "0000", address: "Tripoli, Libya" },
  TN: { country: "TN", city: "Tunis", zip: "1000", address: "Tunis, Tunisia" },
  DZ: { country: "DZ", city: "Algiers", zip: "16000", address: "Algiers, Algeria" },
  MA: { country: "MA", city: "Casablanca", zip: "20000", address: "Casablanca, Morocco" },
  TR: { country: "TR", city: "Istanbul", zip: "34000", address: "Istanbul, Turkey" },
  GB: { country: "GB", city: "London", zip: "SW1A 1AA", address: "London, United Kingdom" },
  US: { country: "US", city: "New York", zip: "10001", address: "New York, USA" },
};

/** Resolve EdfaPay billing/payer address from an ISO alpha-2 country (SA fallback). */
function resolveBillingAddress(country?: string): BillingAddress {
  const code = (country || "SA").toUpperCase();
  return BILLING_DEFAULTS[code] ?? { country: code, city: "N/A", zip: "00000", address: code };
}

/**
 * ينشئ جلسة دفع جديدة في EdfaPay.
 */
export async function initiatePayment(
  input: EdfaPayInitiateInput,
): Promise<EdfaPayInitiateResult> {
  const currency = (input.currency ?? "SAR").toUpperCase();
  const amount = Number(input.amount.toFixed(2));
  const description = input.description.slice(0, 100);

  // Flat camelCase payload (Spring Boot OrderLightDto — confirmed by Ashraf 19 May).
  // orderId MUST be a non-empty String. amount sent as String for safety.
  const safeFirstName = (input.customer.firstName || "Customer").slice(0, 32);
  const safeLastName = (input.customer.lastName || "Customer").slice(0, 32);

  // ⭐ Dynamic billing/payer address derived from the customer's country
  // (international card enablement 28 May 2026). Falls back to SA when unknown.
  const addr = resolveBillingAddress(input.customerCountry);


  const body = {
    // === الـ Core (Patches 1+2 محفوظة — لا تلمس) ===
    orderId: String(input.orderId),
    orderNumber: String(input.orderNumber),
    amount: String(amount),
    currency: currency,
    description: description,

    // === العميل بـ camelCase (Mahmoud — يعمل، لا تلمس) ===
    customerFirstName: safeFirstName,
    customerLastName: safeLastName,
    customerEmail: input.customer.email,
    customerPhone: input.customer.phone,

    // === ⭐ Billing fields (طلب Ashraf 21 May) ===
    billing_first_name: safeFirstName,
    billing_last_name: safeLastName,
    billing_email: input.customer.email,
    billing_phone: input.customer.phone,

    // === ⭐ Payer fields (docs.edfapay.com) ===
    // === ⭐ Address fields (إلزامية للـ fraud check) — dynamic per country ===
    payer_country: addr.country,
    billing_country: addr.country,
    payer_city: addr.city,
    billing_city: addr.city,
    payer_zip: addr.zip,
    billing_zip: addr.zip,
    payer_address: addr.address,
    billing_address: addr.address,



    // === ⭐ IP العميل (CRITICAL للـ fraud engine) ===
    payer_ip: input.customerIp || "127.0.0.1",
    customer_ip: input.customerIp || "127.0.0.1",

    // === URLs camelCase (Mahmoud — يعمل، لا تلمس) ===
    successUrl: input.successUrl,
    failureUrl: input.failUrl,
    callbackUrl: input.callbackUrl,
    termUrl3ds: input.successUrl,

    // === ⭐ URLs snake_case (docs.edfapay.com) ===
    success_url: input.successUrl,
    failure_url: input.failUrl,
    callback_url: input.callbackUrl,
    term_url_3ds: input.successUrl,
  };

  const primaryBase = getBaseUrl();
  const fallbackBase =
    primaryBase.includes("app-api")
      ? "https://demo-api.edfapay.com"
      : "https://app-api.edfapay.com";

  const candidateUrls = [
    `${primaryBase}/api/v1/payment-gateway/initiate`,
    `${fallbackBase}/api/v1/payment-gateway/initiate`,
  ];

  let lastErrorMsg = "تعذّر الاتصال ببوابة الدفع";
  let lastRaw: unknown = null;

  for (const url of candidateUrls) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      console.error(`[EdfaPay] network error on ${url}:`, err);
      lastErrorMsg = `خطأ في الاتصال بالبوابة (${err?.message || "Network Error"})`;
      continue;
    }

    let rawText: string | null = null;
    let json: unknown = null;
    try {
      rawText = await response.text();
      if (rawText) {
        try {
          json = JSON.parse(rawText);
        } catch {
          json = null;
        }
      }
    } catch {
      rawText = "[unable to read response body]";
    }

    if (!response.ok) {
      const messageFromJson =
        json && typeof json === "object" && "message" in (json as Record<string, unknown>)
          ? String((json as Record<string, unknown>).message)
          : null;
      lastErrorMsg = messageFromJson || `EdfaPay HTTP ${response.status}: ${rawText?.slice(0, 100)}`;
      lastRaw = json ?? rawText;

      console.error(`[EdfaPay] initiate failed on ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: rawText,
        errorJson: json,
      });

      // إذا كان 401 أو 404، جرّب الـ Endpoint البديل (demo vs live)
      if (response.status === 401 || response.status === 404) {
        continue;
      }
      break;
    }

    const redirectUrl = extractRedirectUrl(json);
    if (!redirectUrl) {
      console.error("[EdfaPay] no redirect_url in response:", json);
      return { ok: false, error: "استجابة بوابة الدفع غير متوقعة — لم يتم إرجاع رابط الدفع", raw: json };
    }

    const sessionId = extractSessionId(json);
    return { ok: true, redirectUrl, sessionId, raw: json };
  }

  // Log failure to DB for forensic debugging
  try {
    await supabaseAdmin.from("payment_transactions").insert({
      order_id: input.orderId,
      order_number: input.orderNumber,
      provider: "edfapay",
      amount,
      currency,
      status: "failed",
      callback_payload: {
        phase: "initiate_failed",
        sent_payload: body,
        raw_response: lastRaw as never,
      } as never,
      last_error: lastErrorMsg.slice(0, 500),
    });
  } catch (logErr) {
    console.error("[EdfaPay] failed to log transaction:", logErr);
  }

  return { ok: false, error: lastErrorMsg, raw: lastRaw };
}

/**
 * يستعلم عن حالة دفع لطلب معيّن (تحقق server-to-server من الـ webhook).
 */
export async function fetchPaymentStatus(orderId: string): Promise<EdfaPayStatusResult> {
  const url = `${getBaseUrl()}/api/v1/transactions/filterTransaction?order_id=${encodeURIComponent(orderId)}`;

  let response: Response;
  try {
    response = await fetch(url, { method: "GET", headers: authHeaders() });
  } catch (err) {
    console.error("[EdfaPay] network error during status:", err);
    return { ok: false, error: "تعذّر التحقق من حالة الدفع" };
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    console.error("[EdfaPay] status failed:", response.status, json);
    return { ok: false, error: `EdfaPay HTTP ${response.status}`, raw: json };
  }

  return extractStatus(json);
}

export function getEdfaPayMode(): EdfaPayMode {
  return getMode();
}
