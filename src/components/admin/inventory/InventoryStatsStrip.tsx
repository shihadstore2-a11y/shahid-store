import { Package, CheckCircle2, AlertTriangle } from "lucide-react";
import { computeInventoryStats, type InventoryItem } from "@/lib/admin-inventory";

export function InventoryStatsStrip({ rows }: { rows: InventoryItem[] }) {
  const s = computeInventoryStats(rows);
  const items = [
    { label: "إجمالي المخزون", value: s.total, Icon: Package, tone: "text-foreground" },
    { label: "فالكون متاح", value: s.available_falcon, Icon: CheckCircle2, tone: s.available_falcon < 5 ? "text-amber-600" : "text-emerald-600" },
    { label: "هولك متاح", value: s.available_hulk, Icon: CheckCircle2, tone: s.available_hulk < 5 ? "text-amber-600" : "text-emerald-600" },
    { label: "سمارترز متاح", value: s.available_smarters, Icon: CheckCircle2, tone: s.available_smarters < 5 ? "text-amber-600" : "text-emerald-600" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(({ label, value, Icon, tone }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Icon className={`h-5 w-5 ${tone}`} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-xl font-black">{value}</div>
            </div>
          </div>
        ))}
      </div>
      {s.low_stock_alert && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          تنبيه: مخزون أحد المزوّدين أقل من 5 — يُستحسن إضافة المزيد.
        </div>
      )}
    </div>
  );
}
