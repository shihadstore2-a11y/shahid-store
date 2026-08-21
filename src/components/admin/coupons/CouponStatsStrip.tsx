import { Tag, CheckCircle2, Clock, BanIcon } from "lucide-react";
import { computeCouponStats, type AdminCoupon } from "@/lib/admin-coupons";

export function CouponStatsStrip({ rows }: { rows: AdminCoupon[] }) {
  const s = computeCouponStats(rows);
  const items = [
    { label: "إجمالي الكوبونات", value: s.total, Icon: Tag, tone: "text-foreground" },
    { label: "نشط", value: s.active, Icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "منتهي الصلاحية", value: s.expired, Icon: Clock, tone: "text-amber-600" },
    { label: "معطّل", value: s.disabled, Icon: BanIcon, tone: "text-muted-foreground" },
  ];
  return (
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
  );
}
