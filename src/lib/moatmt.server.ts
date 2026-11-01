/**
 * وحدة تكامل WhatsApp الرسمية عبر منصة مؤتمت (Moatmt.ai) — Server-only
 * متجر ديوان البث (Shahid-Store)
 *
 * التوثيق: منصة مؤتمت لإدارة وتخصيص محادثات الواتساب وروبوتات الذكاء الاصطناعي
 * تعمل هذه الوحدة بأمان تام على الخادم وتتخطى الإرسال بسلاسة دون التسبب في أي تعطيل
 * لمسارات الشراء أو التسليم إذا لم تكن المفاتيح مضبوطة بعد.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { STORE_ID } from "./store-config";
import { normalizePhoneNumber } from "./whatsapp-phone";
import { buildOrderMessage, getWhatsappTemplateImage } from "./whatsapp-templates";

export interface MoatmtResponse {
  ok: boolean;
  id?: string;
  status?: string;
  error?: string;
  raw?: unknown;
}

const DEFAULT_STORE_NAME = "ديوان البث";
const DEFAULT_STORE_URL = process.env.STORE_URL || "https://ksa-tv.com";

/**
 * جلب إعدادات منصة مؤتمت (المفاتيح وروابط الربط)
 * تدعم القراءة من متغيرات البيئة (Cloudflare Secrets) أو من جدول إعدادات المتجر (store_settings)
 */
export async function getMoatmtConfig(): Promise<{
  apiKey: string;
  instanceId: string;
  baseUrl: string;
  sendUrl?: string;
}> {
  let apiKey = (process.env.MOATMT_API_KEY || process.env.MOATMT_ACCESS_TOKEN || "").trim();
  let instanceId = (process.env.MOATMT_INSTANCE_ID || "").trim();
  let baseUrl = (process.env.MOATMT_BASE_URL || "https://api.moatmt.ai").trim().replace(/\/+$/, "");
  let sendUrl = (process.env.MOATMT_SEND_URL || "").trim();

  // فحص قاعدة البيانات إذا لم تكن المتغيرات معينة في البيئة
  if (!apiKey || !instanceId) {
    try {
      const { data: storeRow } = await supabaseAdmin
        .from("store_settings")
        .select("payment_settings")
        .eq("store_id", STORE_ID)
        .maybeSingle();

      const ps = (storeRow as any)?.payment_settings;
      if (ps) {
        if (!apiKey && ps.moatmt_api_key) apiKey = String(ps.moatmt_api_key).trim();
        if (!instanceId && ps.moatmt_instance_id) instanceId = String(ps.moatmt_instance_id).trim();
        if (ps.moatmt_base_url) baseUrl = String(ps.moatmt_base_url).trim().replace(/\/+$/, "");
      }
    } catch (e) {
      console.warn("[Moatmt] Failed reading settings from DB, using env fallback:", e);
    }
  }

  return { apiKey, instanceId, baseUrl, sendUrl };
}

/**
 * جلب قائمة أرقام هواتف الإدارة والموظفين المسؤولة عن استقبال إشعارات الطلبات الجديدة
 */
export async function getAdminPhonesAsync(): Promise<string[]> {
  try {
    const { data: storeRow } = await supabaseAdmin
      .from("store_settings")
      .select("payment_settings, whatsapp_number")
      .eq("store_id", STORE_ID)
      .maybeSingle();

    const dbAdminPhones = (storeRow as any)?.payment_settings?.admin_phones;
    if (dbAdminPhones && typeof dbAdminPhones === "string" && dbAdminPhones.trim()) {
      const parsed = dbAdminPhones
        .split(",")
        .map((p: string) => normalizePhoneNumber(p.trim()))
        .filter((p: string) => p.length >= 8);
      if (parsed.length > 0) return parsed;
    }

    const { data: kvData } = await supabaseAdmin
      .from("store_settings")
      .select("value")
      .eq("store_id", STORE_ID)
      .eq("key", "moatmt_admin_phones")
      .maybeSingle();

    if (kvData?.value && typeof kvData.value === "string") {
      const dbPhones = kvData.value
        .split(",")
        .map((p) => normalizePhoneNumber(p.trim()))
        .filter((p) => p.length >= 8);
      if (dbPhones.length > 0) return dbPhones;
    }
  } catch (e) {
    console.warn("[Moatmt] database read admin phones error:", e);
  }

  const envVal =
    process.env.MOATMT_ADMIN_PHONES ||
    process.env.MOATMT_ADMIN_PHONE ||
    process.env.CARTAT_ADMIN_PHONES ||
    "";
  if (!envVal.trim()) return [];

  return envVal
    .split(",")
    .map((p) => normalizePhoneNumber(p.trim()))
    .filter((p) => p.length >= 8);
}

