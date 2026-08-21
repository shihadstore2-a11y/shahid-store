import { Link } from "@tanstack/react-router";
import { ArrowLeft, Package, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopProduct } from "@/lib/admin-queries";

const PODIUM = [
  "bg-gradient-to-br from-[oklch(0.88_0.20_90)] to-[oklch(0.65_0.15_80)] text-[oklch(0.15_0_0)] shadow-[0_0_18px_oklch(0.78_0.16_85/0.55)]", // gold
  "bg-gradient-to-br from-[oklch(0.85_0_0)] to-[oklch(0.62_0_0)] text-[oklch(0.15_0_0)] shadow-[0_0_12px_oklch(0.85_0_0/0.35)]", // silver
  "bg-gradient-to-br from-[oklch(0.65_0.10_55)] to-[oklch(0.45_0.08_50)] text-white shadow-[0_0_12px_oklch(0.55_0.10_55/0.4)]", // bronze
];

export function TopProductsList({ items }: { items: TopProduct[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-gold/30">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black">الأكثر مبيعاً</h3>
          {items.length > 0 && (
            <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-black text-gold-foreground tabular-nums">
              {items.length}
            </span>
          )}
        </div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-gold-foreground transition-colors hover:bg-gold/10"
        >
          عرض الكل <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold/15 to-transparent ring-1 ring-gold/25">
            <Trophy className="h-6 w-6 text-gold-foreground" />
          </div>
          <p className="text-sm text-zinc-400">لا توجد منتجات بعد</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((p, idx) => (
            <li
              key={p.id}
              className="group flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-gold/5"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black",
                  idx < 3 ? PODIUM[idx] : "bg-muted text-muted-foreground",
                )}
              >
                {idx + 1}
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/25 text-gold-foreground transition-transform group-hover:scale-105">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.name_ar}</p>
                <p className="text-xs text-zinc-400 tabular-nums">{p.sales_count} عملية بيع</p>
              </div>
              <div className="text-left text-xs font-bold text-zinc-300 tabular-nums">
                {Number(p.base_price).toFixed(0)} ر.س
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
