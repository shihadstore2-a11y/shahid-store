import { supabase } from "@/integrations/supabase/client";

export type StoreInfo = {
  id: string;
  slug: string;
  name_ar: string;
  name_en?: string | null;
  domain?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  settings?: Record<string, any>;
};

export const DEFAULT_SHAHID_STORE: StoreInfo = {
  id: "7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01",
  slug: "shahid-store",
  name_ar: "شاهد ستور",
  name_en: "Shahid Store",
  domain: "shahid-store.digitaneo.workers.dev",
  logo_url: "/logo.webp",
  is_active: true,
  settings: {},
};

/** تنظيف الـ Hostname من المنافذ والبروتوكولات */
export function cleanHostname(rawHost?: string | null): string {
  if (!rawHost) return "";
  let host = rawHost.trim().toLowerCase();

  if (host.includes("://")) {
    try {
      host = new URL(host).hostname;
    } catch {
      host = host.split("://")[1] || host;
    }
  }

  // إزالة رقم المنفذ إن وُجد (مثل localhost:3000)
  if (host.includes(":")) {
    host = host.split(":")[0];
  }

  return host.replace(/\/+$/, "");
}

type CacheEntry = {
  store: StoreInfo;
  expiresAt: number;
};

// كاش في الذاكرة لتسريع استبانة الدومينات وتجنب استعلام قاعدة البيانات في كل طلب
const domainCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 دقائق

export function clearDomainCache(): void {
  domainCache.clear();
}

export function setDomainCache(domain: string, store: StoreInfo, ttlMs = CACHE_TTL_MS): void {
  const clean = cleanHostname(domain);
  domainCache.set(clean, {
    store,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * استبانة المتجر ديناميكياً حسب الدومين أو معلمات الاستعلام
 */
export async function resolveStoreByDomain(
  rawHost?: string | null,
  queryParamStore?: string | null
): Promise<StoreInfo> {
  // 1. فحص معلمة الاستعلام (للتطوير المحلي والاختبار التجريبي ?store=slug أو ?store_id=uuid)
  if (queryParamStore && queryParamStore.trim()) {
    const candidate = queryParamStore.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate);
    
    try {
      let query = supabase.from("stores").select("id, slug, name_ar, name_en, domain, logo_url, is_active, settings");
      if (isUuid) {
        query = query.eq("id", candidate);
      } else {
        query = query.eq("slug", candidate);
      }
      const { data, error } = await query.eq("is_active", true).maybeSingle();
      if (!error && data) {
        return data as StoreInfo;
      }
    } catch {
      // الاستمرار في الفحص في حال الخطأ
    }
  }

  const hostname = cleanHostname(rawHost);

  // 2. إذا كان الطلب من بيئة التطوير المحلي الافتراضية
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return DEFAULT_SHAHID_STORE;
  }

  // 3. فحص الكاش الداخلي في الذاكرة
  const cached = domainCache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.store;
  }

  try {
    // 4. محاولة المطابقة المباشرة مع عمود domain في جدول stores
    const { data: domainMatch, error: domainError } = await supabase
      .from("stores")
      .select("id, slug, name_ar, name_en, domain, logo_url, is_active, settings")
      .eq("domain", hostname)
      .eq("is_active", true)
      .maybeSingle();

    if (!domainError && domainMatch) {
      const store = domainMatch as StoreInfo;
      setDomainCache(hostname, store);
      return store;
    }

    // 5. محاولة المطابقة عبر الـ Subdomain (مثل cobra.digitaneo.workers.dev -> slug: cobra)
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const subdomain = parts[0];
      if (subdomain && subdomain !== "www") {
        const { data: slugMatch, error: slugError } = await supabase
          .from("stores")
          .select("id, slug, name_ar, name_en, domain, logo_url, is_active, settings")
          .eq("slug", subdomain)
          .eq("is_active", true)
          .maybeSingle();

        if (!slugError && slugMatch) {
          const store = slugMatch as StoreInfo;
          setDomainCache(hostname, store);
          return store;
        }
      }
    }
  } catch (err) {
    console.error("Error in resolveStoreByDomain:", err);
  }

  // 6. في حال عدم العثور على أي مطابقة، التوجيه للمتجر الافتراضي
  setDomainCache(hostname, DEFAULT_SHAHID_STORE, 60 * 1000); // كاش دقيقة واحدة للمتخلف
  return DEFAULT_SHAHID_STORE;
}

/**
 * استخراج بيانات المتجر من كائن الـ Request مباشرة
 */
export async function resolveStoreFromRequest(request: Request): Promise<StoreInfo> {
  const url = new URL(request.url);
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.hostname;
  const storeQuery = url.searchParams.get("store") || url.searchParams.get("store_id");
  return resolveStoreByDomain(hostHeader, storeQuery);
}