/**
 * إرسال رسالة نصية أو وسائط عبر منصة مؤتمت (Moatmt.ai)
 */
export async function sendMoatmtMessage(
  phone: string,
  message: string,
  mediaUrl?: string,
): Promise<MoatmtResponse> {
  const config = await getMoatmtConfig();
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!config.apiKey || !config.instanceId) {
    console.log(
      "[Moatmt] Skipped WhatsApp message: MOATMT_API_KEY or MOATMT_INSTANCE_ID not configured yet.",
    );
    return { ok: false, error: "MOATMT_CREDENTIALS_NOT_CONFIGURED" };
  }

  if (!normalizedPhone || normalizedPhone.length < 8) {
    console.log("[Moatmt] Skipped sending WhatsApp: Invalid phone number:", phone);
    return { ok: false, error: "Invalid phone number" };
  }

  // بناء حمولة الرسالة المتوافقة مع بوابات الواتساب ومؤتمت
  const payload: Record<string, unknown> = {
    instance_id: config.instanceId,
    recipient: normalizedPhone,
    number: normalizedPhone,
    phone: normalizedPhone,
    message,
    caption: message,
    type: mediaUrl ? "media" : "text",
  };

  if (mediaUrl) {
    payload.media_url = mediaUrl;
    payload.url = mediaUrl;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    "x-api-key": config.apiKey,
    "x-instance-id": config.instanceId,
  };

  // تحديد الرابط المناسب (دعم الرابط المخصص أو الافتراضي)
  const targetEndpoints = config.sendUrl
    ? [config.sendUrl]
    : mediaUrl
      ? [
          `${config.baseUrl}/message/media`,
          `${config.baseUrl}/v1/messages/send`,
          `${config.baseUrl}/send`,
        ]
      : [
          `${config.baseUrl}/message/text`,
          `${config.baseUrl}/v1/messages/send`,
          `${config.baseUrl}/send`,
        ];

  let lastError = "";

  for (const endpoint of targetEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (res.ok) {
        return {
          ok: true,
          id: data.id || data.message_id || data.msgId,
          status: data.status || "sent",
          raw: data,
        };
      }

      // إذا كان الخطأ 404 والمسار ليس الأخير، نجرب المسار التالي
      if (res.status === 404 && targetEndpoints.indexOf(endpoint) < targetEndpoints.length - 1) {
        continue;
      }

      lastError = data.message || data.error || `HTTP ${res.status}`;
      return { ok: false, error: lastError, raw: data };
    } catch (err: any) {
      lastError = err?.message || "Connection error";
    }
  }

  console.warn("[Moatmt] sendMoatmtMessage failed:", lastError);
  return { ok: false, error: lastError };
}

/* =========================================================================
   قوالب ودوال الأعمال الرسمية لمتجر ديوان البث (Business Actions)
   ========================================================================= */

/**
 * 1. إرسال تأكيد استلام الطلب وتأكيد الدفع للعميل فور نجاح عملية الدفع
 */
