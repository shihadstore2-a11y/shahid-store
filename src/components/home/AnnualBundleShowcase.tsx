import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Gift, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { homeCategoriesQueryOptions } from "@/lib/queries";
import { formatSAR, formatNumber } from "@/lib/format";
import { getProductImage, getProductOverlay } from "@/lib/productVisuals";
import { FalconIcon, HulkIcon } from "@/components/icons/CategoryIcons";

/**
 * AnnualBundleShowcase
 * قسم احترافي مخصّص لاستعراض مجموعة "فالكون + هولك" السنوية في الصفحة الرئيسية.
 * يُبرز: الصورة، السعر، التوفير، المميزات، ومحتوى المجموعة.
 */
export function AnnualBundleShowcase() {
  const { data } = useSuspenseQuery(homeCategoriesQueryOptions());
  const bundle = (data["annual-offers"] ?? [])[0];

  if (!bundle) {
    if (import.meta.env.DEV) {
      console.warn("[AnnualBundleShowcase] لا يوجد منتج في المجموعات السنوية المميّزة");
    }
    return null;
  }

  const price = bundle.sale_price ?? bundle.base_price;
  const hasDiscount =
    bundle.sale_price && bundle.sale_price < bundle.base_price;
  // شارة التوفير محذوفة بناءً على طلب التصميم.
  const overlay = getProductOverlay(bundle.slug);
  const image = getProductImage(bundle.slug, "annual-offers", bundle.image_urls);
  // أبرز 4 مميزات فقط لتجنّب الإطالة
  const topFeatures = (bundle.features ?? []).slice(0, 4);

  return (
    <section
      id="category-annual-offers"
      className="relative overflow-hidden bg-accent/5 py-8 md:py-14"
      aria-labelledby="heading-annual-offers"
    >
      {/* توهج ذهبي خلفي */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/4 h-56 w-56 rounded-full opacity-15 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />

      <div className="container relative mx-auto max-w-7xl px-4">
        {/* Section header */}
        <div className="mb-6 flex items-center gap-3 md:mb-8">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-accent-foreground shadow-md md:h-16 md:w-16"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Gift className="h-6 w-6 md:h-8 md:w-8" strokeWidth={2.5} />
          </div>
          <div>
            <h2
              id="heading-annual-offers"
              className="text-lg font-black leading-tight md:text-3xl"
            >
              مجموعات سنوية مميّزة
            </h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              مجموعات مدمجة بسعر مميّز وقيمة مضاعفة
            </p>
          </div>
        </div>

        {/* Bundle showcase card */}
        <div
          className={`group relative overflow-hidden rounded-3xl border-2 border-accent/40 bg-card shadow-[var(--shadow-card)] ring-1 ring-accent/15 transition-all duration-300 hover:border-accent hover:shadow-[var(--shadow-glow-purple)]`}
        >
          <div className="grid gap-0 md:grid-cols-2">
            {/* الصورة */}
            <Link
              to="/product/$slug"
              params={{ slug: bundle.slug }}
              className="premium-shine relative block aspect-square w-full overflow-hidden md:aspect-auto md:h-full md:min-h-[420px]"
              style={{ background: "var(--gradient-card)" }}
              aria-label={bundle.name_ar}
            >
              <img
                src={image}
                alt={bundle.name_ar}
                width={1024}
                height={1024}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* توهج ذهبي ركني */}
              <div
                aria-hidden
                className="pointer-events-none absolute -left-10 -top-10 z-10 h-32 w-32 rounded-full opacity-50 blur-2xl"
                style={{ background: "var(--gradient-gold)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -bottom-10 z-10 h-32 w-32 rounded-full opacity-40 blur-2xl"
                style={{ background: "var(--gradient-gold)" }}
              />

              {/* شارة التوفير العلوية محذوفة */}

              {/* شارة المدّة محذوفة — مذكورة في اسم المجموعة. شارة الميزة فقط */}
              {overlay?.bonus && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                  />
                  <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-end justify-end">
                    <span className="rounded-lg bg-white/12 px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-[0_6px_18px_rgba(0,0,0,0.45)] ring-1 ring-white/25 backdrop-blur-md md:text-xs">
                      {overlay.bonus}
                    </span>
                  </div>
                </>
              )}
            </Link>

            {/* المحتوى */}
            <div className="flex flex-col justify-between gap-5 p-5 md:gap-6 md:p-8">
              <div className="space-y-4">
                {/* العنوان */}
                <div>
                  <Link
                    to="/product/$slug"
                    params={{ slug: bundle.slug }}
                    className="block"
                  >
                    <h3 className="text-xl font-black leading-tight text-card-foreground hover:text-accent md:text-2xl">
                      {bundle.name_ar}
                    </h3>
                  </Link>
                  {bundle.sales_count > 0 && (
                    <div className="mt-1.5 text-xs font-bold text-accent/90 md:text-sm">
                      🔥 {formatNumber(bundle.sales_count)} مشتري اختار هذه المجموعة
                    </div>
                  )}
                </div>

                {/* محتوى المجموعة */}
                <div className="rounded-2xl border border-border bg-secondary/30 p-3 md:p-4">
                  <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground md:text-xs">
                    داخل المجموعة
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-card p-2 md:p-3">
                      <FalconIcon size={40} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-foreground md:text-sm">
                          فالكون
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground md:text-xs">
                          سنة كاملة
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-card p-2 md:p-3">
                      <HulkIcon size={40} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-foreground md:text-sm">
                          هولك
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground md:text-xs">
                          سنة كاملة
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* أبرز المميزات */}
                {topFeatures.length > 0 && (
                  <ul className="space-y-2">
                    {topFeatures.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[13px] text-foreground md:text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* السعر + CTA */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="whitespace-nowrap text-3xl font-black leading-none tabular-nums text-accent md:text-4xl">
                    {formatSAR(price)}
                  </span>
                  {hasDiscount && (
                    <span className="whitespace-nowrap text-sm leading-none tabular-nums text-muted-foreground line-through md:text-base">
                      {formatSAR(bundle.base_price)}
                    </span>
                  )}
                </div>

                {/* trust badges */}
                <div className="flex flex-wrap gap-3 text-[11px] font-bold text-muted-foreground md:text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-accent" />
                    تفعيل سريع
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    ضمان استبدال
                  </span>
                </div>

                <Link
                  to="/product/$slug"
                  params={{ slug: bundle.slug }}
                  className="premium-shine group/cta relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-4 text-base font-black text-accent-foreground shadow-[var(--shadow-gold)] ring-1 ring-white/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_oklch(0.82_0.18_85/0.65)] md:text-lg"
                  style={{ background: "var(--gradient-gold)" }}
                  aria-label="اشترك الآن في المجموعة السنوية"
                >
                  <Sparkles className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
                  <span className="tracking-tight">اشترك الآن</span>
                  <ArrowLeft
                    className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover/cta:-translate-x-1"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
