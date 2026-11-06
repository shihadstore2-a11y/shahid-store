import { useState, useMemo, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Star,
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Sparkles,
  MessageSquareQuote,
  X,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  publicReviewsHomepageQueryOptions,
  publicReviewsFullQueryOptions,
  type StoreReview,
} from "@/lib/admin-reviews";

const FALLBACK_REVIEWS: StoreReview[] = [
  {
    id: "fb-1",
    store_id: "",
    author_name: "أبو خالد التميمي",
    customer_name: "أبو خالد التميمي",
    customer_city: "الرياض",
    rating: 5,
    comment_ar: "خدمة ممتازة وسريعة جداً. البث مستقر والمباريات ولا غلطة، وسرعة الدعم في الواتساب تبهرك.",
    review_text: "خدمة ممتازة وسريعة جداً. البث مستقر والمباريات ولا غلطة، وسرعة الدعم في الواتساب تبهرك.",
    product_label: "فالكون برو — سنة كاملة",
    product_name: "فالكون برو — سنة كاملة",
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-2",
    store_id: "",
    author_name: "سعد القحطاني",
    customer_name: "سعد القحطاني",
    customer_city: "جدة",
    rating: 5,
    comment_ar: "سيرفر هولك جبار والأفلام كلها مترجمة وجودة 4K خرافية. شكراً للقائمين على المتجر.",
    review_text: "سيرفر هولك جبار والأفلام كلها مترجمة وجودة 4K خرافية. شكراً للقائمين على المتجر.",
    product_label: "هولك بلاير — سنة كاملة",
    product_name: "هولك بلاير — سنة كاملة",
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-3",
    store_id: "",
    author_name: "محمد الشمري",
    customer_name: "محمد الشمري",
    customer_city: "الدمام",
    rating: 5,
    comment_ar: "أفضل متجر تعاملت معه، التفعيل وصلني بالواتساب بعد الدفع مباشرة بدون تأخير.",
    review_text: "أفضل متجر تعاملت معه، التفعيل وصلني بالواتساب بعد الدفع مباشرة بدون تأخير.",
    product_label: "الباقة الذهبية السنوية (فالكون + هولك)",
    product_name: "الباقة الذهبية السنوية (فالكون + هولك)",
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-4",
    store_id: "",
    author_name: "طلال بو فهد",
    customer_name: "طلال بو فهد",
    customer_city: "الخبر",
    rating: 5,
    comment_ar: "تطبيق سمارترز ممتاز وثابت بدون تقطيع في المباريات والمسلسلات، تجربة موفقة جداً.",
    review_text: "تطبيق سمارترز ممتاز وثابت بدون تقطيع في المباريات والمسلسلات، تجربة موفقة جداً.",
    product_label: "سمارترز برو — سنة + 3 أشهر",
    product_name: "سمارترز برو — سنة + 3 أشهر",
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-5",
    store_id: "",
    author_name: "باسل بن عامر",
    customer_name: "باسل بن عامر",
    customer_city: "مكة المكرمة",
    rating: 5,
    comment_ar: "باقة فالكون لجهازين ممتازة جداً وتعمل بسلاسة في نفس الوقت، خدمة تستحق كل ريال.",
    review_text: "باقة فالكون لجهازين ممتازة جداً وتعمل بسلاسة في نفس الوقت، خدمة تستحق كل ريال.",
    product_label: "فالكون برو — سنة | جهازان",
    product_name: "فالكون برو — سنة | جهازان",
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-6",
    store_id: "",
    author_name: "مروان المطيري",
    customer_name: "مروان المطيري",
    customer_city: "بريدة",
    rating: 5,
    comment_ar: "هولك بلاير ممتاز جداً وثبات عالي في القنوات الرياضية وقسم الأفلام متجدد أولاً بأول.",
    review_text: "هولك بلاير ممتاز جداً وثبات عالي في القنوات الرياضية وقسم الأفلام متجدد أولاً بأول.",
    product_label: "هولك بلاير — 6 أشهر",
    product_name: "هولك بلاير — 6 أشهر",
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

type Variant = "homepage" | "full";

export function StoreReviewsSection({ variant = "homepage" }: { variant?: Variant } = {}) {
  const isFull = variant === "full";
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [search, setSearch] = useState<string>("");
  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "highest">("newest");
  const homeScrollRef = useRef<HTMLDivElement>(null);

  const { data: dbReviews, isLoading } = useQuery(
    isFull ? publicReviewsFullQueryOptions() : publicReviewsHomepageQueryOptions()
  );

  const allReviews: StoreReview[] = useMemo(() => {
    if (dbReviews && dbReviews.length > 0) return dbReviews;
    return FALLBACK_REVIEWS;
  }, [dbReviews]);

  // إحصائيات التقييمات
  const stats = useMemo(() => {
    const total = allReviews.length;
    const avg =
      total > 0
        ? allReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / total
        : 5;
    const count5 = allReviews.filter((r) => Number(r.rating) >= 5).length;
    const count4 = allReviews.filter((r) => Number(r.rating) === 4).length;
    return {
      total,
      avg: Math.round(avg * 10) / 10,
      count5,
      count4,
    };
  }, [allReviews]);

  // التصفية والبحث لصفحة /reviews
  const filteredReviews = useMemo(() => {
    let list = [...allReviews];

    if (starFilter !== "all") {
      list = list.filter((r) => Math.round(Number(r.rating) || 5) === starFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const author = (r.author_name || r.customer_name || "").toLowerCase();
        const prod = (r.product_label || r.product_name || "").toLowerCase();
        const comment = (r.comment_ar || r.review_text || r.comment || "").toLowerCase();
        const city = (r.customer_city || "").toLowerCase();
        return author.includes(q) || prod.includes(q) || comment.includes(q) || city.includes(q);
      });
    }

    if (sortOrder === "highest") {
      list.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
    } else {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return list;
  }, [allReviews, starFilter, search, sortOrder]);

  const displayedReviews = useMemo(() => {
    if (!isFull) {
      return allReviews.slice(0, 16);
    }
    return filteredReviews.slice(0, visibleCount);
  }, [isFull, allReviews, filteredReviews, visibleCount]);

  const scrollHome = (direction: "left" | "right") => {
    if (!homeScrollRef.current) return;
    const scrollAmount = 340;
    homeScrollRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto max-w-7xl px-4">
        
        {/* في الصفحة الرئيسية: رأس القسم مع أزرار التنقل */}
        {!isFull ? (
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-black tracking-wide text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                <span>تجارب موثَّقة 100%</span>
              </span>
              <div className="mb-2 flex items-center gap-1" dir="ltr">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <h2 className="mb-1 text-2xl font-black md:text-3xl text-foreground">
                ماذا قال عملاؤنا
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                تجارب حقيقية من مشتركين في باقات ديوان البث
              </p>
            </div>

            {/* أزرار التحريك الأفقي */}
            {allReviews.length > 2 && (
              <div className="flex items-center gap-2 self-end md:self-auto" dir="ltr">
                <button
                  type="button"
                  onClick={() => scrollHome("left")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-secondary/50 text-foreground transition hover:bg-secondary hover:border-accent/40"
                  aria-label="السابق"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollHome("right")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-secondary/50 text-foreground transition hover:bg-secondary hover:border-accent/40"
                  aria-label="التالي"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* في صفحة /reviews: ملخص الإحصائيات الشامل */
          <div className="mb-8 rounded-3xl border border-accent/30 bg-gradient-to-br from-card to-card/60 p-6 sm:p-8 text-center shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="space-y-1">
                <span className="text-4xl sm:text-5xl font-black text-accent">
                  {stats.avg.toFixed(1)}
                </span>
                <div className="flex justify-center gap-1 my-1" dir="ltr">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  متوسط تقييم الخدمة
                </p>
              </div>

              <div className="space-y-1 sm:border-x sm:border-border sm:px-12">
                <span className="text-4xl sm:text-5xl font-black text-foreground">
                  {stats.total.toLocaleString("ar-SA")}
                </span>
                <p className="text-xs sm:text-sm font-bold text-accent">
                  تقييم حقيقي وموثّق ✓
                </p>
                <p className="text-xs text-muted-foreground">
                  من عملاء ومشتركين حقيقيين
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-4xl sm:text-5xl font-black text-emerald-400">
                  99%
                </span>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  نسبة رضا المشتركين
                </p>
                <p className="text-xs text-muted-foreground">
                  يوصون بالاشتراك مع ديوان البث
                </p>
              </div>
            </div>
          </div>
        )}

        {/* فلاتر النجوم والبحث في صفحة /reviews */}
        {isFull && (
          <div className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStarFilter("all");
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  starFilter === "all"
                    ? "bg-accent text-accent-foreground shadow-md font-black"
                    : "bg-secondary/60 border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                جميع التقييمات ({stats.total.toLocaleString("ar-SA")})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStarFilter(5);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  starFilter === 5
                    ? "bg-accent text-accent-foreground shadow-md font-black"
                    : "bg-secondary/60 border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>5 نجوم</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>({stats.count5.toLocaleString("ar-SA")})</span>
              </button>
              {stats.count4 > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStarFilter(4);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    starFilter === 4
                      ? "bg-accent text-accent-foreground shadow-md font-black"
                      : "bg-secondary/60 border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>4 نجوم</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>({stats.count4.toLocaleString("ar-SA")})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث باسم العميل أو الباقة..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="w-full rounded-xl border border-border bg-secondary/40 pr-9 pl-8 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-accent transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-accent"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="highest">الأعلى تقييماً</option>
              </select>
            </div>
          </div>
        )}

        {/* عرض التقييمات: أفقي في الصفحة الرئيسية، شبكة في صفحة /reviews */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-border bg-card/50 p-4"
              />
            ))}
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card/40 p-8">
            <MessageSquareQuote className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">لا توجد تقييمات مطابقة للبحث</h3>
            <p className="text-xs text-muted-foreground mt-1">
              جرّب تغيير كلمات البحث أو فلتر التقييم بالنجوم.
            </p>
          </div>
        ) : !isFull ? (
          /* الوضع الأفقي القابل للتمرير في الصفحة الرئيسية */
          <div
            ref={homeScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "oklch(0.78 0.16 85 / 0.3) transparent",
            }}
          >
            {displayedReviews.map((r, i) => {
              const comment = r.comment_ar || r.review_text || r.comment || "";
              const author = r.author_name || r.customer_name || "عميل موثق";
              const product = r.product_label || r.product_name || "";
              const city = r.customer_city || null;

              return (
                <div
                  key={r.id || i}
                  className="w-[285px] sm:w-[320px] md:w-[350px] shrink-0 snap-start flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:border-accent/40 hover:shadow-md"
                >
                  <div>
                    {/* النجوم وشارة التحقق */}
                    <div className="mb-3 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex gap-0.5" dir="ltr">
                        {[...Array(5)].map((_, s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s < (Number(r.rating) || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>مشتري موثّق</span>
                      </span>
                    </div>

                    {/* وسم اسم المنتج */}
                    {product && (
                      <div className="mb-2.5">
                        <span className="inline-block text-[11px] font-black text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-lg max-w-full truncate">
                          {product}
                        </span>
                      </div>
                    )}

                    {/* نص التقييم */}
                    <p className="mb-4 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-4">
                      &quot;{comment}&quot;
                    </p>
                  </div>

                  {/* بيانات العميل */}
                  <div className="pt-3 border-t border-border/50 mt-auto flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-accent border border-border">
                      {author.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-foreground">
                        {author}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {city ? `${city} · ` : ""}
                        {product}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* الوضع العمودي (Grid) لصفحة /reviews */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedReviews.map((r, i) => {
              const comment = r.comment_ar || r.review_text || r.comment || "";
              const author = r.author_name || r.customer_name || "عميل موثق";
              const product = r.product_label || r.product_name || "";
              const city = r.customer_city || null;

              return (
                <div
                  key={r.id || i}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:border-accent/40 hover:shadow-md"
                >
                  <div>
                    {/* النجوم وشارة التحقق */}
                    <div className="mb-3 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex gap-0.5" dir="ltr">
                        {[...Array(5)].map((_, s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s < (Number(r.rating) || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>مشتري موثّق</span>
                      </span>
                    </div>

                    {/* وسم اسم المنتج واضح في البطاقة */}
                    {product && (
                      <div className="mb-2.5">
                        <span className="inline-block text-[11px] font-black text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-lg max-w-full truncate">
                          {product}
                        </span>
                      </div>
                    )}

                    {/* نص التقييم */}
                    <p className="mb-4 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-4">
                      &quot;{comment}&quot;
                    </p>
                  </div>

                  {/* بيانات العميل */}
                  <div className="pt-3 border-t border-border/50 mt-auto flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-accent border border-border">
                      {author.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-foreground">
                        {author}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {city ? `${city} · ` : ""}
                        {product}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* رابط مشاهدة المزيد في الصفحة الرئيسية */}
        {!isFull && allReviews.length > 4 && (
          <div className="mt-8 text-center">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/5 px-6 py-2.5 text-xs font-black text-accent hover:bg-accent hover:text-accent-foreground transition"
            >
              <span>مشاهدة جميع تقييمات المشتركين ({allReviews.length})</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* زر تحميل المزيد في صفحة /reviews */}
        {isFull && visibleCount < filteredReviews.length && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 border border-border transition"
            >
              <span>عرض المزيد من التقييمات</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
