import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STORE_ID } from "./store-config";

export type StoreSettings = {
  storeName: string;
  whatsappNumber: string;
  officialEmail: string;
  telegramChannel: string;

  // إعدادات بوت واتساب مؤتمت (Moatmt Bot) والسلات المتروكة
  moatmtAdminPhones?: string;
  moatmtAbandonedDelayHours?: string; // وقت إرسال رسالة السلة المتروكة بالساعات
  moatmtAbandonedImageUrl?: string;
  moatmtDiscountCode?: string;
  moatmtDiscountPercent?: string;
  moatmtReviewDelayHours?: string; // وقت إرسال طلب التقييم بالساعات
  moatmtReviewImageUrl?: string;

  // إعدادات التتبع والبكسلات الإعلانية
  googleSiteVerification?: string;
  gtmId?: string;
  ga4MeasurementId?: string;
  googleAdsId?: string;
  googleAdsPurchaseLabel?: string;
  metaPixelId?: string;
  snapchatPixelId?: string;
  tiktokPixelId?: string;
};

const DEFAULT_STORE: StoreSettings = {
  storeName: "ديوان البث",
  whatsappNumber: "966500451602",
  officialEmail: "info@ksa-tv.com",
  telegramChannel: "",
  moatmtAdminPhones: "",
  moatmtAbandonedDelayHours: "1", // 1 ساعة افتراضياً
  moatmtAbandonedImageUrl: "https://ksa-tv.com/images/abandoned-orders.png",
  moatmtDiscountCode: "DIWAN10",
  moatmtDiscountPercent: "10",
  moatmtReviewDelayHours: "2", // ساعتان بعد التسليم
  moatmtReviewImageUrl: "https://ksa-tv.com/images/review-banner.png",
  googleSiteVerification: "",
  gtmId: "",
  ga4MeasurementId: "",
  googleAdsId: "",
  googleAdsPurchaseLabel: "",
  metaPixelId: "",
  snapchatPixelId: "",
  tiktokPixelId: "",
};

const KEY_MAP: Record<keyof StoreSettings, string> = {
  storeName: "store_name",
  whatsappNumber: "whatsapp_number",
  officialEmail: "contact_email",
  telegramChannel: "telegram_channel",
  moatmtAdminPhones: "moatmt_admin_phones",
  moatmtAbandonedDelayHours: "moatmt_abandoned_delay_hours",
  moatmtAbandonedImageUrl: "moatmt_abandoned_image_url",
  moatmtDiscountCode: "moatmt_discount_code",
  moatmtDiscountPercent: "moatmt_discount_percent",
  moatmtReviewDelayHours: "moatmt_review_delay_hours",
  moatmtReviewImageUrl: "moatmt_review_image_url",
  googleSiteVerification: "google_site_verification",
  gtmId: "gtm_id",
  ga4MeasurementId: "ga4_measurement_id",
  googleAdsId: "google_ads_id",
  googleAdsPurchaseLabel: "google_ads_purchase_label",
  metaPixelId: "meta_pixel_id",
  snapchatPixelId: "snapchat_pixel_id",
  tiktokPixelId: "tiktok_pixel_id",
};

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.from("store_settings").select("key, value");
  if (error) throw error;
  const map: Record<string, string | null> = {};
  (data ?? []).forEach((r) => {
    map[r.key] = r.value;
  });

  // حساب الساعات من الدقائق القديمة كـ Fallback إن وُجدت
  const abandonedHoursFallback = map.moatmt_abandoned_delay_hours ||
    (map.cartat_abandoned_delay_minutes ? String(Math.round(Number(map.cartat_abandoned_delay_minutes) / 60)) : null) ||
    DEFAULT_STORE.moatmtAbandonedDelayHours;

  const reviewHoursFallback = map.moatmt_review_delay_hours ||
    (map.cartat_review_delay_minutes ? String(Math.round(Number(map.cartat_review_delay_minutes) / 60)) : null) ||
    DEFAULT_STORE.moatmtReviewDelayHours;

  return {
    storeName: map.store_name || DEFAULT_STORE.storeName,
    whatsappNumber: map.whatsapp_number || DEFAULT_STORE.whatsappNumber,
    officialEmail: map.contact_email || DEFAULT_STORE.officialEmail,
    telegramChannel: map.telegram_channel || DEFAULT_STORE.telegramChannel,
    moatmtAdminPhones: map.moatmt_admin_phones || map.cartat_admin_phones || DEFAULT_STORE.moatmtAdminPhones,
    moatmtAbandonedDelayHours: abandonedHoursFallback,
    moatmtAbandonedImageUrl: map.moatmt_abandoned_image_url || map.cartat_abandoned_image_url || DEFAULT_STORE.moatmtAbandonedImageUrl,
    moatmtDiscountCode: map.moatmt_discount_code || DEFAULT_STORE.moatmtDiscountCode,
    moatmtDiscountPercent: map.moatmt_discount_percent || DEFAULT_STORE.moatmtDiscountPercent,
    moatmtReviewDelayHours: reviewHoursFallback,
    moatmtReviewImageUrl: map.moatmt_review_image_url || map.cartat_review_image_url || DEFAULT_STORE.moatmtReviewImageUrl,
    googleSiteVerification: map.google_site_verification || DEFAULT_STORE.googleSiteVerification,
    gtmId: map.gtm_id || DEFAULT_STORE.gtmId,
    ga4MeasurementId: map.ga4_measurement_id || DEFAULT_STORE.ga4MeasurementId,
    googleAdsId: map.google_ads_id || DEFAULT_STORE.googleAdsId,
    googleAdsPurchaseLabel: map.google_ads_purchase_label || DEFAULT_STORE.googleAdsPurchaseLabel,
    metaPixelId: map.meta_pixel_id || DEFAULT_STORE.metaPixelId,
    snapchatPixelId: map.snapchat_pixel_id || DEFAULT_STORE.snapchatPixelId,
    tiktokPixelId: map.tiktok_pixel_id || DEFAULT_STORE.tiktokPixelId,
  };
}

