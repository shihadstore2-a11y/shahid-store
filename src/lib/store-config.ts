/**
 * طبقة التحديد المركزي للمتجر (Unified Store Resolver)
 * -----------------------------------------------------------
 * مسؤولة عن استخراج والتحقق من معرّف المتجر النشط (Active Store ID)
 * لدعم تعدد المتاجر (Multi-Tenant) بأمان تام بين الواجهة والخادم.
 *
 * تصنيف المتغيرات:
 * 1. Public Store Identifier: (STORE_ID / VITE_STORE_ID) متاح للعميل والمخدم، غير سري.
 * 2. Server Environment Variables: (wrangler.jsonc vars) محقونة لكل Worker على حدة.
 * 3. Sensitive Secrets: (SUPABASE_SERVICE_ROLE_KEY, EDFAPAY_API_KEY) سرية وخاصة بالخادم فقط.
 */

export const DEFAULT_SHAHID_STORE_ID = "7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01";
export const DEFAULT_SHAHID_STORE_SLUG = "shahid-store";

/** التحقق من صحة صيغة الـ UUID */
export function isStoreIdValid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/** استخراج المعرف النشط للمتجر مع التحقق الصارم */
export function getActiveStoreId(): string {
  let candidate: string | undefined;

  // 1. فحص متغيرات Vite في بيئة المتصفح أو البناء
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_STORE_ID) {
    candidate = String(import.meta.env.VITE_STORE_ID).trim();
  }

  // 2. فحص متغيرات Node/Worker Process في بيئة الخادم
  if (!candidate && typeof process !== "undefined") {
    candidate = (process.env?.STORE_ID || process.env?.VITE_STORE_ID)?.trim();
  }

  if (candidate && isStoreIdValid(candidate)) {
    return candidate;
  }

  // القيمة الاحتياطية المعتمدة لمتجر شاهد ستور الحالي
  return DEFAULT_SHAHID_STORE_ID;
}

/** استخراج Slug المتجر النشط */
export function getActiveStoreSlug(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_STORE_SLUG) {
    return String(import.meta.env.VITE_STORE_SLUG).trim();
  }
  if (typeof process !== "undefined" && process.env?.STORE_SLUG) {
    return String(process.env.STORE_SLUG).trim();
  }
  return DEFAULT_SHAHID_STORE_SLUG;
}

/** الثابت المعتمد للاستخدام المباشر في الاستعلامات */
export const STORE_ID: string = getActiveStoreId();
