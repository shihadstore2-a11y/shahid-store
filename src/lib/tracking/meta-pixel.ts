import type { TrackingProduct, TrackingOrder } from "./types";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export function getMetaPixelScript(pixelId?: string | null): string | null {
  if (!pixelId || !pixelId.trim()) return null;
  const id = pixelId.trim();

  return `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
  `.trim();
}

export function trackMetaPageView() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "PageView");
}

export function trackMetaViewContent(product: TrackingProduct) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: "product",
    value: product.price,
    currency: product.currency || "SAR",
  });
}

export function trackMetaInitiateCheckout(product: TrackingProduct, total: number) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "InitiateCheckout", {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: "product",
    value: total,
    currency: product.currency || "SAR",
    num_items: product.quantity || 1,
  });
}

export function trackMetaPurchase(order: TrackingOrder) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "Purchase", {
    value: order.total,
    currency: order.currency || "SAR",
    content_type: "product",
    content_ids: (order.items || []).map((i) => i.id),
    num_items: (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0),
    order_id: order.orderNumber,
  });
}
