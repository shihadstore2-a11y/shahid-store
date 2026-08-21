import { Link, useRouterState } from "@tanstack/react-router";
import { getCategoryIcon } from "@/components/icons/CategoryIcons";

const categories = [
  { slug: "falcon", label: "فالكون" },
  { slug: "hulk", label: "هولك" },
  { slug: "smarters", label: "سمارترز برو" },
  { slug: "annual-offers", label: "عروض سنوية", isCategoryRoute: true },
] as const;

export function CategoriesBar() {
  const { location } = useRouterState();
  const path = location.pathname;

  return (
    <div className="border-b border-border/60 bg-background/85 backdrop-blur-md">
      <nav
        aria-label="التصنيفات"
        className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:justify-center"
      >
        {categories.map((c) => {
          const isActive = path === `/category/${c.slug}`;
          return (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className={chipClass(isActive)}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {getCategoryIcon(c.slug, 20)}
              </span>
              <span>{c.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function chipClass(active: boolean): string {
  const base =
    "group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition-all md:text-sm";
  if (active) {
    return `${base} border-accent text-accent-foreground shadow-[0_4px_14px_-4px_oklch(0.82_0.17_80/0.55)] [background-image:var(--gradient-gold)]`;
  }
  return `${base} border-border bg-card/60 text-foreground hover:border-accent/60 hover:bg-accent/10 hover:text-accent`;
}