export const storeSettingsAdminQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "store-settings"],
    queryFn: fetchStoreSettings,
    staleTime: 30_000,
  });

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const rows = (Object.keys(KEY_MAP) as Array<keyof StoreSettings>).map((k) => ({
    key: KEY_MAP[k],
    value: settings[k] != null ? String(settings[k]).trim() : "",
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("store_settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

// ─────────────── طرق الدفع (Payment Methods) ───────────────

export type PaymentMethodsConfig = {
  ngenius: {
    enabled: boolean;
    testMode: boolean;
    uatApiKey?: string;
    uatOutletId?: string;
    uatMid?: string;
  };
  edfapay: {
    enabled: boolean;
    testMode: boolean;
  };
  whatsapp: {
    enabled: boolean;
    number: string;
    customNote: string;
  };
  cod: {
    enabled: boolean;
    instructions: string;
  };
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethodsConfig = {
  ngenius: {
    enabled: true,
    testMode: false,
    uatApiKey: "OTQyMzI4MWQtNzlhOC00MDE4LWIzOWMtNGYxYmIxZTA1ZjkzOjljYjc0OGU4LTA0ODItNDBjMy05YzRhLTM5NTc2MmE4M2U0MQ==",
    uatOutletId: "1b6c1ea9-4a87-495e-8ff4-963d6f835dd9",
    uatMid: "202250910001",
  },
  edfapay: {
    enabled: false,
    testMode: false,
  },
  whatsapp: {
    enabled: true,
    number: "966500451602",
    customNote: "إرسال تفاصيل الطلب مباشرة عبر واتساب للمتجر للاستلام السريع",
  },
  cod: {
    enabled: false,
    instructions: "الدفع عند الاستلام — بدون أي رسوم إضافية",
  },
};

const PAYMENT_CONFIG_KEY = "payment_methods_config";

export async function fetchPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", PAYMENT_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error("[fetchPaymentMethodsConfig] query error:", error);
      return DEFAULT_PAYMENT_METHODS;
    }

    if (!data?.value) {
      return DEFAULT_PAYMENT_METHODS;
    }

    const parsed = JSON.parse(data.value);
    return {
      ngenius: {
        enabled: parsed.ngenius?.enabled !== undefined ? Boolean(parsed.ngenius.enabled) : DEFAULT_PAYMENT_METHODS.ngenius.enabled,
        testMode: Boolean(parsed.ngenius?.testMode),
        uatApiKey: typeof parsed.ngenius?.uatApiKey === "string" ? parsed.ngenius.uatApiKey : DEFAULT_PAYMENT_METHODS.ngenius.uatApiKey,
        uatOutletId: typeof parsed.ngenius?.uatOutletId === "string" ? parsed.ngenius.uatOutletId : DEFAULT_PAYMENT_METHODS.ngenius.uatOutletId,
        uatMid: typeof parsed.ngenius?.uatMid === "string" ? parsed.ngenius.uatMid : DEFAULT_PAYMENT_METHODS.ngenius.uatMid,
      },
      edfapay: {
        enabled: parsed.edfapay?.enabled !== undefined ? Boolean(parsed.edfapay.enabled) : DEFAULT_PAYMENT_METHODS.edfapay.enabled,
        testMode: Boolean(parsed.edfapay?.testMode),
      },
      whatsapp: {
        enabled: parsed.whatsapp?.enabled !== undefined ? Boolean(parsed.whatsapp.enabled) : DEFAULT_PAYMENT_METHODS.whatsapp.enabled,
        number: parsed.whatsapp?.number || DEFAULT_PAYMENT_METHODS.whatsapp.number,
        customNote: parsed.whatsapp?.customNote || DEFAULT_PAYMENT_METHODS.whatsapp.customNote,
      },
      cod: {
        enabled: parsed.cod?.enabled !== undefined ? Boolean(parsed.cod.enabled) : DEFAULT_PAYMENT_METHODS.cod.enabled,
        instructions: parsed.cod?.instructions || DEFAULT_PAYMENT_METHODS.cod.instructions,
      },
    };
  } catch (e) {
    console.warn("[fetchPaymentMethodsConfig] parse error:", e);
    return DEFAULT_PAYMENT_METHODS;
  }
}

export const paymentMethodsAdminQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "payment-methods-config"],
    queryFn: fetchPaymentMethodsConfig,
    staleTime: 30_000,
  });

export const paymentMethodsConfigQueryOptions = paymentMethodsAdminQueryOptions;

export async function savePaymentMethodsConfig(config: PaymentMethodsConfig): Promise<void> {
  const { error } = await supabase.from("store_settings").upsert(
    {
      key: PAYMENT_CONFIG_KEY,
      value: JSON.stringify(config),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);
}

export async function signOutEverywhere(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) throw error;
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function fetchSystemCounts() {
  const [products, orders, customers] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    customers: customers.count ?? 0,
  };
}

export const systemCountsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "settings", "system-counts", STORE_ID],
    queryFn: fetchSystemCounts,
    staleTime: 60_000,
  });
