import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  publicReviewsHomepageQueryOptions,
  publicReviewsFullQueryOptions,
} from "@/lib/admin-reviews";

type DisplayReview = {
  customer_name: string;
  customer_city: string | null;
  product_label: string | null;
  review_text: string;
  rating: number;
};

const FALLBACK_REVIEWS: DisplayReview[] = [
  {
    customer_name: "أحمد ع.",
    customer_city: "الرياض",
    product_label: "فالكون سنة",
    review_text: "تجربة ممتازة، التفعيل كان سريع جداً والقنوات شغّالة بدون أي مشاكل.",
    rating: 5,
  },
  {
    customer_name: "محمد ف.",
    customer_city: "جدة",
    product_label: "سمارترز سنة + 3",
    review_text: "أسعار منافسة ودعم متجاوب في نفس اللحظة، أنصح فيه.",
    rating: 5,
  },
  {
    customer_name: "فهد ن.",
    customer_city: "الدمام",
    product_label: "هولك 6 شهور",
    review_text: "جودة عالية واستقرار ممتاز حتى في أوقات المباريات الكبيرة.",
    rating: 5,
  },
  {
    customer_name: "عبدالله",
    customer_city: "مكة",
    product_label: "فالكون سنة جهازين",
    review_text: "العرض ممتاز وفّر علي شراء اشتراكين منفصلين، التجديد سهل وسريع.",
    rating: 5,
  },
  {
    customer_name: "سلطان م.",
    customer_city: "تبوك",
    product_label: "هولك سنة",
    review_text: "ثبات ممتاز في البث وجودة عالية حتى على الإنترنت المتوسط.",
    rating: 5,
  },
  {
    customer_name: "خالد ر.",
    customer_city: "أبها",
    product_label: "سمارترز سنة",
    review_text: "إعداد بسيط على الجهاز ودعم متوفّر طوال الوقت، تعاملهم محترف.",
    rating: 5,
  },
  {
    customer_name: "ناصر ال.",
    customer_city: "الطائف",
    product_label: "فالكون 6 شهور",
    review_text: "أسعار مناسبة وجودة عالية. التجديد تم خلال دقائق بدون أي تعقيد.",
    rating: 5,
  },
  {
    customer_name: "بدر س.",
    customer_city: "حائل",
    product_label: "هولك 3 شهور",
    review_text: "اشتركت للمرة الثانية، تجربة جيدة جداً ودعم فني يردّ بسرعة.",
    rating: 5,
  },
];

type Variant = "homepage" | "full";

export function StoreReviewsSection({ variant = "homepage" }: { variant?: Variant } = {}) {
  const isFull = variant === "full";
  const { data: dbReviews } = useQuery(
    isFull ? publicReviewsFullQueryOptions() : publicReviewsHomepageQueryOptions(),
  );
  const reviews: DisplayReview[] =
    dbReviews && dbReviews.length > 0
      ? dbReviews
      : isFull
        ? FALLBACK_REVIEWS
        : FALLBACK_REVIEWS.slice(0, 5);

  const avg =
    reviews.reduce((s, r) => s + r.rating, 0) / Math.max(reviews.length, 1);
  const avgRounded = Math.round(avg);
  const display = isFull ? reviews.slice(0, 100) : reviews.slice(0, 5);

  return (
    <section className="py-10 md:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 text-center md:mb-8">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-accent md:text-xs">
            تجارب موثَّقة
          </span>
          <div className="mb-2 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  i < avgRounded
                    ? "h-6 w-6 fill-amber-400 text-amber-400"
                    : "h-6 w-6 text-muted-foreground/40"
                }
              />
            ))}
          </div>
          <h2 className="mb-1 text-2xl font-black md:text-3xl">ماذا قال عملاؤنا</h2>
          <p className="text-sm text-muted-foreground">
            تجارب حقيقية من مشتركين في شاهد ستور
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {display.map((r, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-accent/40 hover:shadow-[0_10px_28px_-12px_oklch(0.78_0.16_85/0.35)]"
            >
              <div className="mb-3 flex gap-0.5" dir="ltr">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={
                      s < r.rating
                        ? "h-4 w-4 fill-amber-400 text-amber-400"
                        : "h-4 w-4 text-muted-foreground/40"
                    }
                  />
                ))}
              </div>
              <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                &quot;{r.review_text}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-accent">
                  {r.customer_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{r.customer_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.customer_city ?? ""}
                    {r.customer_city && r.product_label ? " · " : ""}
                    {r.product_label ?? ""}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
