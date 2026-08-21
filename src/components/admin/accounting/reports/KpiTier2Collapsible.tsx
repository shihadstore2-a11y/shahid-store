import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatNumber, formatSAR } from "@/lib/format";
import {
  formatPercent,
  getCurrentPeriodRange,
  kpiDashboardQueryOptions,
  type PeriodPreset,
} from "@/lib/admin-accounting-reports";

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-gold/40">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-lg font-black tabular-nums">{value}</p>
    </div>
  );
}

export function KpiTier2Collapsible({ period }: { period: PeriodPreset }) {
  const [open, setOpen] = useState(false);
  const { from, to } = getCurrentPeriodRange(period);
  const { data, isLoading } = useQuery(kpiDashboardQueryOptions(from, to));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between rounded-2xl border-border hover:border-gold/50"
        >
          <span className="font-bold">
            {open ? "إخفاء التفاصيل الإضافية" : "عرض تفاصيل إضافية"}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        {isLoading || !data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <MiniCard label="التكاليف (COGS)" value={formatSAR(data.tier2.cogs)} />
            <MiniCard label="رسوم الدفع" value={formatSAR(data.tier2.fees)} />
            <MiniCard label="المسترجعات" value={formatSAR(data.tier2.refunds)} />
            <MiniCard label="المصاريف" value={formatSAR(data.tier2.expenses)} />
            <MiniCard label="عدد العملاء" value={formatNumber(data.tier2.customers_count)} />
            <MiniCard label="متوسط قيمة الطلب" value={formatSAR(data.tier2.aov)} />
            <MiniCard label="هامش الربح الصافي" value={formatPercent(data.tier2.net_margin_pct)} />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
