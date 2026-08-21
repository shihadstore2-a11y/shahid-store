import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Inbox, SearchX } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { OrdersKpiCards } from "@/components/admin/orders/OrdersKpiCards";
import { OrdersFilters, type FiltersState } from "@/components/admin/orders/OrdersFilters";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { OrderCard } from "@/components/admin/orders/OrderCard";
import { OrderDetailSheet } from "@/components/admin/orders/OrderDetailSheet";
import { adminOrdersListQueryOptions } from "@/lib/admin-orders";

export const Route = createFileRoute("/_admin/admin/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات — إدارة شاهد" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

const DEFAULT_FILTERS: FiltersState = {
  search: "",
  status: "all",
  dateRange: "all",
  sortBy: "newest",
};

function OrdersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const queryFilters = { ...filters, page, pageSize: 20 };
  const { data, isLoading, isFetching, error } = useQuery(
    adminOrdersListQueryOptions(queryFilters),
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.dateRange !== "all";

  const handleFiltersChange = (next: FiltersState) => {
    setFilters(next);
    setPage(1);
  };

  const handleOpen = (id: string) => setOpenId(id);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  return (
    <div className="space-y-6">
      <OrdersKpiCards />

      <OrdersFilters
        value={filters}
        onChange={handleFiltersChange}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل الطلبات: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyFiltered onReset={() => handleFiltersChange(DEFAULT_FILTERS)} />
        ) : (
          <EmptyNoOrders />
        )
      ) : (
        <>
          <div className="hidden md:block">
            <OrdersTable rows={rows} onOpen={handleOpen} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map((o) => (
              <OrderCard key={o.id} order={o} onOpen={handleOpen} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => page > 1 && setPage(page - 1)}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
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
                      page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <OrderDetailSheet
        orderId={openId}
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </div>
  );
}

function EmptyNoOrders() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-black">لا توجد طلبات بعد</h3>
      <p className="mt-1 text-sm text-muted-foreground">ستظهر الطلبات هنا فور وصولها</p>
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
