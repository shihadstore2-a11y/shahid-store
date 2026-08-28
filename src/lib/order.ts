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

export function getProductDurationMonths(product?: {
  slug?: string;
  name_ar?: string;
  duration_months?: number | null;
} | null): number {
  if (!product) return 1;

  if (typeof product.duration_months === "number" && product.duration_months > 0) {
    return product.duration_months;
  }

  const s = (product.slug ?? "").toLowerCase();
  const n = (product.name_ar ?? "").toLowerCase();

  // 15 شهراً أو سنة + 3
  if (s.includes("15m") || s.includes("1y-plus-3") || s.includes("plus-3") || n.includes("15 شهر") || n.includes("سنة + 3") || n.includes("سنة و 3") || n.includes("سنة و3")) {
    return 15;
  }
  // سنتان (24 شهراً)
  if (s.includes("24m") || s.includes("2y") || n.includes("سنتين") || n.includes("سنتان") || n.includes("24 شهر")) {
    return 24;
  }
  // سنة كاملة (12 شهراً)
  if (s.includes("12m") || s.includes("-1y") || s.includes("1-year") || s.includes("year") || s.includes("annual") || n.includes("سنة") || n.includes("سنوي") || n.includes("12 شهر")) {
    return 12;
  }
  // 6 أشهر
  if (s.includes("6m") || s.includes("6-month") || s.includes("half") || n.includes("6 أشهر") || n.includes("6 اشهر") || n.includes("نصف سنوي")) {
    return 6;
  }
  // 3 أشهر
  if (s.includes("3m") || s.includes("3-month") || s.includes("3-solo") || s.includes("3_months") || n.includes("3 أشهر") || n.includes("3 اشهر") || n.includes("ثلاثة أشهر") || n.includes("ثلاثة اشهر")) {
    return 3;
  }
  // شهران
  if (s.includes("2m") || n.includes("شهران") || n.includes("شهرين")) {
    return 2;
  }

  return 1;
}
