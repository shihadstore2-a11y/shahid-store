import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { ErrorFallback } from "@/components/ErrorFallback";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, fetchProducts } from "@/lib/queries";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "كل الباقات — شاهد ستور" },
      {
        name: "description",
        content: "تصفح كل باقات الاشتراكات الرقمية المتاحة في شاهد ستور.",
      },
      { property: "og:title", content: "كل باقات اشتراكات IPTV — شاهد ستور" },
      {
        property: "og:description",
        content:
          "تصفح كل باقات فالكون برو، هولك بلاير، وسمارترز برو في شاهد ستور بأسعار تنافسية وتفعيل فوري.",
      },
      { property: "og:url", content: "https://shahidstore.net/products" },
    ],
    links: [
      { rel: "canonical", href: "https://shahidstore.net/products" },
    ],
  }),
  component: ProductsPage,
  errorComponent: (props) => <ErrorFallback {...props} />,
});

function ProductsPage() {
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState<string | "all">("all");
  const [sort, setSort] = useState<"bestseller" | "price_asc" | "price_desc">("bestseller");

  const cats = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const prods = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const list = useMemo(() => {
    let arr = [...(prods.data ?? [])];
    if (catId !== "all") arr = arr.filter((p) => p.category_id === catId);
    if (q.trim()) {
      const s = q.trim();
      arr = arr.filter(
        (p) => p.name_ar.includes(s) || (p.description ?? "").includes(s),
      );
    }
    if (sort === "price_asc") arr.sort((a, b) => (a.sale_price ?? a.base_price) - (b.sale_price ?? b.base_price));
    else if (sort === "price_desc") arr.sort((a, b) => (b.sale_price ?? b.base_price) - (a.sale_price ?? a.base_price));
    else arr.sort((a, b) => b.sales_count - a.sales_count);
    return arr;
  }, [prods.data, catId, q, sort]);

  return (
    <SiteLayout>
      <section
        className="text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-10 text-center">
          <h1 className="text-3xl font-black sm:text-4xl">كل الباقات</h1>
          <p className="mt-2 text-white/80">اختر باقتك المفضلة بسعر مناسب</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-black text-foreground">البحث</h3>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن باقة..."
                className="w-full rounded-lg border border-input bg-background py-2 ps-3 pe-10 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-black text-foreground">التصنيف</h3>
            <div className="space-y-1">
              <button
                onClick={() => setCatId("all")}
                className={`block w-full rounded-md px-3 py-2 text-right text-sm ${catId === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >
                الكل
              </button>
              {(cats.data ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCatId(c.id)}
                  className={`block w-full rounded-md px-3 py-2 text-right text-sm ${catId === c.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  {c.name_ar}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-black text-foreground">الترتيب</h3>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm"
            >
              <option value="bestseller">الأكثر مبيعاً</option>
              <option value="price_asc">السعر: من الأقل للأعلى</option>
              <option value="price_desc">السعر: من الأعلى للأقل</option>
            </select>
          </div>
        </aside>

        <div>
          {prods.isLoading ? (
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
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
