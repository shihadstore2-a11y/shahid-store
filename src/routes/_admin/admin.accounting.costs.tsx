import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package, History, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { InlineEditField } from "@/components/admin/InlineEditField";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  costHistoryQueryOptions,
  productCostsWithProductsQueryOptions,
  setProductCost,
} from "@/lib/admin-accounting";
import type { ProductWithCost } from "@/types/accounting";
import { formatSAR } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/accounting/costs")({
  head: () => ({
    meta: [
      { title: "تكاليف المنتجات — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountingCostsPage,
});

function AccountingCostsPage() {
  // الوصول محكوم مركزياً بـ RequireAccess (الدور OR الصلاحيات الإضافية) + RLS كمرجع نهائي.
  return <CostsContent />;
}

const QUERY_KEY = ["admin", "accounting", "product-costs"];

function CostsContent() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(productCostsWithProductsQueryOptions());
  const [historySlug, setHistorySlug] = useState<string | null>(null);
  const [historyName, setHistoryName] = useState<string>("");

  const rows = data ?? [];

  const mutation = useMutation({
    mutationFn: (vars: { slug: string; newCost: number; note?: string | null }) =>
      setProductCost(vars.slug, vars.newCost, vars.note ?? undefined),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const snapshot = queryClient.getQueryData<ProductWithCost[]>(QUERY_KEY);
      if (snapshot) {
        const nowIso = new Date().toISOString();
        queryClient.setQueryData<ProductWithCost[]>(
          QUERY_KEY,
          snapshot.map((p) =>
            p.slug === vars.slug
              ? {
                  ...p,
                  current_cost: {
                    id: p.current_cost?.id ?? "optimistic",
                    unit_cost: vars.newCost,
                    effective_from: nowIso,
                    updated_at: nowIso,
                  },
                }
              : p,
          ),
        );
      }
      return { snapshot };
    },
    onError: (err: unknown, _vars, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(QUERY_KEY, ctx.snapshot);
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      toast.error("تعذّر حفظ التكلفة: " + msg);
    },
    onSuccess: (_data, vars) => {
      toast.success("تم حفظ التكلفة");
      queryClient.invalidateQueries({
        queryKey: ["admin", "accounting", "cost-history", vars.slug],
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const handleSave = async (slug: string, newValue: string | number | null) => {
    const num = Number(newValue);
    if (!Number.isFinite(num) || num < 0 || num > 99999) {
      toast.error("القيمة يجب أن تكون بين 0 و 99999");
      throw new Error("invalid");
    }
    await mutation.mutateAsync({ slug, newCost: num, note: null });
  };

  const openHistory = (slug: string, name: string) => {
    setHistorySlug(slug);
    setHistoryName(name);
  };

  const total = rows.length;
  const withCost = rows.filter((r) => (r.current_cost?.unit_cost ?? 0) > 0).length;
  const needingCost = total - withCost;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">إدارة تكاليف المنتجات (COGS)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أدخل تكلفة الشراء الفعلية لكل منتج لحساب هامش الربح بدقة.
        </p>
      </header>

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
          <StatItem label="إجمالي المنتجات" value={String(total)} />
          <StatItem
            label="منتجات بتكلفة محدّدة"
            value={String(withCost)}
            accent="text-success"
          />
          <StatItem
            label="منتجات تحتاج تكلفة"
            value={String(needingCost)}
            accent={needingCost > 0 ? "text-[var(--gold)]" : "text-success"}
          />
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل البيانات: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        <EmptyNoProducts />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>التكلفة الحالية</TableHead>
                  <TableHead>آخر تحديث</TableHead>
                  <TableHead className="w-[120px]">السجل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{p.name_ar}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSAR(p.sale_price ?? p.base_price)}
                    </TableCell>
                    <TableCell>
                      <InlineEditField
                        value={p.current_cost?.unit_cost ?? 0}
                        type="number"
                        suffix="SAR"
                        min={0}
                        ariaLabel={`تعديل تكلفة ${p.name_ar}`}
                        formatDisplay={(v) =>
                          v == null || v === "" ? "—" : `${Number(v).toFixed(2)} SAR`
                        }
                        onSave={(val) => handleSave(p.slug, val)}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.current_cost
                        ? formatDate(p.current_cost.updated_at)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openHistory(p.slug, p.name_ar)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-[var(--gold)] hover:bg-accent/15"
                      >
                        <History className="h-3.5 w-3.5" />
                        عرض
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-4 space-y-3"
              >
                <div className="font-black">{p.name_ar}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">السعر</span>
                  <span>{formatSAR(p.sale_price ?? p.base_price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">التكلفة</span>
                  <InlineEditField
                    value={p.current_cost?.unit_cost ?? 0}
                    type="number"
                    suffix="SAR"
                    min={0}
                    ariaLabel={`تعديل تكلفة ${p.name_ar}`}
                    formatDisplay={(v) =>
                      v == null || v === "" ? "—" : `${Number(v).toFixed(2)} SAR`
                    }
                    onSave={(val) => handleSave(p.slug, val)}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>آخر تحديث</span>
                  <span>
                    {p.current_cost ? formatDate(p.current_cost.updated_at) : "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openHistory(p.slug, p.name_ar)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-bold text-[var(--gold)] hover:bg-accent/10"
                >
                  <History className="h-4 w-4" />
                  عرض السجل
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <CostHistoryDialog
        slug={historySlug}
        productName={historyName}
        onClose={() => setHistorySlug(null)}
      />
    </div>
  );
}

function StatItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`mt-1 text-xl font-black ${accent ?? ""}`}>{value}</span>
    </div>
  );
}

function EmptyNoProducts() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-black">لا توجد منتجات نشطة</h3>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function CostHistoryDialog({
  slug,
  productName,
  onClose,
}: {
  slug: string | null;
  productName: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery(costHistoryQueryOptions(slug, 5));
  const rows = data ?? [];

  return (
    <Dialog open={!!slug} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>سجل تكاليف {productName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لا يوجد سجل تغييرات لهذا المنتج بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الملاحظة</TableHead>
                  <TableHead>بواسطة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">
                      {formatDate(r.effective_from)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {r.unit_cost.toFixed(2)} SAR
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.note ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.created_by ? "مشرف" : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
