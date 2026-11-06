import type { TrackingProduct, TrackingOrder } from "./types";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function getGa4Script(measurementId?: string | null): string | null {
  if (!measurementId || !measurementId.trim()) return null;
  const id = measurementId.trim();

  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}', { send_page_view: false });
  `.trim();
}

export function trackGa4PageView(pagePath: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackGa4ViewItem(product: TrackingProduct) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "view_item", {
    currency: product.currency || "SAR",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: product.quantity || 1,
      },
    ],
  });
}

export function trackGa4BeginCheckout(product: TrackingProduct, total: number) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "begin_checkout", {
    currency: product.currency || "SAR",
    value: total,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: product.quantity || 1,
      },
    ],
  });
}

export function trackGa4Purchase(order: TrackingOrder) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "purchase", {
    transaction_id: order.orderNumber,
    value: order.total,
    currency: order.currency || "SAR",
    items: (order.items || []).map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
}
