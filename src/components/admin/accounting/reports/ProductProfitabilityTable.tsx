import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, PackageX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatNumber, formatSAR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  formatPercent,
  getCurrentPeriodRange,
  productProfitabilityQueryOptions,
  type PeriodPreset,
} from "@/lib/admin-accounting-reports";
import type { ProductProfitabilityRow } from "@/types/accounting";

type SortKey = "units_sold" | "revenue" | "cogs" | "gross_profit" | "margin";
type SortDir = "asc" | "desc";

function marginOf(r: ProductProfitabilityRow): number {
  return r.revenue > 0 ? (r.gross_profit / r.revenue) * 100 : 0;
}

export function ProductProfitabilityTable({ period }: { period: PeriodPreset }) {
  const { from, to } = getCurrentPeriodRange(period);
  const { data, isLoading, isError, error } = useQuery(
    productProfitabilityQueryOptions(from, to),
  );

  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const rows = [...(data ?? [])];
    rows.sort((a, b) => {
      const av = sortKey === "margin" ? marginOf(a) : (a[sortKey] as number);
      const bv = sortKey === "margin" ? marginOf(b) : (b[sortKey] as number);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [data, sortKey, sortDir]);

  const top = sorted.slice(0, 10);
  const totalCount = data?.length ?? 0;

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-2xl" />;
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          تعذّر تحميل ربحية المنتجات: {(error as Error)?.message}
        </AlertDescription>
      </Alert>
    );
  }
  if (!top.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <PackageX className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-bold text-muted-foreground">
          لم تُسجَّل مبيعات بعد في هذه الفترة.
        </p>
      </div>
    );
  }

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h3 className="text-base font-black">ربحية المنتجات (أعلى 10)</h3>
        {totalCount > 10 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            عرض أعلى 10 من أصل {formatNumber(totalCount)} منتج
          </p>
        ) : null}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المنتج</TableHead>
              <SortableHead label="عدد المبيعات" sortKey="units_sold" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortableHead label="الإيرادات" sortKey="revenue" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortableHead label="التكاليف" sortKey="cogs" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortableHead label="الربح" sortKey="gross_profit" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortableHead label="الهامش %" sortKey="margin" current={sortKey} dir={sortDir} onClick={toggleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {top.map((r) => (
              <TableRow key={r.slug}>
                <TableCell className="font-bold">
                  <div>{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.slug}</div>
                </TableCell>
                <TableCell className="tabular-nums">{formatNumber(r.units_sold)}</TableCell>
                <TableCell className="tabular-nums">{formatSAR(r.revenue)}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{formatSAR(r.cogs)}</TableCell>
                <TableCell className={cn("tabular-nums font-bold", r.gross_profit >= 0 ? "text-emerald-500" : "text-destructive")}>{formatSAR(r.gross_profit)}</TableCell>
                <TableCell className="tabular-nums">{formatPercent(marginOf(r))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {top.map((r) => (
          <div key={r.slug} className="rounded-xl border border-border bg-card/60 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.slug}</p>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-black tabular-nums", marginOf(r) >= 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-destructive/15 text-destructive")}>
                {formatPercent(marginOf(r))}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Stat label="المبيعات" value={formatNumber(r.units_sold)} />
              <Stat label="الإيرادات" value={formatSAR(r.revenue)} />
              <Stat label="التكاليف" value={formatSAR(r.cogs)} />
              <Stat label="الربح" value={formatSAR(r.gross_profit)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const active = sortKey === current;
  return (
    <TableHead className="text-right">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 font-bold transition-colors hover:text-gold",
          active && "text-gold",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