export async function sendOrderConfirmation(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName?: string;
  total?: number;
  timeEstimate?: string;
}): Promise<MoatmtResponse> {
  if (!params.customerPhone) return { ok: false, error: "No customer phone" };

  const message = buildOrderMessage("confirmation", {
    customer_name: params.customerName,
    order_number: params.orderNumber,
    product_name: params.productName,
    total: params.total,
    time_estimate: params.timeEstimate,
  });

  const mediaUrl = getWhatsappTemplateImage("confirmation");
  return sendMoatmtMessage(params.customerPhone, message, mediaUrl);
}

/**
 * 2. إرسال بيانات الاشتراك والتفعيل للعميل فور قيام الإدارة بتسليم الطلب
 */
export async function sendSubscriptionCredentials(params: {
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  productName?: string;
  username: string;
  password?: string;
  url?: string;
}): Promise<MoatmtResponse> {
  if (!params.customerPhone) return { ok: false, error: "No customer phone" };

  const message = buildOrderMessage("credentials", {
    customer_name: params.customerName,
    order_number: params.orderNumber,
    product_name: params.productName,
    username: params.username,
    password: params.password,
    url: params.url,
  });

  return sendMoatmtMessage(params.customerPhone, message);
}

/**
 * 3. إشعار الموظفين / الإدارة فور وجود طلب مدفوع جديد
 */
export async function notifyStaffNewOrder(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  total: number;
  productName: string;
  paymentMethod: string;
}): Promise<{ ok: boolean; results: MoatmtResponse[] }> {
  const adminPhones = await getAdminPhonesAsync();
  if (adminPhones.length === 0) {
    console.log("[Moatmt] No admin phones configured. Staff alert skipped.");
    return { ok: false, results: [] };
  }

  const alertMsg = [
    `🔔 إشعار طلب جديد مدفوع! - ${DEFAULT_STORE_NAME}`,
    "────────────────────",
    `📦 رقم الطلب: #${params.orderNumber}`,
    `👤 العميل: ${params.customerName}`,
    `📱 الجوال: ${params.customerPhone}`,
    params.customerEmail ? `✉️ البريد: ${params.customerEmail}` : "",
    `🛒 المنتج: ${params.productName}`,
    `💰 الإجمالي: ${params.total} ر.س`,
    `💳 طريقة الدفع: ${params.paymentMethod}`,
    "────────────────────",
    `🔗 لوحة الإدارة: ${DEFAULT_STORE_URL}/admin/orders`,
  ]
    .filter(Boolean)
    .join("\n");

  const results: MoatmtResponse[] = [];
  for (const phone of adminPhones) {
    try {
      const res = await sendMoatmtMessage(phone, alertMsg);
      results.push(res);
    } catch (e: any) {
      results.push({ ok: false, error: e?.message });
    }
  }

  return { ok: results.some((r) => r.ok), results };
}

/**
 * 4. إرسال تذكير بالسلة المتروكة مع كود خصم للعميل
 */
export async function sendAbandonedCartReminder(params: {
  customerName: string;
  customerPhone: string;
  productName?: string;
  productSlug?: string;
  total?: number;
  discountCode?: string;
  discountPercent?: number;
  recoveryUrl?: string;
}): Promise<MoatmtResponse> {
  if (!params.customerPhone) return { ok: false, error: "No customer phone" };

  const message = buildOrderMessage("abandoned_recovery", {
    customer_name: params.customerName,
    product_name: params.productName,
    product_slug: params.productSlug,
    total: params.total,
    discount_code: params.discountCode || "DIWAN10",
    discount_percent: params.discountPercent || 10,
    url: params.recoveryUrl,
  });

  const mediaUrl = getWhatsappTemplateImage("abandoned_recovery");
  return sendMoatmtMessage(params.customerPhone, message, mediaUrl);
}

/**
 * 5. إرسال طلب تقييم الخدمة للعميل مع رابط تقييم المنتج
 */
