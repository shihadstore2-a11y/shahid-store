import type { TrackingProduct, TrackingOrder } from "./types";

declare global {
  interface Window {
    snaptr?: (...args: any[]) => void;
  }
}

export function getSnapchatPixelScript(pixelId?: string | null): string | null {
  if (!pixelId || !pixelId.trim()) return null;
  const id = pixelId.trim();

  return `
(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
{a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
r.src=n;var u=t.getElementsByTagName(s)[0];
u.parentNode.insertBefore(r,u);})(window,document,
'https://sc-static.net/scevent.min.js');
snaptr('init', '${id}');
snaptr('track', 'PAGE_VIEW');
  `.trim();
}

export function trackSnapchatPageView() {
  if (typeof window === "undefined" || typeof window.snaptr !== "function") return;
  window.snaptr("track", "PAGE_VIEW");
}

export function trackSnapchatViewContent(product: TrackingProduct) {
  if (typeof window === "undefined" || typeof window.snaptr !== "function") return;
  window.snaptr("track", "VIEW_CONTENT", {
    item_category: product.category,
    item_ids: [product.id],
    description: product.name,
    price: product.price,
    currency: product.currency || "SAR",
  });
}

export function trackSnapchatStartCheckout(product: TrackingProduct, total: number) {
  if (typeof window === "undefined" || typeof window.snaptr !== "function") return;
  window.snaptr("track", "START_CHECKOUT", {
    item_category: product.category,
    item_ids: [product.id],
    price: total,
    currency: product.currency || "SAR",
    number_items: product.quantity || 1,
  });
}

export function trackSnapchatPurchase(order: TrackingOrder) {
  if (typeof window === "undefined" || typeof window.snaptr !== "function") return;
  window.snaptr("track", "PURCHASE", {
    price: order.total,
    currency: order.currency || "SAR",
    transaction_id: order.orderNumber,
    item_ids: (order.items || []).map((i) => i.id),
    number_items: (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0),
  });
}
