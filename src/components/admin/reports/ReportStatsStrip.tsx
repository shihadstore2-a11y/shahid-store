import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  type LucideIcon,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { formatSAR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  reportStatsQueryOptions,
  type ReportFilters,
} from "@/lib/admin-reports";

export function ReportStatsStrip({ filters }: { filters: ReportFilters }) {
  const { data, isLoading } = useQuery(reportStatsQueryOptions(filters));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const s = data ?? {
    total_revenue: 0,
    order_count: 0,
    avg_order_value: 0,
    completed_orders: 0,
    revenue_trend: null,
    orders_trend: null,
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="إجمالي الإيرادات"
        value={formatSAR(s.total_revenue)}
        trend={s.revenue_trend}
        Icon={Coins}
      />
      <StatCard
        title="عدد الطلبات"
        value={String(s.order_count)}
        trend={s.orders_trend}
        Icon={Receipt}
      />
      <StatCard
        title="متوسط قيمة الطلب"
        value={formatSAR(s.avg_order_value)}
        trend={null}
        Icon={TrendingUp}
      />
      <StatCard
        title="الطلبات المُسلَّمة"
        value={String(s.completed_orders)}
        trend={null}
        Icon={CheckCircle2}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  Icon,
}: {
  title: string;
  value: string;
  trend: number | null;
  Icon: LucideIcon;
}) {
  const up = trend !== null && trend >= 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {trend === null ? (
          <span className="font-bold text-muted-foreground">— لا مقارنة</span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold",
              up
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
        <span className="text-muted-foreground">مقارنة بالفترة السابقة</span>
      </div>
    </div>
  );
}
