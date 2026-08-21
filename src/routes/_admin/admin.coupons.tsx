import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SearchX, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CouponFiltersBar } from "@/components/admin/coupons/CouponFiltersBar";
import { CouponStatsStrip } from "@/components/admin/coupons/CouponStatsStrip";
import { CouponsTable } from "@/components/admin/coupons/CouponsTable";
import { CouponCard } from "@/components/admin/coupons/CouponCard";
import { CreateCouponDialog } from "@/components/admin/coupons/CreateCouponDialog";
import { DeleteCouponDialog } from "@/components/admin/coupons/DeleteCouponDialog";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  adminCouponsQueryOptions,
  createCoupon,
  deleteCoupon,
  updateCoupon,
  type AdminCoupon,
  type CouponFilters,
  type CouponInput,
  type CouponUpdate,
} from "@/lib/admin-coupons";

export const Route = createFileRoute("/_admin/admin/coupons")({
  head: () => ({
    meta: [
      { title: "الكوبونات — إدارة شاهد" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CouponsAdminPage,
});

const DEFAULT_FILTERS: CouponFilters = { search: "", status: "all" };

function CouponsAdminPage() {
  const queryClient = useQueryClient();
  const { can } = useAdminUser();
  const canModify = can("canModifyCoupons");
  const [filters, setFilters] = useState<CouponFilters>(DEFAULT_FILTERS);
  const [toDelete, setToDelete] = useState<AdminCoupon | null>(null);

  const { data, isLoading, isFetching, error } = useQuery(
    adminCouponsQueryOptions(filters),
  );
  const rows = data?.rows ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CouponUpdate }) =>
      updateCoupon(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "coupons"] });
      const snapshot = queryClient.getQueriesData<{ rows: AdminCoupon[] }>({
        queryKey: ["admin", "coupons"],
      });
      snapshot.forEach(([key, prev]) => {
        if (!prev) return;
        queryClient.setQueryData(key, {
          ...prev,
          rows: prev.rows.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        });
      });
      return { snapshot };
    },
    onError: (err: any, _v, ctx) => {
      ctx?.snapshot.forEach(([k, p]) => p && queryClient.setQueryData(k, p));
      toast.error("تعذّر التحديث: " + (err?.message ?? "خطأ غير معروف"));
    },
    onSuccess: () => toast.success("تم التحديث"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: CouponInput) => createCoupon(input),
    onSuccess: () => {
      toast.success("تم إنشاء الكوبون");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (err: any) =>
      toast.error("تعذّر الإنشاء: " + (err?.message ?? "خطأ غير معروف")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (err: any) =>
      toast.error("تعذّر الحذف: " + (err?.message ?? "خطأ غير معروف")),
  });

  const handleUpdate = async (id: string, updates: CouponUpdate) => {
    await updateMutation.mutateAsync({ id, updates });
  };
  const handleCreate = async (input: CouponInput) => {
    await createMutation.mutateAsync(input);
  };
  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id);
    setToDelete(null);
  };

  const hasActiveFilters = filters.search || filters.status !== "all";

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">إدارة الكوبونات</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} كوبون — اضغط على أي قيمة للتعديل المباشر.
          </p>
        </div>
        {canModify && <CreateCouponDialog onCreate={handleCreate} />}
      </header>

      {!isLoading && <CouponStatsStrip rows={rows} />}

      <CouponFiltersBar
        value={filters}
        onChange={setFilters}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] })
        }
        isRefreshing={isFetching}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل الكوبونات: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyFiltered onReset={() => setFilters(DEFAULT_FILTERS)} />
        ) : (
          <EmptyNoCoupons />
        )
      ) : (
        <>
          <div className="hidden md:block">
            <CouponsTable
              rows={rows}
              onUpdate={handleUpdate}
              onDelete={setToDelete}
              canModify={canModify}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map((c) => (
              <CouponCard
                key={c.id}
                coupon={c}
                onUpdate={handleUpdate}
                onDelete={setToDelete}
                canModify={canModify}
              />
            ))}
          </div>
        </>
      )}

      <DeleteCouponDialog
        coupon={toDelete}
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function EmptyNoCoupons() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Tag className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-black">لا توجد كوبونات</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        أنشئ كوبون جديد من الزر بالأعلى.
      </p>
    </div>
  );
}

function EmptyFiltered({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-black">لا توجد نتائج مطابقة</h3>
      <p className="mt-1 text-sm text-muted-foreground">جرّب تعديل الفلاتر أو مسحها</p>
      <Button variant="outline" size="sm" onClick={onReset} className="mt-4">
        مسح الفلاتر
      </Button>
    </div>
  );
}
