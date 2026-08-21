import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  csvFromKpiDashboard,
  csvFromProductProfitability,
  downloadCSV,
  getCurrentPeriodRange,
  kpiDashboardQueryOptions,
  PERIOD_LABELS_AR,
  productProfitabilityQueryOptions,
  type PeriodPreset,
} from "@/lib/admin-accounting-reports";

export function AccountingExportButton({ period }: { period: PeriodPreset }) {
  const { from, to } = getCurrentPeriodRange(period);
  const kpi = useQuery(kpiDashboardQueryOptions(from, to));
  const profit = useQuery(productProfitabilityQueryOptions(from, to));

  const disabled = kpi.isLoading || profit.isLoading;

  const handleExport = () => {
    if (!kpi.data) {
      toast.error("البيانات غير جاهزة بعد");
      return;
    }
    const periodLabel = PERIOD_LABELS_AR[period];
    const kpiCsv = csvFromKpiDashboard(kpi.data, periodLabel);
    const profitCsv = csvFromProductProfitability(profit.data ?? []);
    const combined = `${kpiCsv}\n\n\n${profitCsv}\n`;
    const ts = new Date().toISOString().slice(0, 10);
    downloadCSV(combined, `shahid-financial-${period}-${ts}.csv`);
    toast.success("تم تصدير التقرير");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={handleExport}
      className="gap-2 rounded-full border-gold/50 font-bold text-gold hover:bg-gold/10 hover:text-gold"
    >
      <Download className="h-4 w-4" />
      تصدير CSV
    </Button>
  );
}
