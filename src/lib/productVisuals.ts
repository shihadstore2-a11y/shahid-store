import { Bird, Crown, Mountain, Trophy, Tv, Zap, type LucideIcon } from "lucide-react";

// ===== Product images (per-slug) =====
// صور موحَّدة بالشعار الأصلي لكل منصّة (Falcon/Hulk/Smarters) على خلفية شاهد ستور السوداء + توهّج ذهبي.
import falconBase from "@/assets/products/falcon-card.webp";
import bundleFalconHulk from "@/assets/products/bundle-falcon-hulk-1y.webp";
import hulkBase from "@/assets/products/hulk-card.webp";
import smartersImg from "@/assets/products/smarters-card.webp";

/** خريطة دقيقة per-slug — تُقدَّم على CATEGORY_IMAGES */
export const PRODUCT_IMAGES: Record<string, string> = {
  "bundle-falcon-hulk-1y": bundleFalconHulk,
};

/** صورة احتياطية بحسب الفئة — جميع منتجات الفئة تستخدم نفس الصورة الموحّدة */
export const CATEGORY_IMAGES: Record<string, string> = {
  falcon: falconBase,
  hulk: hulkBase,
  smarters: smartersImg,
  "annual-offers": bundleFalconHulk,
};

/** أولوية: dbUrls[0] → slug → category → fallback */
export function getProductImage(
  slug: string | null | undefined,
  categorySlug?: string | null,
  dbUrls?: string[] | null,
): string {
  if (dbUrls && dbUrls.length > 0 && dbUrls[0]) return dbUrls[0];
  if (slug && PRODUCT_IMAGES[slug]) return PRODUCT_IMAGES[slug];
  if (categorySlug && CATEGORY_IMAGES[categorySlug]) return CATEGORY_IMAGES[categorySlug];
  return falconBase;
}


export const ICONS: Record<string, LucideIcon> = {
  Bird,
  Crown,
  Mountain,
  Trophy,
  Tv,
  Zap,
};

export const GRADIENTS: Record<string, string> = {
  falcon:
    "linear-gradient(135deg, oklch(0.42 0.16 265) 0%, oklch(0.50 0.20 295) 100%)",
  hulk:
    "linear-gradient(135deg, oklch(0.88 0.18 95) 0%, oklch(0.72 0.19 75) 100%)",
  smarters:
    "linear-gradient(135deg, oklch(0.65 0.20 50) 0%, oklch(0.55 0.22 25) 100%)",
  gold:
    "linear-gradient(135deg, oklch(0.78 0.13 85) 0%, oklch(0.60 0.16 60) 100%)",
};

export function getProductIcon(key: string | null | undefined): LucideIcon {
  if (key && ICONS[key]) return ICONS[key];
  return Tv;
}

export function getProductGradient(key: string | null | undefined): string {
  if (key && GRADIENTS[key]) return GRADIENTS[key];
  return "var(--gradient-hero)";
}

/** Annual product detection from slug (no schema column needed). */
export function isAnnualProduct(slug: string): boolean {
  return /1-year|annual|plus-3/.test(slug);
}

/**
 * شارات المدّة + الميزة المعروضة على صورة المنتج.
 * تُستخدم لمنتجات فالكون وما يشبهها لإبراز المدة والقيمة بصرياً.
 */
export type ProductOverlay = {
  duration?: string;
  bonus?: string;
};

const PRODUCT_OVERLAYS: Record<string, ProductOverlay> = {
  "falcon-1m": { duration: "شهر واحد", bonus: "تجربة سريعة" },
  "falcon-3m": { duration: "٣ أشهر" },
  "falcon-6m": { duration: "٦ أشهر" },
  "falcon-1y": { duration: "سنة كاملة" },
  "falcon-1y-2dev": { duration: "سنة + جهازان", bonus: "باقة عائلية" },
  "hulk-1m": { duration: "شهر واحد", bonus: "تجربة سريعة" },
  "hulk-3m": { duration: "٣ أشهر" },
  "hulk-6m": { duration: "٦ أشهر" },
  "hulk-1y": { duration: "سنة كاملة" },
  "hulk-1y-2dev": { duration: "سنة + جهازان", bonus: "باقة عائلية" },
  "smarters-1y-plus-3": { duration: "سنة + ٣ أشهر", bonus: "شاشتان" },
  "smarters-1y-plus-3-solo": { duration: "سنة + ٣ أشهر", bonus: "شاشة فردية" },
  "bundle-falcon-hulk-1y": { duration: "باقة سنوية" },
};

export function getProductOverlay(slug: string | null | undefined): ProductOverlay | null {
  if (!slug) return null;
  return PRODUCT_OVERLAYS[slug] ?? null;
}
