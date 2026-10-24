/**
 * وحدة تكامل WhatsApp الرسمية عبر منصة كارتات (Cartat.net) — Server-only
 * متجر شاهد ستور (Shahid-Store)
 *
 * تعمل هذه الوحدة بأمان تام على الخادم وتتخطى الإرسال بسلاسة إذا لم تكن البيانات مضبوطة.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { STORE_ID } from "./store-config";

const CARTAT_BASE_URL = "https://api.cartat.net";

export interface CartatResponse {
  ok: boolean;
  id?: string;
  status?: string;
  error?: string;
  raw?: unknown;
}

function normalizePhoneNumber(raw: string): string {
  let cleaned = (raw || "").replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("00")) cleaned = cleaned.slice(2);
  if (cleaned.startsWith("05")) cleaned = "966" + cleaned.slice(1);
  return cleaned;
}

export function getCartatToken(): string {
  return (process.env.CARTAT_API_TOKEN || "").trim();
}

/**
 * جلب قائمة أرقام هواتف الإدارة والموظفين المسؤولة عن استقبال إشعارات الطلبات
 */
export async function getAdminPhonesAsync(): Promise<string[]> {
  try {
    // 1. القراءة من إعدادات المتجر في قاعدة البيانات أولاً (يمكن تعديلها من لوحة التحكم)
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

    // 2. فحص بنظام key-value القديم كاحتياط
    const { data: kvData } = await supabaseAdmin
      .from("store_settings")
      .select("value")
      .eq("store_id", STORE_ID)
      .eq("key", "cartat_admin_phones")
      .maybeSingle();

    if (kvData?.value && typeof kvData.value === "string") {
      const dbPhones = kvData.value
        .split(",")
        .map((p) => normalizePhoneNumber(p.trim()))
        .filter((p) => p.length >= 8);
      if (dbPhones.length > 0) return dbPhones;
    }
  } catch (e) {
    console.warn("[Cartat] database read error, fallback to env:", e);
  }

  const envVal = process.env.CARTAT_ADMIN_PHONES || process.env.CARTAT_ADMIN_PHONE || "";
  if (!envVal.trim()) return [];

  return envVal
    .split(",")
    .map((p) => normalizePhoneNumber(p.trim()))
    .filter((p) => p.length >= 8);
}

/**
 * إرسال رسالة نصية عبر منصة كارتات
 */
export async function sendCartatTextMessage(
  phone: string,
  message: string
): Promise<CartatResponse> {
  const token = getCartatToken();
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!token) {
    console.log("[Cartat] Skipped sending WhatsApp: No CARTAT_API_TOKEN configured.");
    return { ok: false, error: "CARTAT_API_TOKEN is not configured" };
  }

  if (!normalizedPhone || normalizedPhone.length < 8) {
    console.log("[Cartat] Skipped sending WhatsApp: Invalid phone number:", phone);
    return { ok: false, error: "Invalid phone number" };
  }

  try {
    const res = await fetch(`${CARTAT_BASE_URL}/message/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient: normalizedPhone,
        message,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as any;
    if (res.ok) {
      return { ok: true, id: data.id || data.message_id, raw: data };
    }
    return { ok: false, error: data.message || `HTTP ${res.status}`, raw: data };
  } catch (err: any) {
    console.warn("[Cartat] sendCartatTextMessage exception:", err);
    return { ok: false, error: err?.message || "Connection error" };
  }
}

/**
 * إرسال تأكيد الطلب للعميل عبر الواتساب فور نجاح الدفع
 */
export async function sendOrderConfirmation(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  total?: number;
}): Promise<void> {
  if (!params.customerPhone) return;

  const storeName = process.env.STORE_NAME || "ديوان البث";
  const msg = [
    `مرحباً ${params.customerName} 👋`,
    `شكراً لتسوقك من ${storeName}! ✨`,
    `تم تأكيد طلبك رقم: #${params.orderNumber} بنجاح ✅`,
    params.total ? `المبلغ الإجمالي: ${params.total} ر.س` : "",
    `المنتج: ${params.productName}`,
    `سيتم إرسال بيانات الاشتراك والتفعيل في أقرب وقت. نسعد دائماً بخدمتك 🌸`,
  ]
    .filter(Boolean)
    .join("\n\n");

  await sendCartatTextMessage(params.customerPhone, msg);
}

/**
 * إشعار الموظفين/الإدارة بطلب جديد مدفوع
 */
export async function notifyStaffNewOrder(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  total: number;
  productName: string;
  paymentMethod: string;
}): Promise<void> {
  const adminPhones = await getAdminPhonesAsync();
  if (adminPhones.length === 0) {
    console.log("[Cartat] No admin phones configured. Staff alert skipped.");
    return;
  }

  const alertMsg = [
    `🔔 إشعار طلب جديد مدفوع!`,
    `رقم الطلب: #${params.orderNumber}`,
    `العميل: ${params.customerName}`,
    `الجوال: ${params.customerPhone}`,
    params.customerEmail ? `البريد: ${params.customerEmail}` : "",
    `المنتج: ${params.productName}`,
    `الإجمالي: ${params.total} ر.س`,
    `طريقة الدفع: ${params.paymentMethod}`,
  ]
    .filter(Boolean)
    .join("\n");

  for (const phone of adminPhones) {
    try {
      await sendCartatTextMessage(phone, alertMsg);
    } catch (e) {
      console.warn(`[Cartat] Failed to alert admin ${phone}:`, e);
    }
  }
}
