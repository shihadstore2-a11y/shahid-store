import type { TrackingOrder } from "./types";

export function getGoogleAdsConfigScript(googleAdsId?: string | null): string | null {
  if (!googleAdsId || !googleAdsId.trim()) return null;
  const id = googleAdsId.trim();

  return `
if (typeof gtag === 'function') {
  gtag('config', '${id}');
}
  `.trim();
}

export function trackGoogleAdsPurchase(
  order: TrackingOrder,
  googleAdsId?: string | null,
  purchaseLabel?: string | null
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (!googleAdsId || !googleAdsId.trim()) return;

  const adsId = googleAdsId.trim();
  const label = purchaseLabel ? purchaseLabel.trim() : "";
  const sendTo = label ? `${adsId}/${label}` : adsId;

  window.gtag("event", "conversion", {
    send_to: sendTo,
    value: order.total,
    currency: order.currency || "SAR",
    transaction_id: order.orderNumber,
  });
}
