import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { fetchProducts } from "@/lib/queries";
import { formatSAR } from "@/lib/format";
import { getCategoryIcon } from "@/components/icons/CategoryIcons";

const KNOWN_CATEGORIES = ["falcon", "hulk", "smarters", "annual-offers"] as const;
function deriveCategorySlug(productSlug: string): string {
  const lower = productSlug.toLowerCase();
  if (lower.startsWith("bundle")) return "annual-offers";
  return KNOWN_CATEGORIES.find((c) => lower.includes(c)) ?? "falcon";
}

type Props = { open: boolean; onClose: () => void };

export function SearchOverlay({ open, onClose }: Props) {
  const [q, setQ] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    enabled: open,
  });

  // Esc يغلق + lock scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products.slice(0, 6);
    return products
      .filter((p) =>
        [p.name_ar, p.slug]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 8);
  }, [products, q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-background/85 px-4 pt-16 backdrop-blur-md md:pt-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="بحث"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)]"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-accent" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن باقة (فالكون، هولك، سمارترز...)"
            className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              لا توجد نتائج لـ "{q}"
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {!q.trim() && (
                <li className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  مقترحات
                </li>
              )}
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                      {getCategoryIcon(deriveCategorySlug(p.slug), 26)}
                    </span>
                    <span className="flex-1 truncate text-sm font-bold text-foreground">
                      {p.name_ar}
                    </span>
                    <span className="shrink-0 text-sm font-black tabular-nums text-accent">
                      {formatSAR(p.sale_price ?? p.base_price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border bg-background/40 px-4 py-2 text-[11px] text-muted-foreground">
          اضغط <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> للإغلاق
        </div>
      </div>
    </div>
  );
}
