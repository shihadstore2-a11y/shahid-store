import { useQuery } from "@tanstack/react-query";
import { Users, Wallet, Crown, UserPlus } from "lucide-react";
import { adminCustomersStatsQueryOptions } from "@/lib/admin-customers";
import { formatSAR } from "@/lib/format";
import { cn } from "@/lib/utils";

function Card({
  title,
  value,
  sub,
  Icon,
  iconBg,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
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
          {sub && <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function CustomerStatsStrip() {
  const { data, isLoading } = useQuery(adminCustomersStatsQueryOptions());
  const s = data;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        title="إجمالي العملاء"
        value={isLoading ? "…" : String(s?.totalCustomers ?? 0)}
        Icon={Users}
        iconBg="bg-primary"
      />
      <Card
        title="متوسط الإنفاق لكل عميل"
        value={isLoading ? "…" : formatSAR(s?.avgSpendPerCustomer ?? 0)}
        Icon={Wallet}
        iconBg="bg-success"
      />
      <Card
        title="أعلى عميل"
        value={isLoading ? "…" : formatSAR(s?.topCustomerSpent ?? 0)}
        sub={s?.topCustomerName ?? "—"}
        Icon={Crown}
        iconBg="bg-[var(--gold)]"
        accent
      />
      <Card
        title="عملاء جدد هذا الشهر"
        value={isLoading ? "…" : String(s?.newCustomersThisMonth ?? 0)}
        Icon={UserPlus}
        iconBg="bg-[oklch(0.55_0.18_295)]"
      />
    </div>
  );
}
