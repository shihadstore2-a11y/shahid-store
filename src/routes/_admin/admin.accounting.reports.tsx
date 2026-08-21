import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import { AccountingPeriodSelector } from "@/components/admin/accounting/reports/AccountingPeriodSelector";
import { KpiTier1Cards } from "@/components/admin/accounting/reports/KpiTier1Cards";
import { KpiTier2Collapsible } from "@/components/admin/accounting/reports/KpiTier2Collapsible";
import { RevenueProfitChart } from "@/components/admin/accounting/reports/RevenueProfitChart";
import { ProductProfitabilityTable } from "@/components/admin/accounting/reports/ProductProfitabilityTable";
import { AccountingExportButton } from "@/components/admin/accounting/reports/AccountingExportButton";
import type { PeriodPreset } from "@/lib/admin-accounting-reports";

export const Route = createFileRoute("/_admin/admin/accounting/reports")({
  head: () => ({
    meta: [
      { title: "التقارير المالية — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountingReportsPage,
});

function AccountingReportsPage() {
  // الوصول محكوم مركزياً بـ RequireAccess (الدور OR الصلاحيات الإضافية) + RLS كمرجع نهائي.
  return <ReportsContent />;
}

function ReportsContent() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodPreset>("last30days");

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "accounting"] });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gold/15 p-2">
              <TrendingUp className="h-5 w-5 text-gold" />
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">التقارير المالية و KPIs</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            الأداء المالي والربحية — اختر فترة زمنية لعرض المؤشرات
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AccountingExportButton period={period} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refresh}
            className="gap-2 rounded-full font-bold"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <AccountingPeriodSelector value={period} onChange={setPeriod} />

      {/* KPI Tier 1 */}
      <KpiTier1Cards period={period} />

      {/* KPI Tier 2 */}
      <KpiTier2Collapsible period={period} />

      {/* Chart */}
      <RevenueProfitChart />

      {/* Product profitability */}
      <ProductProfitabilityTable period={period} />
    </div>
  );
}
