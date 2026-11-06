import type { TrackingProduct, TrackingOrder } from "./types";

declare global {
  interface Window {
    ttq?: any;
  }
}

export function getTikTokPixelScript(pixelId?: string | null): string | null {
  if (!pixelId || !pixelId.trim()) return null;
  const id = pixelId.trim();

  return `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${id}');
  ttq.page();
}(window, document, 'ttq');
  `.trim();
}

export function trackTikTokPageView() {
  if (typeof window === "undefined" || !window.ttq) return;
  window.ttq.page();
}

export function trackTikTokViewContent(product: TrackingProduct) {
  if (typeof window === "undefined" || !window.ttq) return;
  window.ttq.track("ViewContent", {
    content_id: product.id,
    content_name: product.name,
    content_category: product.category,
    value: product.price,
    currency: product.currency || "SAR",
  });
}

export function trackTikTokInitiateCheckout(product: TrackingProduct, total: number) {
  if (typeof window === "undefined" || !window.ttq) return;
  window.ttq.track("InitiateCheckout", {
    content_id: product.id,
    content_name: product.name,
    value: total,
    currency: product.currency || "SAR",
    quantity: product.quantity || 1,
  });
}

export function trackTikTokPurchase(order: TrackingOrder) {
  if (typeof window === "undefined" || !window.ttq) return;
  window.ttq.track("CompletePayment", {
    content_type: "product",
    value: order.total,
    currency: order.currency || "SAR",
    content_id: order.orderNumber,
  });
}
