import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash2,
  Brush,
  Clock,
  Inbox,
  SearchX,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { AbandonedKpiCards } from "@/components/admin/abandoned/AbandonedKpiCards";
import { AbandonedFiltersBar } from "@/components/admin/abandoned/AbandonedFilters";
import { AbandonedTable } from "@/components/admin/abandoned/AbandonedTable";
import { AbandonedWhatsappModal } from "@/components/admin/abandoned/AbandonedWhatsappModal";
import {
  adminAbandonedOrdersListQueryOptions,
  deleteAbandonedOrder,
  deleteAbandonedOrdersBulk,
  cleanupAbandonedOrders,
  type AbandonedFilters,
  type AbandonedOrderRow,
} from "@/lib/admin-abandoned-orders";

export const Route = createFileRoute("/_admin/admin/abandoned-orders")({
  head: () => ({
    meta: [
      { title: "السلات المتروكة — إدارة شاهد" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AbandonedOrdersPage,
});

const DEFAULT_FILTERS: AbandonedFilters = {
  search: "",
  dateRange: "all",
  sortBy: "newest",
};

function AbandonedOrdersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AbandonedFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeWhatsappOrder, setActiveWhatsappOrder] =
    useState<AbandonedOrderRow | null>(null);

  const queryFilters = { ...filters, page, pageSize: 20 };
  const { data, isLoading, isFetching, error } = useQuery(
    adminAbandonedOrdersListQueryOptions(queryFilters),
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.dateRange && filters.dateRange !== "all") ||
    (filters.sortBy && filters.sortBy !== "newest");

  const handleFiltersChange = (next: AbandonedFilters) => {
    setFilters(next);
    setPage(1);
    setSelectedIds([]);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["admin", "abandoned-orders"],
    });
    queryClient.invalidateQueries({
      queryKey: ["admin", "abandoned-orders", "stats"],
    });
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedIds(rows.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Mutations
  const singleDeleteMutation = useMutation({
    mutationFn: (orderId: string) => deleteAbandonedOrder(orderId),
    onSuccess: () => {
      toast.success("تم حذف السلة المتروكة بنجاح 🗑️");
      setSelectedIds((prev) => prev.filter((id) => id !== singleDeleteId));
      handleRefresh();
    },
    onError: (err: Error) => {
      toast.error(`فشل الحذف: ${err.message}`);
    },
  });

  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  const handleDeleteOne = (order: AbandonedOrderRow) => {
    if (
      window.confirm(
        `هل أنت متأكد من حذف السلة #${order.order_number} الخاصة بـ (${order.customer_name}) نهائياً؟`,
      )
    ) {
      setSingleDeleteId(order.id);
      singleDeleteMutation.mutate(order.id);
    }
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteAbandonedOrdersBulk(ids),
    onSuccess: (count) => {
      toast.success(`تم حذف ${count} سلة متروكة بنجاح 🗑️`);
      setSelectedIds([]);
      handleRefresh();
    },
    onError: (err: Error) => {
      toast.error(`فشل الحذف الجماعي: ${err.message}`);
    },
  });

  const handleDeleteSelected = () => {
    if (!selectedIds.length) return;
    if (
      window.confirm(
        `هل أنت متأكد من حذف ${selectedIds.length} سلة متروكة محددة نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.`,
      )
    ) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const cleanupMutation = useMutation({
    mutationFn: (olderThanHours?: number) => cleanupAbandonedOrders(olderThanHours),
    onSuccess: (count) => {
      toast.success(`تم تنظيف ${count} سلة متروكة بنجاح 🧹`);
      setSelectedIds([]);
      handleRefresh();
    },
    onError: (err: Error) => {
      toast.error(`فشل التنظيف: ${err.message}`);
    },
  });

  const handleCleanupOld = (hours: number) => {
    const label = hours === 24 ? "24 ساعة" : `${hours} ساعة`;
    if (
      window.confirm(
        `هل أنت متأكد من حذف جميع السلات المتروكة الأقدم من ${label} دفعة واحدة؟`,
      )
    ) {
      cleanupMutation.mutate(hours);
    }
  };

  const handleCleanupAll = () => {
    if (
      window.confirm(
        "⚠️ تنبيه: هل أنت متأكد من رغبتك في حذف كافة السلات المتروكة في المتجر دفعة واحدة؟",
      )
    ) {
      cleanupMutation.mutate(undefined);
    }
  };

  const isMutating =
    singleDeleteMutation.isPending ||
    bulkDeleteMutation.isPending ||
    cleanupMutation.isPending;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <AbandonedKpiCards />

      {/* شريط الإجراءات السريعة والتنظيف الجماعي */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-black text-foreground">
              إدارة واستعادة السلات المتروكة
            </h3>
            <p className="text-xs text-muted-foreground">
              راسل العملاء الذين ترددوا أو واجهوا مشكلة أثناء الدفع، أو نظّف
              السلات القديمة للحفاظ على نظافة قاعدة البيانات.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isMutating}
              className="gap-1.5 font-bold shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف المحدد ({selectedIds.length})</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCleanupOld(24)}
            disabled={isMutating}
            className="gap-1.5 font-bold border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span>تنظيف الأقدم من 24 ساعة 🧹</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCleanupOld(48)}
            disabled={isMutating}
            className="gap-1.5 font-bold border-border hover:bg-secondary"
          >
            <Clock className="h-4 w-4" />
            <span>تنظيف الأقدم من 48 ساعة</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCleanupAll}
            disabled={isMutating || total === 0}
            className="gap-1.5 font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span>حذف الكل</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <AbandonedFiltersBar
        value={filters}
        onChange={handleFiltersChange}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
      />

      {/* Content */}
      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل السلات المتروكة: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyFiltered onReset={() => handleFiltersChange(DEFAULT_FILTERS)} />
        ) : (
          <EmptyNoAbandoned />
        )
      ) : (
        <>
          <AbandonedTable
            rows={rows}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onOpenWhatsapp={(order) => setActiveWhatsappOrder(order)}
            onDeleteOne={handleDeleteOne}
            isDeleting={isMutating}
          />

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => page > 1 && setPage(page - 1)}
                    className={
                      page === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages })
                  .slice(0, 5)
                  .map((_, i) => {
                    const p = i + 1;
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === page}
                          onClick={() => setPage(p)}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => page < totalPages && setPage(page + 1)}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* WhatsApp Modal */}
      <AbandonedWhatsappModal
        order={activeWhatsappOrder}
        open={Boolean(activeWhatsappOrder)}
        onOpenChange={(open) => !open && setActiveWhatsappOrder(null)}
      />
    </div>
  );
}

function EmptyNoAbandoned() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <Sparkles className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-black text-foreground">
        لا توجد سلات متروكة حالياً! 🎉
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        جميع العملاء الذين بدأوا الشراء أتموا دفع طلباتهم بنجاح أو تم تنظيف
        السلات السابقة.
      </p>
    </div>
  );
}

function EmptyFiltered({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-7 w-7" />
      </div>
      <h3 className="text-base font-black text-foreground">
        لا توجد نتائج مطابقة لبحثك
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        جرّب تغيير فلاتر البحث أو التاريخ.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="mt-4 gap-1"
      >
        إعادة ضبط الفلاتر
      </Button>
    </div>
  );
}
