import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatSAR, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { getProductImage, getProductOverlay } from "@/lib/productVisuals";

type Props = { product: Product; categorySlug?: string };

export function ProductCard({ product, categorySlug }: Props) {
  const slug = categorySlug ?? deriveCategorySlug(product.slug);
  const price = product.sale_price ?? product.base_price;
  const hasDiscount =
    product.sale_price && product.sale_price < product.base_price;

  const cardImage = getProductImage(product.slug, slug, product.image_urls);
  const variantBadge = getVariantBadge(product.slug);
  const overlay = getProductOverlay(product.slug);
  const isHulk = product.slug.includes("hulk");
  const isPremiumLine =
    product.slug.includes("falcon") ||
    isHulk ||
    product.slug.includes("smarters");
  const HULK_YELLOW_GRADIENT =
    "linear-gradient(135deg, oklch(0.92 0.18 95) 0%, oklch(0.78 0.20 85) 100%)";

  // شارة التوفير حُذفت بناءً على طلب التصميم — يظهر السعر الأصلي مشطوباً بجوار السعر النهائي فقط.



  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow-purple)] ${
        isPremiumLine
          ? "border-accent/40 ring-1 ring-accent/15 hover:border-accent"
          : "border-border hover:border-accent"
      }`}
      data-bestseller={product.is_bestseller ? "true" : undefined}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden ${isPremiumLine ? "premium-shine" : ""}`}
        style={{ background: "var(--gradient-card)" }}
      >
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="absolute inset-0 block"
          aria-label={product.name_ar}
        >
          <img
            src={cardImage}
            alt={product.name_ar}
            width={1024}
            height={1024}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {product.is_bestseller && (
          <div className="absolute right-3 top-3 z-20 rounded-md bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-foreground shadow md:text-xs">
            🔥 الأكثر طلباً
          </div>
        )}

        {variantBadge && (
          <div
            className={`absolute left-3 top-3 z-20 rounded-md px-2.5 py-1 text-[10px] font-bold shadow md:text-xs ${
              variantBadge.tone === "primary"
                ? "bg-accent text-accent-foreground"
                : "bg-background/90 text-foreground backdrop-blur-sm"
            }`}
          >
            {variantBadge.label}
          </div>
        )}

        {/* توهّج ذهبي مزدوج خلف الصورة بأكملها (بدون تغطية الشعار) */}
        {isPremiumLine && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-10 z-10 h-28 w-28 rounded-full opacity-60 blur-3xl"
              style={{ background: "var(--gradient-gold)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -bottom-12 z-10 h-24 w-24 rounded-full opacity-45 blur-3xl"
              style={{
                background: isHulk ? HULK_YELLOW_GRADIENT : "var(--gradient-gold)",
              }}
            />
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3 md:gap-3 md:p-4">

        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="block"
        >
          <h3 className="line-clamp-2 min-h-[2.6rem] text-[15px] font-extrabold leading-snug tracking-tight text-card-foreground hover:text-accent md:min-h-[2.9rem] md:text-base">
            {product.name_ar}
          </h3>
        </Link>

        {product.sales_count > 0 && (
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-accent/90 md:text-sm">
            <Flame className="h-4 w-4 shrink-0" />
            <span className="tabular-nums">{formatNumber(product.sales_count)} مشتري</span>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="whitespace-nowrap text-xl font-black leading-none tabular-nums text-accent md:text-2xl">
            {formatSAR(price)}
          </span>
          {hasDiscount && (
            <span className="whitespace-nowrap text-xs leading-none tabular-nums text-muted-foreground line-through md:text-sm">
              {formatSAR(product.base_price)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-1">
          <Button
            asChild
            className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            size="sm"
          >
            <Link
              to="/checkout/$slug"
              params={{ slug: product.slug }}
              search={{ qty: 1 }}
            >
              اشترك الآن
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function getVariantBadge(
  slug: string,
): { label: string; tone: "primary" | "muted" } | null {
  if (slug === "smarters-1y-plus-3") return { label: "شاشتان", tone: "primary" };
  if (slug === "smarters-1y-plus-3-solo") return { label: "شاشة فردية", tone: "muted" };
  if (slug.endsWith("-2dev")) return { label: "جهازان", tone: "primary" };
  return null;
}

function deriveCategorySlug(productSlug: string): string {
  if (productSlug.startsWith("falcon")) return "falcon";
  if (productSlug.startsWith("hulk")) return "hulk";
  if (productSlug.startsWith("smarters")) return "smarters";
  if (productSlug.startsWith("bundle") || productSlug.includes("annual"))
    return "annual-offers";
  return "falcon";
}
