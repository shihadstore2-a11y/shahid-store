import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { homeCategoriesQueryOptions } from "@/lib/queries";
import { getCategoryIcon } from "@/components/icons/CategoryIcons";

type Props = {
  category: string;
  title: string;
  subtitle: string;
  premium?: boolean;
  /** خلفية بديلة لإيقاع بصري بين الأقسام */
  alt?: boolean;
};

export function CategoryProductsSection({
  category,
  title,
  subtitle,
  premium,
  alt,
}: Props) {
  const { data } = useSuspenseQuery(homeCategoriesQueryOptions());
  const products = data[category] ?? [];

  const bgClass = premium
    ? "bg-accent/5"
    : alt
      ? "bg-secondary/40"
      : "bg-background";

  if (products.length === 0) {
    if (import.meta.env.DEV) {
      console.warn(`[CategoryProductsSection] No products in category: ${category}`);
    }
    return null;
  }

  return (
    <section
      id={`category-${category}`}
      className={`${bgClass} py-6 md:py-9`}
      aria-labelledby={`heading-${category}`}
    >
      <div className="container mx-auto max-w-7xl px-4">
        {/* Section header */}
        <div className="mb-4 flex items-center gap-3 md:mb-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center md:h-20 md:w-20">
            {getCategoryIcon(category, 64)}
          </div>
          <div>
            <h2
              id={`heading-${category}`}
              className="text-lg font-black leading-tight md:text-3xl"
            >
              {title}
            </h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Products grid: يتكيّف مع عدد المنتجات لتفادي خلايا فارغة على الديسكتوب */}
        {(() => {
          const count = products.length;
          const gridCols =
            count === 5
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
              : count === 2
                ? "mx-auto max-w-3xl grid-cols-2"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
          return (
            <div className={`grid gap-3 md:gap-4 ${gridCols}`}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} categorySlug={category} />
              ))}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