export async function sendOrderReviewRequest(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName?: string;
  productSlug?: string;
}): Promise<MoatmtResponse> {
  if (!params.customerPhone) return { ok: false, error: "No customer phone" };

  const message = buildOrderMessage("review_request", {
    customer_name: params.customerName,
    order_number: params.orderNumber,
    product_name: params.productName,
    product_slug: params.productSlug,
  });

  const mediaUrl = getWhatsappTemplateImage("review_request");
  return sendMoatmtMessage(params.customerPhone, message, mediaUrl);
}

/* =========================================================================
   محرك المعالجة التلقائية للسلات المتروكة وطلبات التقييم (Cron Engine)
   ========================================================================= */

/**
 * جلب وقت الانتظار للسلات المتروكة بالدقائق (يقرأ عدد الساعات من الإعدادات أولاً)
 */
export async function getAbandonedCartDelayMinutes(): Promise<number> {
  try {
    const { data: rows } = await supabaseAdmin
      .from("store_settings")
      .select("key, value")
      .eq("store_id", STORE_ID)
      .in("key", [
        "moatmt_abandoned_delay_hours",
        "moatmt_abandoned_delay_minutes",
        "cartat_abandoned_delay_minutes",
      ]);

    const map = new Map((rows || []).map((r) => [r.key, r.value]));

    // 1. الأولوية لحقل الساعات المحدد من لوحة التحكم
    const hoursVal = map.get("moatmt_abandoned_delay_hours");
    if (hoursVal && !isNaN(Number(hoursVal)) && Number(hoursVal) > 0) {
      return Math.round(Number(hoursVal) * 60);
    }

    // 2. التحقق من حقل الدقائق كـ Fallback
    const minVal =
      map.get("moatmt_abandoned_delay_minutes") || map.get("cartat_abandoned_delay_minutes");
    if (minVal && !isNaN(Number(minVal)) && Number(minVal) > 0) {
      return Number(minVal);
    }
  } catch (e) {
    console.warn("[getAbandonedCartDelayMinutes] db read error:", e);
  }
  return 60; // افتراضياً ساعة واحدة (60 دقيقة)
}

/**
 * جلب رابط الصورة المخصصة لرسالة السلة المتروكة
 */
export async function getAbandonedCustomImageUrl(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("store_settings")
      .select("value")
      .eq("store_id", STORE_ID)
      .in("key", ["moatmt_abandoned_image_url", "cartat_abandoned_image_url"])
      .maybeSingle();

    if (data?.value && typeof data.value === "string" && data.value.startsWith("http")) {
      return data.value.trim();
    }
  } catch (e) {
    console.warn("[getAbandonedCustomImageUrl] db read error:", e);
  }
  return "https://ksa-tv.com/images/abandoned-orders.png";
}

/**
 * جلب كود الخصم ونسبته المخصصة للسلات المتروكة من إعدادات المتجر
 */
export async function getAbandonedDiscountConfig(): Promise<{ code: string; percent: number }> {
  let code = "DIWAN10";
  let percent = 10;
  try {
    const { data: rows } = await supabaseAdmin
      .from("store_settings")
      .select("key, value")
      .eq("store_id", STORE_ID)
      .in("key", ["moatmt_discount_code", "moatmt_discount_percent"]);

    const map = new Map((rows || []).map((r) => [r.key, r.value]));
    if (map.get("moatmt_discount_code")) {
      code = map.get("moatmt_discount_code")!.trim().toUpperCase();
    }
    if (map.get("moatmt_discount_percent") && !isNaN(Number(map.get("moatmt_discount_percent")))) {
      percent = Number(map.get("moatmt_discount_percent"));
    }
  } catch (e) {
    console.warn("[getAbandonedDiscountConfig] db read error:", e);
  }
  return { code, percent };
}

/**
 * جلب وقت الانتظار لطلب التقييم بالدقائق (يقرأ عدد الساعات من الإعدادات أولاً)
 */
