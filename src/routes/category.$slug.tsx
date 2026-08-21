import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { ErrorFallback } from "@/components/ErrorFallback";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductsByCategory } from "@/lib/queries";

const CATEGORY_NAMES_AR: Record<string, string> = {
  falcon: "اشتراك فالكون برو الرسمي",
  hulk: "اشتراك هولك بلاير الرسمي",
  smarters: "اشتراك سمارترز برو",
  "annual-offers": "مجموعات سنوية مميّزة",
};

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const url = `https://shahidstore.net/category/${params.slug}`;
    const meta_by_slug: Record<string, { title: string; description: string }> = {
      falcon: {
        title: "اشتراك فالكون برو IPTV — شاهد ستور",
        description:
          "اشترك في فالكون برو IPTV مع آلاف القنوات والأفلام بجودة 4K، تفعيل سريع، ودعم لكل الأجهزة في السعودية ودول الخليج.",
      },
      hulk: {
        title: "اشتراك هولك بلاير IPTV — شاهد ستور",
        description:
          "هولك بلاير IPTV بتغطية رياضية وترفيهية شاملة، أكثر من 8000 قناة، جودة ممتازة، وتفعيل سريع من شاهد ستور.",
      },
      smarters: {
        title: "اشتراك سمارترز برو IPTV — شاهد ستور",
        description:
          "سمارترز برو IPTV — تجربة مشاهدة ذكية بثبات عالي وجودة ممتازة مع دعم كامل لكل الأجهزة وتفعيل بدون تعقيد.",
      },
      "annual-offers": {
        title: "عروض الاشتراكات السنوية — شاهد ستور",
        description:
          "أفضل عروض الاشتراكات السنوية لـ IPTV من شاهد ستور — وفّر أكثر مع باقات السنة الكاملة.",
      },
    };
    const name = CATEGORY_NAMES_AR[params.slug] ?? params.slug;
    const fallback = {
      title: `${name} — شاهد ستور`,
      description: `تصفح باقات ${name} في شاهد ستور بأسعار مناسبة وتفعيل سريع.`,
    };
    const m = meta_by_slug[params.slug] ?? fallback;
    return {
      meta: [
        { title: m.title },
        { name: "description", content: m.description },
        { property: "og:title", content: m.title },
        { property: "og:description", content: m.description },
        { property: "og:url", content: url },
      ],
      links: [
        { rel: "canonical", href: url },
      ],
    };
  },
  component: CategoryPage,
  errorComponent: (props) => <ErrorFallback {...props} />,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => fetchProductsByCategory(slug),
  });

  return (
    <SiteLayout>
      <section className="text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 py-10 text-center">
          <h1 className="text-3xl font-black sm:text-4xl">
            {data?.category?.name_ar ?? slug}
          </h1>
          {data?.category?.description && (
            <p className="mx-auto mt-2 max-w-2xl text-white/85">
              {data.category.description}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
              >
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : !data?.category ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">التصنيف غير موجود.</p>
            <Link to="/products" className="mt-4 inline-block font-bold text-primary hover:underline">
              عرض كل الباقات ←
            </Link>
          </div>
        ) : data.products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            لا توجد منتجات في هذا التصنيف بعد
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
