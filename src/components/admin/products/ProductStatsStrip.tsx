import type { AdminProductRow } from "@/lib/admin-products";
import { formatSAR } from "@/lib/format";

export function ProductStatsStrip({ rows }: { rows: AdminProductRow[] }) {
  const total = rows.length;
  const active = rows.filter((r) => r.is_active).length;
  const inactive = total - active;
  const bestsellers = rows.filter((r) => r.is_bestseller).length;
  const inventoryValue = rows.reduce((acc, r) => acc + (r.sale_price ?? r.base_price), 0);

  const items = [
    { label: "إجمالي", value: `${total} منتج` },
    { label: "نشط", value: String(active), accent: "text-success" },
    { label: "معطّل", value: String(inactive), accent: "text-destructive" },
    { label: "الأكثر طلباً", value: String(bestsellers), accent: "text-[var(--gold)]" },
    { label: "قيمة الكتالوج", value: formatSAR(inventoryValue) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col">
          <span className="text-xs text-muted-foreground">{it.label}</span>
          <span className={`mt-1 text-base font-black ${it.accent ?? ""}`}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}
