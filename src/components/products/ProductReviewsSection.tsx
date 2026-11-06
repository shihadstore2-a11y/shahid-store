import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Star,
  CheckCircle2,
  Lock,
  LogIn,
  MessageSquarePlus,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  getProductReviews,
  checkReviewEligibility,
  submitProductReview,
  type ProductReviewItem,
} from "@/lib/product-reviews.functions";
import { cn } from "@/lib/utils";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
}

export function ProductReviewsSection({
  productId,
  productName,
  productSlug,
}: ProductReviewsSectionProps) {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fnGetReviews = useServerFn(getProductReviews);
  const fnCheckEligibility = useServerFn(checkReviewEligibility);
  const fnSubmitReview = useServerFn(submitProductReview);

  // حالة نموذج التقييم
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>("");

  // 1. جلب التقييمات الحالية للمنتج
  const reviewsQuery = useQuery({
    queryKey: ["product-reviews", productId || productSlug],
    queryFn: () => fnGetReviews({ data: { productId, productName, productSlug } }),
    staleTime: 30_000,
  });

  // 2. فحص أهلية التقييم
  const eligibilityQuery = useQuery({
    queryKey: [
      "review-eligibility",
      productSlug,
      user?.id,
      user?.email,
      (profile as any)?.phone,
    ],
    queryFn: () =>
      fnCheckEligibility({
        data: {
          productName,
          productSlug,
          productId,
          userId: user?.id || null,
          userEmail: user?.email || null,
          userPhone: (profile as any)?.phone || user?.phone || null,
          userName: (profile as any)?.full_name || (user?.user_metadata as any)?.full_name || null,
        },
      }),
    enabled: !isAuthLoading,
    staleTime: 30_000,
  });

  // 3. إرسال التقييم
  const submitMutation = useMutation({
    mutationFn: async () => {
      const trimmedComment = comment.trim();
      if (!trimmedComment) {
        throw new Error("يرجى كتابة نص التقييم قبل الإرسال");
      }
      if (trimmedComment.length < 3) {
        throw new Error("نص التقييم يجب ألا يقل عن 3 أحرف");
      }
      return fnSubmitReview({
        data: {
          productName,
          productSlug,
          productId,
          rating,
          comment: trimmedComment,
          customerName:
            (profile as any)?.full_name ||
            (user?.user_metadata as any)?.full_name ||
            user?.email?.split("@")[0] ||
            "عميل موثق",
          userId: user?.id || null,
          userEmail: user?.email || null,
          userPhone: (profile as any)?.phone || user?.phone || null,
        },
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.message || "تم إرسال التقييم بنجاح";
      toast.success(msg);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review-eligibility"] });
    },
    onError: (err: any) => {
      let message = "فشل إرسال التقييم، يرجى المحاولة لاحقاً";
      if (err) {
        const raw = typeof err === "string" ? err : err.message || "";
        if (raw.startsWith("[") || raw.startsWith("{")) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
              message = parsed[0].message;
            } else if (parsed?.message) {
              message = parsed.message;
            } else {
              message = raw;
            }
          } catch {
            message = raw;
          }
        } else if (raw) {
          message = raw;
        }
      }
      toast.error(message);
    },
  });

  const scrollHorizontally = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 340;
    scrollContainerRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const reviewsData = reviewsQuery.data;
  const reviews = reviewsData?.reviews || [];
  const totalCount = reviewsData?.totalCount || 0;
  const avgRating = reviewsData?.averageRating || 5;
  const distribution = reviewsData?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  const eligibility = eligibilityQuery.data;
  const isCheckingEligibility = eligibilityQuery.isLoading || isAuthLoading;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-6 md:p-8 shadow-xl backdrop-blur-sm">
        
        {/* رأس القسم */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              <span>تقييمات وتجارب المشتركين الموثقة</span>
            </div>
            <h2 className="mt-2.5 text-2xl font-black text-foreground md:text-3xl">
              آراء المشتركين في {productName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              تقييمات معتمدة من عملاء قاموا بشراء وتفعيل هذا الاشتراك.
            </p>
          </div>

          {/* متوسط التقييم */}
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-secondary/50 p-4 shrink-0">
            <div className="text-center">
              <div className="text-3xl font-black text-accent">{avgRating}</div>
              <div className="text-[11px] font-medium text-muted-foreground">من 5 نجوم</div>
            </div>
            <div className="h-10 w-px bg-border/60" />
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <div className="mt-1 text-xs font-bold text-foreground">
                {totalCount > 0 ? `${totalCount} تقييم موثق` : "تقييم المتجر 5.0"}
              </div>
            </div>
          </div>
        </div>

        {/* توزيع التقييمات وصندوق المشاركة */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          
          {/* شريط توزيع النجوم */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
              <h3 className="text-xs font-black text-foreground mb-3">
                توزيع التقييمات
              </h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = (distribution as any)[star] || 0;
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : star === 5 ? 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 w-12 shrink-0 font-bold text-foreground">
                        <span>{star}</span>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="relative h-2 flex-1 rounded-full bg-border/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#cda105] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-muted-foreground font-mono text-[11px]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-200">شفافية ومصداقية تامة</span>
                التقييمات مخصصة لمشتري الخدمة ويتم التحقق من الطلب لضمان الموثوقية.
              </div>
            </div>
          </div>

          {/* صندوق التقييم التفاعلي */}
          <div className="lg:col-span-7">
            {isCheckingEligibility ? (
              <div className="flex h-full min-h-[190px] items-center justify-center rounded-2xl border border-border/60 bg-secondary/20 p-6">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span className="mr-3 text-xs text-muted-foreground">جارٍ التحقق من الأهلية للتقييم...</span>
              </div>
            ) : !user ? (
              <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-secondary/60 to-secondary/30 p-5 md:p-6 text-center flex flex-col items-center justify-center h-full min-h-[190px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-accent mb-2.5">
                  <LogIn className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-foreground">
                  هل قمت بشراء هذا الاشتراك مسبقاً؟
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-md">
                  التقييم متاح للمشتركين الذين أتموا طلبهم. سجّل دخولك لإضافة رأيك الموثق.
                </p>
                <Link
                  to="/login"
                  search={{ redirect: `/products/${productSlug}` }}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-xs font-black text-accent-foreground shadow-[var(--shadow-gold)] transition hover:opacity-95"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>تسجيل الدخول لإضافة تقييم</span>
                </Link>
              </div>
            ) : eligibility?.status === "not_purchased" ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 md:p-6 flex flex-col items-center justify-center text-center h-full min-h-[190px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2.5">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-foreground">
                  التقييم مخصص لمشتري هذه الباقة
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-md">
                  عزيزي العميل، لم يتم العثور على طلب مكتمل لباقة ({productName}) بحسابك الحالي. بعد التفعيل سيتاح لك التقييم فوراً.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-amber-300/80">
                  <AlertCircle className="h-3 w-3" />
                  <span>تأكد من تسجيل الدخول برقم الجوال أو البريد الذي استخدمته عند الشراء.</span>
                </div>
              </div>
            ) : eligibility?.status === "already_reviewed" ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 md:p-6 flex flex-col items-center justify-center text-center h-full min-h-[190px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2.5">
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-foreground">
                  شكراً لمشاركتك! لقد قمت بتقييم هذه الخدمة
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-md">
                  تقييمك مسجل في المتجر، ورأيك يساهم في مساعدة المشتركين الجدد.
                </p>
                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < (eligibility.existingReview?.rating || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitMutation.mutate();
                }}
                className="rounded-2xl border border-accent/40 bg-secondary/40 p-5 md:p-6 shadow-inner"
              >
                <div className="flex items-center gap-2 text-accent font-bold text-xs mb-1.5">
                  <MessageSquarePlus className="h-4 w-4" />
                  <span>مرحباً {eligibility?.customerName} — شاركنا تجربتك الموثقة</span>
                </div>
                <h3 className="text-base font-black text-foreground">
                  كيف كانت تجربتك مع {productName}؟
                </h3>

                {/* اختيار النجوم */}
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="text-xs font-bold text-muted-foreground">تقييمك:</span>
                  <div className="flex items-center gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = hoverRating ? star <= hoverRating : star <= rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                          aria-label={`${star} نجوم`}
                        >
                          <Star
                            className={cn(
                              "h-5 w-5 transition-colors",
                              active
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                : "text-muted-foreground/40"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-black text-amber-400">
                    {hoverRating || rating} من 5
                  </span>
                </div>

                {/* حقل التعليق */}
                <div className="mt-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="اكتب تجربتك مع الباقة، سرعة التفعيل، جودة القنوات، وسرعة تجاوب الدعم..."
                    rows={2}
                    maxLength={500}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background/80 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>يظهر التقييم بشارة «مشتري موثّق»</span>
                    <span className="flex items-center gap-2">
                      {comment.trim().length > 0 && comment.trim().length < 3 && (
                        <span className="text-amber-400 font-bold">الحد الأدنى 3 أحرف</span>
                      )}
                      <span>{comment.length}/500</span>
                    </span>
                  </div>
                </div>

                {/* زر الإرسال */}
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitMutation.isPending || !comment.trim() || comment.trim().length < 3}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-black text-accent-foreground shadow-[var(--shadow-gold)] transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>جارٍ الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>إرسال التقييم الموثق</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* التقييمات الأفقية (Horizontal Swipeable Slider / Carousel) */}
        <div className="mt-10 border-t border-border/50 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-foreground">
                تجارب المشتركين ({reviews.length})
              </h3>
              <span className="text-[11px] text-muted-foreground">اسحب أفقياً لتصفح باقي الآراء</span>
            </div>
            
            {/* أزرار التحريك الأفقي */}
            {reviews.length > 2 && (
              <div className="flex items-center gap-1.5" dir="ltr">
                <button
                  type="button"
                  onClick={() => scrollHorizontally("left")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-secondary/50 text-foreground transition hover:bg-secondary hover:border-accent/40"
                  aria-label="السابق"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollHorizontally("right")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-secondary/50 text-foreground transition hover:bg-secondary hover:border-accent/40"
                  aria-label="التالي"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {reviewsQuery.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-accent" />
              <p className="mt-2 text-xs">جارٍ تحميل التقييمات المعتمدة...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center">
              <Star className="mx-auto h-7 w-7 text-muted-foreground/30" />
              <p className="mt-2 text-sm font-bold text-foreground">
                لا توجد تقييمات منشورة لهذا الاشتراك بعد
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                كن أول من يقيّم هذه الخدمة بعد إتمام الشراء والتفعيل!
              </p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "oklch(0.78 0.16 85 / 0.3) transparent",
              }}
            >
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 snap-start rounded-2xl border border-border/60 bg-secondary/25 p-4 transition-all duration-200 hover:border-accent/40 hover:bg-secondary/40 flex flex-col justify-between"
                >
                  <div>
                    {/* النجوم وشارة التحقق */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1" dir="ltr">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>مشتري موثّق</span>
                      </span>
                    </div>

                    {/* نص التعليق */}
                    <p className="text-xs leading-relaxed text-foreground/90 line-clamp-4">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>

                  {/* بيانات صاحب التقييم */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-black text-accent shrink-0">
                      {rev.author_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-foreground">
                        {rev.author_name}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {rev.customer_city ?? "عميل معتمد"}
                        {rev.product_name ? ` · ${rev.product_name}` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

