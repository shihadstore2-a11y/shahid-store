import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSAR } from "@/lib/format";
import {
  topProductsQueryOptions,
  type ReportFilters,
} from "@/lib/admin-reports";

export function TopProductsTable({ filters }: { filters: ReportFilters }) {
  const { data, isLoading } = useQuery(topProductsQueryOptions(filters));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-1">
        <h3 className="text-lg font-black">الأكثر مبيعاً</h3>
        <p className="text-xs text-muted-foreground">أعلى 5 منتجات في الفترة</p>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-right">#</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">الإيرادات</TableHead>
                  <TableHead className="text-right">الحصة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p, i) => (
                  <TableRow key={p.product_slug}>
                    <TableCell className="font-black text-accent">{i + 1}</TableCell>
                    <TableCell>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.product_slug}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{p.quantity}</TableCell>
                    <TableCell className="font-bold">{formatSAR(p.revenue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${Math.min(100, p.share_percent)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">
                          {p.share_percent.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-bold text-muted-foreground">
        لا توجد مبيعات في هذه الفترة
      </p>
    </div>
  );
}
