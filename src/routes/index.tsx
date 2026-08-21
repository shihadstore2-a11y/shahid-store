import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { HeroCinematic } from "@/components/home/HeroCinematic";
import { ValueBridge } from "@/components/home/ValueBridge";
import { CategoryProductsSection } from "@/components/home/CategoryProductsSection";
import { AnnualBundleShowcase } from "@/components/home/AnnualBundleShowcase";
import { AppGuidesSection } from "@/components/home/AppGuidesSection";
import { StoreReviewsSection } from "@/components/home/StoreReviewsSection";
import { TrustStrip } from "@/components/home/TrustStrip";
import { homeCategoriesQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "شاهد ستور — اشتراكات IPTV رسمية بتفعيل سريع" },
      {
        name: "description",
        content:
          "اشترك في فالكون برو، هولك بلاير، وسمارترز برو من شاهد ستور. تفعيل خلال 10 دقائق، دفع آمن عبر مدى وفيزا وماستركارد، ودعم 24/7.",
      },
      {
        property: "og:title",
        content: "شاهد ستور — اشتراكات IPTV رسمية بتفعيل سريع",
      },
      {
        property: "og:description",
        content:
          "متجر الاشتراكات الرقمية الموثوق في السعودية. فالكون، هولك، سمارترز — تفعيل سريع، دفع آمن، دعم متواصل.",
      },
      { property: "og:url", content: "https://shahidstore.net/" },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/hero-worldcup-1366.webp",
        imagesrcset:
          "/hero-worldcup-768.webp 768w, /hero-worldcup-1366.webp 1366w, /hero-worldcup-1920.webp 1920w",
        imagesizes: "100vw",
        fetchPriority: "high",
      },
      { rel: "canonical", href: "https://shahidstore.net/" },
    ],
  }),
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(homeCategoriesQueryOptions());
  },
  component: HomePage,
});

const GoldDivider = () => (
  <div
    aria-hidden
    className="mx-auto my-2 h-px w-32 bg-gradient-to-r from-transparent via-accent/40 to-transparent md:w-48"
  />
);

function HomePage() {
  return (
    <SiteLayout>
      {/* لمسات ذهبية شفافة جداً تُبرز #2b2b2b بدون أن تُغيّره — الصفحة الرئيسية فقط */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(520px circle at 12% 10%, oklch(0.78 0.16 85 / 0.07), transparent 60%), radial-gradient(620px circle at 88% 70%, oklch(0.78 0.16 85 / 0.05), transparent 65%)",
        }}
      />
      <HeroCinematic />
      <ValueBridge />

      <section
        id="catalog"
        aria-label="كتالوج الاشتراكات"
        className="scroll-mt-20 pb-8 pt-4 md:pb-12 md:pt-6"
      >
        <div className="container mx-auto max-w-7xl px-4">
          <CategoryProductsSection
            category="falcon"
            title="اشتراك فالكون برو الرسمي"
            subtitle="آلاف القنوات والأفلام بجودة 4K"
          />
          <GoldDivider />
          <CategoryProductsSection
            category="hulk"
            title="اشتراك هولك بلاير الرسمي"
            subtitle="بث رياضي شامل بجودة عالية"
          />
          <GoldDivider />
          <CategoryProductsSection
            category="smarters"
            title="اشتراك سمارترز برو"
            subtitle="أسهل تطبيق IPTV على جميع الأجهزة"
          />
        </div>
      </section>

      <AnnualBundleShowcase />

      <GoldDivider />
      <TrustStrip />
      <AppGuidesSection />
      <StoreReviewsSection />
    </SiteLayout>
  );
}
