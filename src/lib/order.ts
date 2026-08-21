export const VAT_RATE = 0.15;

export type DirectTotals = {
  itemsTotal: number; // unit * qty, VAT-inclusive (قبل أي خصم)
  totalIncl: number; // بعد الخصم، شامل VAT
  subtotalExcl: number; // مستخرج من totalIncl
  vat: number;
  discountIncl: number; // قيمة الخصم (شاملة VAT)
};

export function computeDirectTotals(unitPrice: number, qty: number): DirectTotals {
  return computeDirectTotalsWithCoupon(unitPrice, qty, 0);
}

export function computeDirectTotalsWithCoupon(
  unitPrice: number,
  qty: number,
  discountPercent: number,
): DirectTotals {
  const itemsTotal = unitPrice * qty;
  const safePercent = Math.max(0, Math.min(100, discountPercent || 0));
  const discountIncl = +((itemsTotal * safePercent) / 100).toFixed(2);
  const totalIncl = Math.max(0, +(itemsTotal - discountIncl).toFixed(2));
  const subtotalExcl = +(totalIncl / (1 + VAT_RATE)).toFixed(2);
  const vat = +(totalIncl - subtotalExcl).toFixed(2);
  return { itemsTotal, totalIncl, subtotalExcl, vat, discountIncl };
}

export function generateOrderNumber(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `LG-${yy}${mm}${dd}-${rand}`;
}

export function buildOrderWhatsAppMessage(opts: {
  orderNumber: string;
  customerName: string;
  productName: string;
  qty: number;
  total: number;
  trackUrl?: string;
}): string {
  const lines = [
    "السلام عليكم 👋",
    "أرسلت طلباً جديداً عبر الموقع.",
    "",
    `📋 رقم الطلب: ${opts.orderNumber}`,
    `👤 الاسم: ${opts.customerName}`,
    "",
    "📦 الباقة:",
    `• ${opts.productName} × ${opts.qty}`,
    "",
    `💰 الإجمالي: ${opts.total} ر.س (شامل الضريبة)`,
  ];
  if (opts.trackUrl) {
    lines.push("");
    lines.push(`🔗 ${opts.trackUrl}`);
  }
  lines.push("");
  lines.push("بانتظار التأكيد، شكراً لكم 🌟");
  return lines.join("\n");
}

export function durationLabel(months?: number | null): string {
  if (!months || months < 1) return "";
  if (months === 1) return "شهر";
  if (months === 2) return "شهران";
  if (months === 3) return "3 أشهر";
  if (months === 6) return "6 أشهر";
  if (months === 12) return "سنة كاملة";
  if (months === 15) return "سنة + 3 أشهر";
  if (months === 24) return "سنتان";
  return `${months} شهر`;
}