export async function getReviewRequestDelayMinutes(): Promise<number> {
  try {
    const { data: rows } = await supabaseAdmin
      .from("store_settings")
      .select("key, value")
      .eq("store_id", STORE_ID)
      .in("key", [
        "moatmt_review_delay_hours",
        "moatmt_review_delay_minutes",
        "cartat_review_delay_minutes",
      ]);

    const map = new Map((rows || []).map((r) => [r.key, r.value]));

    const hoursVal = map.get("moatmt_review_delay_hours");
    if (hoursVal && !isNaN(Number(hoursVal)) && Number(hoursVal) > 0) {
      return Math.round(Number(hoursVal) * 60);
    }

    const minVal =
      map.get("moatmt_review_delay_minutes") || map.get("cartat_review_delay_minutes");
    if (minVal && !isNaN(Number(minVal)) && Number(minVal) > 0) {
      return Number(minVal);
    }
  } catch (e) {
    console.warn("[getReviewRequestDelayMinutes] db read error:", e);
  }
  return 120; // ساعتان افتراضياً
}

/**
 * جلب رابط الصورة المخصصة لرسالة طلب التقييم
 */
export async function getReviewCustomImageUrl(): Promise<string | undefined> {
  try {
    const { data } = await supabaseAdmin
      .from("store_settings")
      .select("value")
      .eq("store_id", STORE_ID)
      .in("key", ["moatmt_review_image_url", "cartat_review_image_url"])
      .maybeSingle();

    if (data?.value && typeof data.value === "string" && data.value.startsWith("http")) {
      return data.value.trim();
    }
  } catch (e) {
    console.warn("[getReviewCustomImageUrl] db read error:", e);
  }
  return "https://ksa-tv.com/images/review-banner.png";
}

/**
 * 6. معالجة واسترجاع السلات المتروكة تلقائياً
 */
