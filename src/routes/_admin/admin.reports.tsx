import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/admin/reports/DateRangePicker";
import { ReportStatsStrip } from "@/components/admin/reports/ReportStatsStrip";
import { RevenueChart } from "@/components/admin/reports/RevenueChart";
import { TopProductsTable } from "@/components/admin/reports/TopProductsTable";
import { StatusDistributionChart } from "@/components/admin/reports/StatusDistributionChart";
import { ExportSection } from "@/components/admin/reports/ExportSection";
import {
  DEFAULT_REPORT_FILTERS,
  rangeLabel,
  type ReportFilters,
} from "@/lib/admin-reports";

export const Route = createFileRoute("/_admin/admin/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">التقارير والتحليلات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            خلاصة الأداء التجاري — {rangeLabel(filters)}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          aria-label="تحديث"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <DateRangePicker value={filters} onChange={setFilters} />

      <ReportStatsStrip filters={filters} />

      <RevenueChart filters={filters} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsTable filters={filters} />
        <StatusDistributionChart filters={filters} />
      </div>

      <ExportSection filters={filters} />
    </div>
  );
}
