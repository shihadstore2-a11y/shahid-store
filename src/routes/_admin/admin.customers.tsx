import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, SearchX } from "lucide-react";
import { CustomerStatsStrip } from "@/components/admin/customers/CustomerStatsStrip";
import {
  CustomerFiltersBar,
  DEFAULT_CUSTOMER_FILTERS,
  type CustomerFiltersState,
} from "@/components/admin/customers/CustomerFiltersBar";
import { CustomersTable } from "@/components/admin/customers/CustomersTable";
import { CustomerCard } from "@/components/admin/customers/CustomerCard";
import { CustomerDetailSheet } from "@/components/admin/customers/CustomerDetailSheet";
import { Button } from "@/components/ui/button";
import {
  adminCustomersQueryOptions,
  type Customer,
} from "@/lib/admin-customers";

export const Route = createFileRoute("/_admin/admin/customers")({
  head: () => ({
    meta: [
      { title: "العملاء — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CustomerFiltersState>(DEFAULT_CUSTOMER_FILTERS);
  const [openPhone, setOpenPhone] = useState<string | null>(null);

  const { data, isLoading, isFetching, error } = useQuery(
    adminCustomersQueryOptions(filters),
  );

  const customers: Customer[] = data ?? [];
  const hasActive =
    filters.search || filters.period !== "all" || filters.sortBy !== "total_spent";

  const selected = openPhone
    ? customers.find((c) => c.customer_phone === openPhone) ?? null
    : null;

  const onRefresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">إدارة العملاء</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "…" : `${customers.length} عميل`}
          </p>
        </div>
      </div>

      <CustomerStatsStrip />

      <CustomerFiltersBar
        value={filters}
        onChange={setFilters}
        onRefresh={onRefresh}
        isRefreshing={isFetching}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل العملاء: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : customers.length === 0 ? (
        hasActive ? (
          <EmptyFiltered onReset={() => setFilters(DEFAULT_CUSTOMER_FILTERS)} />
        ) : (
          <EmptyNoCustomers />
        )
      ) : (
        <>
          <div className="hidden md:block">
            <CustomersTable rows={customers} onOpen={(p) => setOpenPhone(p)} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {customers.map((c) => (
              <CustomerCard
                key={c.customer_phone}
                customer={c}
                onOpen={(p) => setOpenPhone(p)}
              />
            ))}
          </div>
        </>
      )}

      <CustomerDetailSheet
        customer={selected}
        open={!!openPhone}
        onOpenChange={(o) => !o && setOpenPhone(null)}
      />
    </div>
  );
}

function EmptyNoCustomers() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-black">لا يوجد عملاء بعد</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        سيظهر العملاء هنا فور وصول طلب جديد
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
      <p className="mt-1 text-sm text-muted-foreground">جرّب تعديل البحث أو الفلاتر</p>
      <Button variant="outline" size="sm" onClick={onReset} className="mt-4">
        مسح الفلاتر
      </Button>
    </div>
  );
}
