import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, DollarSign, Gift, Clock } from "lucide-react";
import { adminOrdersStatsQueryOptions } from "@/lib/admin-orders";
import { formatSAR } from "@/lib/format";
import { cn } from "@/lib/utils";

function Card({
  title,
  value,
  Icon,
  iconBg,
  accent,
}: {
  title: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm",
        accent ? "border-[var(--gold)]/40" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground">{title}</p>
          <p className="mt-2 truncate text-2xl font-black tracking-tight lg:text-3xl">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function OrdersKpiCards() {
  const { data, isLoading } = useQuery(adminOrdersStatsQueryOptions());
  const s = data;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        title="طلبات هذا الشهر"
        value={isLoading ? "…" : String(s?.totalOrdersMonth ?? 0)}
        Icon={ShoppingBag}
        iconBg="bg-primary"
      />
      <Card
        title="إيرادات هذا الشهر"
        value={isLoading ? "…" : formatSAR(s?.totalRevenueMonth ?? 0)}
        Icon={DollarSign}
        iconBg="bg-success"
      />
      <Card
        title="بانتظار التسليم"
        value={isLoading ? "…" : String(s?.paidUnfulfilledCount ?? 0)}
        Icon={Clock}
        iconBg="bg-orange-500"
        accent
      />
      <Card
        title="طلبات مُسلَّمة"
        value={isLoading ? "…" : String(s?.fulfilledCount ?? 0)}
        Icon={Gift}
        iconBg="bg-success"
      />
    </div>
  );
}
