import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, DollarSign, Calendar, MessageCircle } from "lucide-react";
import { adminAbandonedStatsQueryOptions } from "@/lib/admin-abandoned-orders";
import { formatSAR } from "@/lib/format";
import { cn } from "@/lib/utils";

function Card({
  title,
  value,
  subtitle,
  Icon,
  iconBg,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm transition-all",
        accent ? "border-amber-500/40 bg-amber-500/5" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground">{title}</p>
          <p className="mt-2 truncate text-2xl font-black tracking-tight lg:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconBg,
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function AbandonedKpiCards() {
  const { data: s, isLoading } = useQuery(adminAbandonedStatsQueryOptions());

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        title="إجمالي السلات المتروكة"
        value={isLoading ? "…" : String(s?.totalCount ?? 0)}
        subtitle="محاولات دفع لم تكتمل"
        Icon={ShoppingCart}
        iconBg="bg-amber-500"
        accent
      />
      <Card
        title="القيمة المحتملة الضائعة"
        value={isLoading ? "…" : formatSAR(s?.totalValue ?? 0)}
        subtitle="مبالغ قابلة للاسترداد"
        Icon={DollarSign}
        iconBg="bg-rose-500"
      />
      <Card
        title="سلات اليوم"
        value={isLoading ? "…" : String(s?.todayCount ?? 0)}
        subtitle="متروكة خلال آخر 24 ساعة"
        Icon={Calendar}
        iconBg="bg-blue-500"
      />
      <Card
        title="تم التواصل معهم"
        value={isLoading ? "…" : `${s?.contactedCount ?? 0} عملاء`}
        subtitle="عبر رسائل واتساب"
        Icon={MessageCircle}
        iconBg="bg-emerald-600"
      />
    </div>
  );
}