export async function processAbandonedCartsAutomatic(options?: {
  minMinutes?: number;
  maxHours?: number;
  limit?: number;
}): Promise<{ processed: number; sent: number; errors: number }> {
  const minMin = options?.minMinutes ?? (await getAbandonedCartDelayMinutes());
  const maxH = options?.maxHours ?? 24;
  const maxLimit = options?.limit ?? 15;

  const minCutoff = new Date(Date.now() - minMin * 60 * 1000).toISOString();
  const maxCutoff = new Date(Date.now() - maxH * 60 * 60 * 1000).toISOString();

  const ONLINE_PAYMENT_METHODS = ["card", "edfapay", "ngenius", "network_international", "credit_card", "tabby"];

  try {
    const { data: candidates, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total, items, notes, status, created_at, payment_method")
      .eq("store_id", STORE_ID)
      .in("status", ["pending", "initiated", "payment_failed"])
      .in("payment_method", ONLINE_PAYMENT_METHODS)
      .or("notes.is.null,notes.not.ilike.%abandoned_recovery%")
      .lte("created_at", minCutoff)
      .gte("created_at", maxCutoff)
      .order("created_at", { ascending: false })
      .limit(maxLimit);

    if (error || !candidates) {
      console.warn("[processAbandonedCartsAutomatic] Query error:", error);
      return { processed: 0, sent: 0, errors: 0 };
    }

    let sent = 0;
    let errors = 0;

    const discountCfg = await getAbandonedDiscountConfig();
    const customImageUrl = await getAbandonedCustomImageUrl();

    for (const order of candidates) {
      if (sent >= maxLimit) break;

      const { data: freshOrder } = await supabaseAdmin
        .from("orders")
        .select("id, status, notes, items, payment_method, order_number")
        .eq("id", order.id)
        .maybeSingle();

      if (!freshOrder) continue;

      if (
        freshOrder.status === "paid" ||
        freshOrder.status === "completed" ||
        freshOrder.status === "fulfilled"
      ) {
        continue;
      }

      // فحص استباقي لدى بوابات الدفع للتأكد هل تم سداد الطلب بالفعل لتفادي إرسال تذكير خاطئ
      let wasActuallyPaid = false;
      const orderMethod = freshOrder.payment_method || order.payment_method;

      if (orderMethod === "ngenius" || orderMethod === "network_international") {
        try {
          const freshItems = Array.isArray(freshOrder.items)
            ? freshOrder.items
            : Array.isArray(order.items)
              ? order.items
              : [];
          let ngeniusRef = (freshItems[0] as any)?.ngenius_ref || null;

          if (!ngeniusRef) {
            const { data: tx } = await supabaseAdmin
              .from("payment_transactions")
              .select("provider_order_id")
              .eq("order_id", order.id)
              .maybeSingle();
            if (tx?.provider_order_id) ngeniusRef = tx.provider_order_id;
          }

          if (ngeniusRef) {
            const { fetchNGeniusOrderStatus, fulfillSuccessfulOrder } = await import("./ngenius.server");
            const check = await fetchNGeniusOrderStatus(ngeniusRef);
            if (check.ok && check.status === "success") {
              await fulfillSuccessfulOrder(order.id, "ngenius");
              wasActuallyPaid = true;
            }
          }
        } catch (gatewayCheckErr) {
          console.warn("[processAbandonedCartsAutomatic] N-Genius check warning:", gatewayCheckErr);
        }
      } else if (orderMethod === "edfapay" || orderMethod === "card") {
        try {
          const { fetchPaymentStatus } = await import("./edfapay.server");
          const { fulfillSuccessfulOrder } = await import("./ngenius.server");
          const edfaCheck = await fetchPaymentStatus(order.id);
          if (edfaCheck.ok && edfaCheck.status === "success") {
            await fulfillSuccessfulOrder(order.id, "edfapay");
            wasActuallyPaid = true;
          }
        } catch (edfaErr) {
          console.warn("[processAbandonedCartsAutomatic] EdfaPay check warning:", edfaErr);
        }
      }

      if (wasActuallyPaid) continue;

      const freshNotes = freshOrder?.notes || "";
      if (
        freshNotes.includes("abandoned_recovery") ||
        freshNotes.includes("abandoned_discount") ||
        freshNotes.includes("abandoned_auto_sent") ||
        freshNotes.includes("abandoned_in_progress")
      ) {
        continue;
      }

      // قفل لحظي لمنع المعالجة المتزامنة
      const lockingNotes = freshNotes.trim() + `\n[WHATSAPP_LOG:abandoned_in_progress]`;
      await supabaseAdmin.from("orders").update({ notes: lockingNotes }).eq("id", order.id);

      const items = Array.isArray(order.items) ? order.items : [];
      const firstItem = items[0] as any;
      const productName = firstItem?.name_ar || firstItem?.product_name || firstItem?.name;
      const productSlug = firstItem?.product_slug || firstItem?.slug;

      const res = await sendAbandonedCartReminder({
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        productName,
        productSlug,
        total: Number(order.total) || undefined,
        discountCode: discountCfg.code,
        discountPercent: discountCfg.percent,
        recoveryUrl: productSlug ? `${DEFAULT_STORE_URL}/checkout/${productSlug}` : `${DEFAULT_STORE_URL}/checkout`,
        imageUrl: customImageUrl,
      });

      if (res.ok) {
        sent++;
        const logEntry = JSON.stringify({
          template: "abandoned_recovery",
          sent_at: new Date().toISOString(),
          sent_by: "system_auto",
          auto: true,
          moatmt_msg_id: res.id,
        });
        const finalNotes = lockingNotes.replace(
          "[WHATSAPP_LOG:abandoned_in_progress]",
          `[WHATSAPP_LOG:${logEntry}]`,
        );
        await supabaseAdmin
          .from("orders")
          .update({ notes: finalNotes, updated_at: new Date().toISOString() })
          .eq("id", order.id);

        console.log(`[Moatmt Auto] ✅ Sent abandoned reminder to order #${order.order_number}`);
      } else {
        errors++;
        const revertedNotes = lockingNotes.replace("\n[WHATSAPP_LOG:abandoned_in_progress]", "").trim();
        await supabaseAdmin.from("orders").update({ notes: revertedNotes }).eq("id", order.id);
      }
    }

    return { processed: candidates.length, sent, errors };
  } catch (err) {
    console.error("[processAbandonedCartsAutomatic] Exception:", err);
    return { processed: 0, sent: 0, errors: 0 };
  }
}

/**
 * 7. إرسال طلبات التقييم للعملاء تلقائياً بعد مرور المدة المحددة من تسليم الطلب
 */
export async function processAutomaticReviewRequests(options?: {
  delayMinutes?: number;
  maxHours?: number;
  limit?: number;
}): Promise<{ processed: number; sent: number; errors: number }> {
  const delayMin = options?.delayMinutes ?? (await getReviewRequestDelayMinutes());
  const maxH = options?.maxHours ?? 168; // خلال 7 أيام من التسليم
  const maxLimit = options?.limit ?? 15;

  const minCutoff = new Date(Date.now() - delayMin * 60 * 1000).toISOString();
  const maxCutoff = new Date(Date.now() - maxH * 60 * 60 * 1000).toISOString();

  try {
    const { data: candidates, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, items, notes, status, updated_at")
      .eq("store_id", STORE_ID)
      .in("status", ["completed", "fulfilled"])
      .or("notes.is.null,notes.not.ilike.%review_request%")
      .lte("updated_at", minCutoff)
      .gte("updated_at", maxCutoff)
      .order("updated_at", { ascending: false })
      .limit(maxLimit);

    if (error || !candidates) {
      return { processed: 0, sent: 0, errors: 0 };
    }

    let sent = 0;
    let errors = 0;
    const reviewImage = await getReviewCustomImageUrl();

    for (const order of candidates) {
      if (sent >= maxLimit) break;

      const { data: freshOrder } = await supabaseAdmin
        .from("orders")
        .select("notes, items")
        .eq("id", order.id)
        .maybeSingle();

      const freshNotes = freshOrder?.notes || "";
      const freshItems = Array.isArray(freshOrder?.items) ? freshOrder.items : [];

      const isAlreadySent =
        freshNotes.includes("review_request") ||
        freshNotes.includes("review_in_progress") ||
        freshNotes.includes('"template":"review_request"') ||
        freshItems.some((it: any) => it?.review_requested === true);

      if (isAlreadySent) continue;

      const lockingNotes = freshNotes.trim() + `\n[WHATSAPP_LOG:review_in_progress]`;
      await supabaseAdmin.from("orders").update({ notes: lockingNotes }).eq("id", order.id);

      const items = freshItems;
      const firstItem = items[0] as any;
      const productName = firstItem?.name_ar || firstItem?.product_name || firstItem?.name;
      const productSlug = firstItem?.product_slug || firstItem?.slug;

      const res = await sendOrderReviewRequest({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        productName,
        productSlug,
      });

      if (res.ok) {
        sent++;
        const logEntry = JSON.stringify({
          template: "review_request",
          sent_at: new Date().toISOString(),
          sent_by: "system_auto",
          auto: true,
          moatmt_msg_id: res.id,
        });
        const finalNotes = lockingNotes.replace(
          "[WHATSAPP_LOG:review_in_progress]",
          `[WHATSAPP_LOG:${logEntry}]`,
        );
        const updatedItems = items.map((it: any) => ({ ...it, review_requested: true }));
        await supabaseAdmin
          .from("orders")
          .update({
            notes: finalNotes,
            items: updatedItems,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        console.log(`[Moatmt Auto] ✅ Sent review request to order #${order.order_number}`);
      } else {
        errors++;
        const revertedNotes = lockingNotes.replace("\n[WHATSAPP_LOG:review_in_progress]", "").trim();
        await supabaseAdmin.from("orders").update({ notes: revertedNotes }).eq("id", order.id);
      }
    }

    return { processed: candidates.length, sent, errors };
  } catch (err) {
    console.error("[processAutomaticReviewRequests] Exception:", err);
    return { processed: 0, sent: 0, errors: 0 };
  }
}

