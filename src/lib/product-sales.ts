/**
 * خريطة أعداد المشترين وعمليات الشراء الثابتة للمنتجات
 * تضمن بقاء الرقم ثابتاً وموثوقاً للمنتج وظهوره في كل صفحات المتجر
 */
export const PRODUCT_SALES_MAP: Record<string, number> = {
  "falcon-1y": 1342,
  "falcon-1y-2dev": 410,
  "falcon-6m": 580,
  "falcon-3m": 430,
  "falcon-1m": 320,
  "hulk-1y": 980,
  "hulk-1y-2dev": 180,
  "hulk-6m": 490,
  "hulk-3m": 510,
  "hulk-1m": 820,
  "smarters-1y-plus-3": 760,
  "smarters-1y-plus-3-solo": 450,
  "bundle-falcon-hulk-1y": 650,
};

export function getProductSalesCount(product?: { slug?: string; sales_count?: number | null } | null): number {
  if (!product) return 350;
  if (typeof product.sales_count === "number" && product.sales_count > 0) {
    return product.sales_count;
  }
  if (product.slug && PRODUCT_SALES_MAP[product.slug]) {
    return PRODUCT_SALES_MAP[product.slug];
  }
  return 350;
}

