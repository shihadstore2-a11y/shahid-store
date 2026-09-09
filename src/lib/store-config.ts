/**
 * طبقة التحديد المركزي والديناميكي للمتجر (Dynamic Store Resolver & Config)
 * -------------------------------------------------------------------------
 * مسؤولة عن استخراج والتحقق من معرّف المتجر النشط (Active Store ID) ديناميكياً
 * في زمن التشغيل (Runtime) بالاعتماد على:
 * 1. سياق الخادم المعزول للطلب (Server Request Context عبر AsyncLocalStorage)
 * 2. سياق ترطيب المتصفح (Client Hydration Context عبر window.__STORE_CONTEXT__)
 * 3. اسم النطاق (Domain/Hostname)
 * 4. المتغيرات البيئية أو القيمة الاحتياطية المعتمدة
 */

import {
  DEFAULT_SHAHID_STORE,
  type StoreInfo,
} from "./store-resolver";

declare global {
  interface Window {
    __STORE_CONTEXT__?: StoreInfo;
  }
}

export const DEFAULT_SHAHID_STORE_ID = DEFAULT_SHAHID_STORE.id;
export const DEFAULT_SHAHID_STORE_SLUG = DEFAULT_SHAHID_STORE.slug;

/** التحقق من صحة صيغة الـ UUID */
export function isStoreIdValid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

// محاولة تحميل مخزن سياق الخادم بحذر لتجنب مشاكل التجميع في المتصفح
let getServerStoreFn: (() => StoreInfo | undefined) | null = null;
if (typeof window === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serverModule = require("./store-context.server");
    if (serverModule && typeof serverModule.getActiveServerStore === "function") {
      getServerStoreFn = serverModule.getActiveServerStore;
    }
  } catch {
    // في بيئة المتصفح أو بيئات الاختبار البسيطة
  }
}

/**
 * الحصول على كائن بيانات المتجر النشط بالكامل ديناميكياً
 */
export function getActiveStore(): StoreInfo {
  // 1. في بيئة الخادم (SSR / Server Functions / Worker Fetch): قراءة المتجر من سياق الطلب الحالي
  if (getServerStoreFn) {
    const serverStore = getServerStoreFn();
    if (serverStore) return serverStore;
  }

  // 2. في بيئة المتصفح: فحص سياق المتجر المحقون من الخادم
  if (typeof window !== "undefined" && window.__STORE_CONTEXT__) {
    return window.__STORE_CONTEXT__;
  }

  // 3. فحص المتغيرات البيئية للتوافق مع عمليات النشر القديمة إن وُجدت
  let envId: string | undefined;
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_STORE_ID) {
    envId = String(import.meta.env.VITE_STORE_ID).trim();
  } else if (typeof process !== "undefined" && process.env?.STORE_ID) {
    envId = String(process.env.STORE_ID).trim();
  }

  if (envId && isStoreIdValid(envId)) {
    if (envId === DEFAULT_SHAHID_STORE_ID) {
      return DEFAULT_SHAHID_STORE;
    }
    return {
      id: envId,
      slug: (typeof process !== "undefined" && process.env?.STORE_SLUG) || "custom-store",
      name_ar: "المتجر الحالي",
      name_en: "Current Store",
      is_active: true,
    };
  }

  // 4. القيمة الاحتياطية الافتراضية
  return DEFAULT_SHAHID_STORE;
}

/** استخراج المعرف النشط للمتجر ديناميكياً */
export function getActiveStoreId(): string {
  return getActiveStore().id;
}

/** استخراج Slug المتجر النشط ديناميكياً */
export function getActiveStoreSlug(): string {
  return getActiveStore().slug;
}

/**
 * كائن STORE_ID الديناميكي المتوافق رجعياً (Dynamic Backward-Compatible Store ID)
 * -----------------------------------------------------------------------------
 * يتصرف كـ string أينما تم استخدامه:
 * - في استعلامات Supabase: .eq("store_id", STORE_ID) -> يُستدعى .toString() ديناميكياً
 * - في كائنات JSON: { store_id: STORE_ID } -> يُستدعى .toJSON() ديناميكياً
 * - في مفاتيح TanStack Query: ['products', STORE_ID] -> يُستدعى JSON.stringify
 * - في القوالب النصية: `${STORE_ID}` -> يُستدعى [Symbol.toPrimitive]
 */
export const STORE_ID: string = {
  toString() {
    return getActiveStoreId();
  },
  valueOf() {
    return getActiveStoreId();
  },
  toJSON() {
    return getActiveStoreId();
  },
  [Symbol.toPrimitive](hint: string) {
    return getActiveStoreId();
  },
} as unknown as string;
