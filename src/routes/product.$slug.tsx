import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  Headphones,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { fetchProductBySlug, fetchRelatedProducts } from "@/lib/queries";
import { formatSAR, formatNumber } from "@/lib/format";
import { isSeasonActive } from "@/lib/season";
import { getProductImage, getProductOverlay, isAnnualProduct } from "@/lib/productVisuals";
import { StockStatusBadge } from "@/components/products/StockStatusBadge";
import type { Product, Category } from "@/lib/types";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const data = await fetchProductBySlug(params.slug);
    if (!data.product) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const url = `https://shahidstore.net/product/${params.slug}`;
    const p = loaderData?.product;
    if (!p) {
      return {
        meta: [
          { title: "المنتج غير موجود — شاهد ستور" },
          { property: "og:url", content: url },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const price = p.sale_price ?? p.base_price;
    const desc =
      p.description?.slice(0, 155) ??
      `اشترك في ${p.name_ar} بسعر مناسب وتفعيل سريع عبر شاهد ستور.`;
    return {
      meta: [
        { title: `${p.name_ar} — شاهد ستور` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.name_ar} — ${formatSAR(price)}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
      ],
      links: [
        { rel: "canonical", href: url },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name_ar,
            description: p.description ?? "",
            sku: p.id,
            brand: { "@type": "Brand", name: "شاهد ستور" },
            ...(p.image_urls?.[0] ? { image: p.image_urls[0] } : {}),
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: p.rating,
              reviewCount: Math.max(p.sales_count, 5),
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "SAR",
              price: String(price),
              availability: "https://schema.org/InStock",
              priceValidUntil: `${new Date().getFullYear()}-12-31`,
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black">المنتج غير موجود</h1>
        <p className="mt-2 text-muted-foreground">
          ربما تم تعديل الرابط أو إزالة الباقة.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          تصفح كل الباقات
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-destructive">حدث خطأ</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const loaderData = Route.useLoaderData() as {
    product: Product | null;
    category: Category | null;
  };
  const { product, category } = loaderData;

  const related = useQuery({
    queryKey: ["related", product!.id],
    queryFn: () => fetchRelatedProducts(product!.category_id, product!.id, 3),
  });

  const p = product!;
  const annual = isAnnualProduct(p.slug);
  const showSeason = isSeasonActive() && annual;
  const overlay = getProductOverlay(p.slug);
  const isFalcon = p.slug.includes("falcon");
  const isHulk = p.slug.includes("hulk");
  const isSmarters = p.slug.includes("smarters");
  const isPremiumLine = isFalcon || isHulk || isSmarters;

  const currentPrice = p.sale_price ?? p.base_price;
  const originalPrice = p.base_price;
  const hasDiscount = currentPrice < originalPrice;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const months = p.duration_months ?? 1;
  const perMonth = months > 1 ? Math.round(currentPrice / months) : null;

  return (
    <SiteLayout>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/40">
        <nav
          className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3 text-xs text-muted-foreground"
          aria-label="مسار التنقل"
        >
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <ChevronLeft className="h-3 w-3" />
          <Link to="/products" className="hover:text-primary">الباقات</Link>
          {category && (
            <>
              <ChevronLeft className="h-3 w-3" />
              <Link
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="hover:text-primary"
              >
                {category.name_ar}
              </Link>
            </>
          )}
          <ChevronLeft className="h-3 w-3" />
          <span className="font-bold text-foreground">{p.name_ar}</span>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Visual */}
          <div className={`group relative overflow-hidden rounded-3xl border shadow-[var(--shadow-card)] ${isPremiumLine ? "border-accent/40 ring-1 ring-accent/20" : "border-border"}`}>
            <div className={`relative aspect-square w-full overflow-hidden bg-background ${isPremiumLine ? "premium-shine" : ""}`}>
              <img
                src={getProductImage(p.slug, category?.slug, p.image_urls)}
                alt={p.name_ar}
                width={1024}
                height={1024}
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover"
              />
              {showSeason ? (
                <div
                  className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black text-white shadow-lg"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <Trophy className="h-3.5 w-3.5" /> الأنسب للموسم
                </div>
              ) : p.is_bestseller ? (
                <div className="absolute right-4 top-4 z-20 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-lg">
                  الأكثر طلباً
                </div>
              ) : null}
              {hasDiscount && (
                <div className="absolute left-4 top-4 z-20 rounded-full bg-[var(--yellow-bright)] px-3 py-1.5 text-xs font-black text-[var(--yellow-bright-foreground)] shadow-lg">
                  خصم {discountPct}%
                </div>
              )}

              {/* لمسة ذهبية ركنيّة لفالكون/هولك/سمارترز + توهج أصفر مميّز لهولك */}
              {isPremiumLine && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -left-10 -top-10 z-10 h-40 w-40 rounded-full opacity-50 blur-2xl"
                    style={{ background: "var(--gradient-gold)" }}
                  />
                  {isHulk && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-12 -bottom-12 z-10 h-44 w-44 rounded-full opacity-55 blur-3xl"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.92 0.18 95) 0%, oklch(0.78 0.20 85) 100%)",
                      }}
                    />
                  )}
                </>
              )}

              {/* شارة المدّة محذوفة — موجودة أصلاً في اسم المنتج. تظهر شارة الميزة فقط */}
              {overlay?.bonus && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                  />
                  <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex items-end justify-end">
                    <span className="rounded-xl bg-white/12 px-3.5 py-2 text-sm font-bold leading-none text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-1 ring-white/25 backdrop-blur-md">
                      {overlay.bonus}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4"
                  fill={i < Math.round(p.rating) ? "currentColor" : "none"}
                  stroke="currentColor"
                />
              ))}
              <span className="text-sm text-muted-foreground">
                {p.rating} • {formatNumber(p.sales_count)} عملية بيع
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">
              {p.name_ar}
            </h1>
            {p.description && (
              <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            )}

            {/* Price */}
            <div className="mt-6 border-t border-border/30 pt-6 flex items-end gap-3">
              <div className="text-4xl font-black text-accent">
                {formatSAR(currentPrice)}
              </div>
              {hasDiscount && (
                <div className="text-lg text-muted-foreground line-through">
                  {formatSAR(originalPrice)}
                </div>
              )}
            </div>
            {perMonth !== null && (
              <div className="mt-1 text-sm font-bold text-muted-foreground">
                ما يعادل {formatSAR(perMonth)} / شهرياً
              </div>
            )}

            {/* D.3: Stock availability */}
            <div className="mt-4">
              <StockStatusBadge slug={p.slug} duration={p.duration_months ?? 1} />
            </div>

            {/* CTA */}
            <div className="mt-5">
              <Link
                to="/checkout/$slug"
                params={{ slug: p.slug }}
                search={{ qty: 1 }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-black text-accent-foreground shadow-[var(--shadow-gold)] transition hover:opacity-95"
                style={{ background: "var(--gradient-gold)" }}
              >
                <ShoppingBag className="h-5 w-5" />
                اشترك الآن
              </Link>
            </div>

            {/* Trust */}
            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-secondary/40 p-4 text-center text-xs">
              <div className="flex flex-col items-center gap-1">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">تفعيل سريع</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">ضمان استبدال</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Headphones className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">دعم متواصل</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features & Compatibility */}
      {(p.features.length > 0 || p.compatibility.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="grid gap-6 lg:grid-cols-2">
            {p.features.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h2 className="mb-4 text-lg font-black text-foreground">
                  مميزات الباقة
                </h2>
                <ul className="space-y-2.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.compatibility.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h2 className="mb-4 text-lg font-black text-foreground">
                  التوافق
                </h2>
                <div className="flex flex-wrap gap-2">
                  {p.compatibility.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-bold text-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Related */}
      {related.data && related.data.length > 0 && (
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="mb-6 text-2xl font-black text-foreground">
              باقات مشابهة
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.data.map((r) => (
                <ProductCard key={r.id} product={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile sticky buy bar (PDP only) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-base font-black leading-tight text-accent">
              {formatSAR(currentPrice)}
            </div>
            {perMonth !== null && (
              <div className="text-[11px] leading-tight text-muted-foreground">
                {formatSAR(perMonth)} / شهرياً
              </div>
            )}
            <div className="mt-0.5">
              <StockStatusBadge slug={p.slug} duration={p.duration_months ?? 1} variant="compact" />
            </div>
          </div>
          <Link
            to="/checkout/$slug"
            params={{ slug: p.slug }}
            search={{ qty: 1 }}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-black text-accent-foreground shadow-[var(--shadow-gold)]"
            style={{ background: "var(--gradient-gold)" }}
          >
            <ShoppingBag className="h-4 w-4" />
            اشترك الآن
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
