import { useQuery } from "@tanstack/react-query";
import { Award, DollarSign, Percent, ShoppingBag, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/admin/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatNumber, formatSAR } from "@/lib/format";
import {
  formatPercent,
  getCurrentPeriodRange,
  getPreviousPeriodRange,
  kpiDashboardQueryOptions,
  PERIOD_LABELS_AR,
  type PeriodPreset,
} from "@/lib/admin-accounting-reports";

export function KpiTier1Cards({ period }: { period: PeriodPreset }) {
  const current = getCurrentPeriodRange(period);
  const previous = getPreviousPeriodRange(period);

  const cur = useQuery(kpiDashboardQueryOptions(current.from, current.to));
  const prev = useQuery(kpiDashboardQueryOptions(previous.from, previous.to));

  if (cur.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (cur.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          تعذّر تحميل المؤشرات: {(cur.error as Error)?.message ?? "خطأ غير معروف"}
        </AlertDescription>
      </Alert>
    );
  }

  const c = cur.data!.tier1;
  const p = prev.data?.tier1 ?? {
    revenue: 0,
    orders_count: 0,
    gross_profit: 0,
    net_profit: 0,
    gross_margin_pct: 0,
  };
  const hint = `مقارنة مع ${PERIOD_LABELS_AR[period]} السابقة`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        title="الإيرادات"
        value={formatSAR(c.revenue)}
        hint={hint}
        current={c.revenue}
        previous={p.revenue}
        Icon={DollarSign}
        iconBg="bg-emerald-500/80"
      />
      <KpiCard
        title="الطلبات"
        value={formatNumber(c.orders_count)}
        hint={hint}
        current={c.orders_count}
        previous={p.orders_count}
        Icon={ShoppingBag}
        iconBg="bg-blue-500/80"
      />
      <KpiCard
        title="الربح الإجمالي"
        value={formatSAR(c.gross_profit)}
        hint={hint}
        current={c.gross_profit}
        previous={p.gross_profit}
        Icon={TrendingUp}
        iconBg="bg-amber-500/80"
      />
      <KpiCard
        title="صافي الربح"
        value={formatSAR(c.net_profit)}
        hint={hint}
        current={c.net_profit}
        previous={p.net_profit}
        Icon={Award}
        iconBg="bg-gold/80"
      />
      <KpiCard
        title="هامش الربح"
        value={formatPercent(c.gross_margin_pct)}
        hint={hint}
        current={c.gross_margin_pct}
        previous={p.gross_margin_pct}
        Icon={Percent}
        iconBg="bg-purple-500/80"
      />
    </div>
  );
}
