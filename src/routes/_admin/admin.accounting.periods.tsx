import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subMonths, getYear, getMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  closeFinancialPeriod,
  financialPeriodsQueryOptions,
  monthlyFinancialsQueryOptions,
} from "@/lib/admin-accounting";
import type {
  FinancialPeriod,
  MonthlyFinancials,
  PeriodStatus,
} from "@/types/accounting";
import { formatNumber, formatSAR } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/accounting/periods")({
  head: () => ({
    meta: [
      { title: "الإقفال الشهري — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountingPeriodsPage,
});

function AccountingPeriodsPage() {
  // الوصول محكوم مركزياً بـ RequireAccess (الدور OR الصلاحيات الإضافية).
  // فعل الإقفال نفسه يبقى محصوراً بالمشرف العام عبر RLS (is_super_admin).
  return <PeriodsContent />;
}

function PeriodsContent() {
  const { data: periods, isLoading, error } = useQuery(
    financialPeriodsQueryOptions(),
  );

  const months = useMemo(() => {
    const result: { year: number; month: number; date: Date }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i);
      result.push({
        year: getYear(date),
        month: getMonth(date) + 1,
        date,
      });
    }
    return result;
  }, []);

  const periodsMap = useMemo(() => {
    const map = new Map<string, FinancialPeriod>();
    (periods ?? []).forEach((p) => {
      map.set(`${p.year}-${p.month}`, p);
    });
    return map;
  }, [periods]);

  const currentYM = useMemo(() => {
    const now = new Date();
    return { year: getYear(now), month: getMonth(now) + 1 };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-[var(--gold)]" />
          <h1 className="text-2xl font-black">الإقفال المالي الشهري</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          إقفال الفترات المالية وحفظ نسخ معتمدة من الأرقام لكل شهر.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل الفترات: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {months.map((m) => (
            <PeriodCard
              key={`${m.year}-${m.month}`}
              year={m.year}
              month={m.month}
              date={m.date}
              period={periodsMap.get(`${m.year}-${m.month}`) ?? null}
              isCurrent={m.year === currentYM.year && m.month === currentYM.month}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function statusLabel(s: PeriodStatus): string {
  if (s === "closed" || s === "locked") return "مقفلة";
  return "مفتوحة";
}

function statusVariant(s: PeriodStatus): "default" | "secondary" | "outline" {
  if (s === "closed" || s === "locked") return "default";
  return "outline";
}

function PeriodCard({
  year,
  month,
  date,
  period,
  isCurrent,
}: {
  year: number;
  month: number;
  date: Date;
  period: FinancialPeriod | null;
  isCurrent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const monthLabel = format(date, "MMMM yyyy", { locale: ar });
  const status: PeriodStatus = period?.status ?? "open";
  const isClosed = status === "closed" || status === "locked";
  const canClose = !isCurrent && !isClosed;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-base font-black">{monthLabel}</CardTitle>
        <Badge
          variant={statusVariant(status)}
          className={
            isClosed
              ? "bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/40"
              : ""
          }
        >
          {statusLabel(status)}
        </Badge>
      </CardHeader>
      <CardContent className="min-h-[60px] text-sm">
        {period?.snapshot ? (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الإيراد</span>
              <span className="font-bold">{formatSAR(period.snapshot.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">صافي الربح</span>
              <span className="font-bold">{formatSAR(period.snapshot.net_profit)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {isCurrent
              ? "الشهر الحالي قيد التشغيل."
              : "لم يتم إقفال هذا الشهر بعد."}
          </p>
        )}
      </CardContent>
      <CardFooter>
        {canClose && (
          <Button
            variant="destructive"
            onClick={() => setOpen(true)}
            className="min-h-[44px] w-full"
          >
            إقفال الشهر
          </Button>
        )}
        {!canClose && !isClosed && isCurrent && (
          <p className="text-xs text-muted-foreground">
            لا يمكن إقفال الشهر الحالي قبل اكتماله
          </p>
        )}
        {isClosed && (
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            className="min-h-[44px] w-full"
          >
            عرض الإقفال
          </Button>
        )}
      </CardFooter>

      {open && (
        <ClosePeriodDialog
          year={year}
          month={month}
          monthLabel={monthLabel}
          isClosed={isClosed}
          snapshot={period?.snapshot ?? null}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </Card>
  );
}

function ClosePeriodDialog({
  year,
  month,
  monthLabel,
  isClosed,
  snapshot,
  open,
  onOpenChange,
}: {
  year: number;
  month: number;
  monthLabel: string;
  isClosed: boolean;
  snapshot: MonthlyFinancials | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: liveData, isLoading } = useQuery({
    ...monthlyFinancialsQueryOptions(year, month),
    enabled: open && !isClosed,
  });

  const data: MonthlyFinancials | null = isClosed ? snapshot : liveData ?? null;

  const mutation = useMutation({
    mutationFn: () => closeFinancialPeriod(year, month),
    onSuccess: () => {
      toast.success(`تم إقفال شهر ${monthLabel}`);
      queryClient.invalidateQueries({
        queryKey: ["admin", "accounting", "financial-periods"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "accounting", "monthly-financials", year, month],
      });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "فشل إقفال الشهر";
      toast.error(msg);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={(v) => !mutation.isPending && onOpenChange(v)}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isClosed ? `عرض إقفال ${monthLabel}` : `إقفال ${monthLabel}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isClosed
              ? "نسخة معتمدة من الأرقام المحفوظة وقت الإقفال."
              : "ستُحفظ الأرقام التالية كنسخة معتمدة. إلغاء الإقفال لاحقاً يحتاج super_admin آخر."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-2 rounded-xl border border-border bg-background/40 p-4 text-sm">
            <FinancialRow label="الإيرادات" value={formatSAR(data.revenue)} />
            <FinancialRow
              label="عدد الطلبات"
              value={formatNumber(data.orders_count)}
            />
            <FinancialRow label="تكلفة البضاعة (COGS)" value={formatSAR(data.cogs)} />
            <FinancialRow
              label="الربح الإجمالي"
              value={formatSAR(data.gross_profit)}
              extra={`${formatNumber(data.gross_margin_pct)}%`}
              emphasis
            />
            <Separator className="my-2" />
            <FinancialRow label="المصاريف" value={formatSAR(data.expenses)} />
            <FinancialRow label="الاسترجاعات" value={formatSAR(data.refunds)} />
            <FinancialRow label="الرسوم" value={formatSAR(data.fees)} />
            <FinancialRow
              label="صافي الربح"
              value={formatSAR(data.net_profit)}
              extra={`${formatNumber(data.net_margin_pct)}%`}
              emphasis
            />
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا توجد بيانات لعرضها.
          </p>
        )}

        <AlertDialogFooter>
          {isClosed ? (
            <AlertDialogCancel>إغلاق</AlertDialogCancel>
          ) : (
            <>
              <AlertDialogCancel disabled={mutation.isPending}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
                disabled={mutation.isPending || isLoading || !data}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {mutation.isPending && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
                تأكيد الإقفال
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FinancialRow({
  label,
  value,
  extra,
  emphasis,
}: {
  label: string;
  value: string;
  extra?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={emphasis ? "font-bold" : "text-muted-foreground"}>
        {label}
      </span>
      <span
        className={
          emphasis
            ? "font-black text-[var(--gold)]"
            : "font-bold text-foreground"
        }
      >
        {value}
        {extra && (
          <span className="ml-2 text-xs text-muted-foreground">({extra})</span>
        )}
      </span>
    </div>
  );
}
