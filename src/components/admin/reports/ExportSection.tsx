import { useState } from "react";
import { Download, FileSpreadsheet, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportDailyRevenueCSV,
  exportOrdersCSV,
  exportTopProductsCSV,
  type ReportFilters,
} from "@/lib/admin-reports";

type Kind = "orders" | "top" | "revenue";

export function ExportSection({ filters }: { filters: ReportFilters }) {
  const [busy, setBusy] = useState<Kind | null>(null);

  const run = async (kind: Kind, fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-black">تصدير البيانات</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        ملفات CSV جاهزة للمحاسبة والتحليل الخارجي (مع دعم اللغة العربية في Excel)
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto justify-start gap-3 rounded-xl border-accent/40 p-4 hover:bg-accent/10"
          disabled={busy !== null}
          onClick={() => run("orders", () => exportOrdersCSV(filters))}
        >
          <Download className="h-5 w-5 shrink-0 text-accent" />
          <div className="text-right">
            <div className="font-black">الطلبات</div>
            <div className="text-[11px] font-normal text-muted-foreground">
              كل تفاصيل الطلبات في الفترة
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto justify-start gap-3 rounded-xl border-accent/40 p-4 hover:bg-accent/10"
          disabled={busy !== null}
          onClick={() => run("top", () => exportTopProductsCSV(filters))}
        >
          <Package className="h-5 w-5 shrink-0 text-accent" />
          <div className="text-right">
            <div className="font-black">المنتجات الأكثر مبيعاً</div>
            <div className="text-[11px] font-normal text-muted-foreground">
              ترتيب المنتجات حسب الإيرادات
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto justify-start gap-3 rounded-xl border-accent/40 p-4 hover:bg-accent/10"
          disabled={busy !== null}
          onClick={() => run("revenue", () => exportDailyRevenueCSV(filters))}
        >
          <TrendingUp className="h-5 w-5 shrink-0 text-accent" />
          <div className="text-right">
            <div className="font-black">الإيرادات اليومية</div>
            <div className="text-[11px] font-normal text-muted-foreground">
              ملخص يوم بيوم للفترة
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
