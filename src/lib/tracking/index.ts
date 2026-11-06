import type { TrackingConfig, TrackingProduct, TrackingOrder } from "./types";
import { trackGa4PageView, trackGa4ViewItem, trackGa4BeginCheckout, trackGa4Purchase } from "./ga4";
import { trackGoogleAdsPurchase } from "./google-ads";
import { trackMetaPageView, trackMetaViewContent, trackMetaInitiateCheckout, trackMetaPurchase } from "./meta-pixel";
import { trackSnapchatPageView, trackSnapchatViewContent, trackSnapchatStartCheckout, trackSnapchatPurchase } from "./snapchat-pixel";
import { trackTikTokPageView, trackTikTokViewContent, trackTikTokInitiateCheckout, trackTikTokPurchase } from "./tiktok-pixel";

export * from "./types";
export * from "./google-search-console";
export * from "./gtm";
export * from "./ga4";
export * from "./google-ads";
export * from "./meta-pixel";
export * from "./snapchat-pixel";
export * from "./tiktok-pixel";
export * from "./useTrackingConfig";

/**
 * إرسال حدث زيارة الصفحة لكل منصات التتبع المفعلة
 */
export function trackPageView(pagePath?: string) {
  if (typeof window === "undefined") return;
  const path = pagePath || window.location.pathname;

  try {
    trackGa4PageView(path);
  } catch (e) {
    console.debug("[Tracking] GA4 page_view warning:", e);
  }

  try {
    trackMetaPageView();
  } catch (e) {
    console.debug("[Tracking] Meta page_view warning:", e);
  }

  try {
    trackSnapchatPageView();
  } catch (e) {
    console.debug("[Tracking] Snapchat page_view warning:", e);
  }

  try {
    trackTikTokPageView();
  } catch (e) {
    console.debug("[Tracking] TikTok page_view warning:", e);
  }
}

/**
 * إرسال حدث عرض تفاصيل المنتج (ViewContent / view_item)
 */
export function trackViewContent(product: TrackingProduct) {
  if (typeof window === "undefined") return;

  try {
    trackGa4ViewItem(product);
  } catch (e) {
    console.debug("[Tracking] GA4 view_item error:", e);
  }

  try {
    trackMetaViewContent(product);
  } catch (e) {
    console.debug("[Tracking] Meta ViewContent error:", e);
  }

  try {
    trackSnapchatViewContent(product);
  } catch (e) {
    console.debug("[Tracking] Snapchat VIEW_CONTENT error:", e);
  }

  try {
    trackTikTokViewContent(product);
  } catch (e) {
    console.debug("[Tracking] TikTok ViewContent error:", e);
  }
}

/**
 * إرسال حدث بدء الدفع (InitiateCheckout / begin_checkout)
 */
export function trackInitiateCheckout(product: TrackingProduct, total: number) {
  if (typeof window === "undefined") return;

  try {
    trackGa4BeginCheckout(product, total);
  } catch (e) {
    console.debug("[Tracking] GA4 begin_checkout error:", e);
  }

  try {
    trackMetaInitiateCheckout(product, total);
  } catch (e) {
    console.debug("[Tracking] Meta InitiateCheckout error:", e);
  }

  try {
    trackSnapchatStartCheckout(product, total);
  } catch (e) {
    console.debug("[Tracking] Snapchat START_CHECKOUT error:", e);
  }

  try {
    trackTikTokInitiateCheckout(product, total);
  } catch (e) {
    console.debug("[Tracking] TikTok InitiateCheckout error:", e);
  }
}

/**
 * إرسال حدث إتمام الشراء (Purchase / CompletePayment) لجميع المنصات
 * مزود بنظام حماية فائق ضد التكرار (Deduplication) لمنع تكرار الإحصائيات عند تحديث الصفحة
 */
export function trackPurchase(order: TrackingOrder, config?: TrackingConfig) {
  if (typeof window === "undefined") return;
  if (!order || !order.orderNumber) return;

  const dedupeKey = `cobra_tracked_purchase_${order.orderNumber}`;
  try {
    if (sessionStorage.getItem(dedupeKey)) {
      console.log(`[Tracking] Purchase for #${order.orderNumber} already tracked. Skipping deduplicate.`);
      return;
    }
  } catch {}

  // 1. Google Analytics 4
  try {
    trackGa4Purchase(order);
  } catch (e) {
    console.debug("[Tracking] GA4 purchase error:", e);
  }

  // 2. Google Ads Conversion
  try {
    if (config?.googleAdsId) {
      trackGoogleAdsPurchase(order, config.googleAdsId, config.googleAdsPurchaseLabel);
    }
  } catch (e) {
    console.debug("[Tracking] Google Ads conversion error:", e);
  }

  // 3. Meta / Facebook Pixel
  try {
    trackMetaPurchase(order);
  } catch (e) {
    console.debug("[Tracking] Meta purchase error:", e);
  }

  // 4. Snapchat Pixel
  try {
    trackSnapchatPurchase(order);
  } catch (e) {
    console.debug("[Tracking] Snapchat purchase error:", e);
  }

  // 5. TikTok Pixel
  try {
    trackTikTokPurchase(order);
  } catch (e) {
    console.debug("[Tracking] TikTok purchase error:", e);
  }

  // قفل الحدث لمنع التكرار
  try {
    sessionStorage.setItem(dedupeKey, "1");
  } catch {}
}
