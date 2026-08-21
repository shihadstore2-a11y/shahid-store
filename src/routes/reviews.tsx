import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { StoreReviewsSection } from "@/components/home/StoreReviewsSection";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "تقييمات العملاء — شاهد ستور" },
      {
        name: "description",
        content:
          "تجارب عملاء شاهد ستور الموثَّقة مع اشتراكات فالكون وهولك وسمارترز برو — جودة بث عالية وتفعيل سريع.",
      },
      { property: "og:title", content: "تقييمات العملاء — شاهد ستور" },
      {
        property: "og:description",
        content: "آراء حقيقية من عملاء شاهد ستور حول جودة الاشتراكات والدعم.",
      },
    ],
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border/60 bg-gradient-to-b from-card/40 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center md:py-14">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-accent md:text-xs">
            تقييمات موثَّقة
          </span>
          <h1 className="text-2xl font-black sm:text-3xl md:text-4xl">
            تجارب عملاء شاهد ستور
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            آراء حقيقية من عملاء جرّبوا اشتراكاتنا — جودة بث عالية، تفعيل سريع،
            ودعم متواصل.
          </p>
        </div>
      </section>
      <StoreReviewsSection variant="full" />
    </SiteLayout>
  );
}
