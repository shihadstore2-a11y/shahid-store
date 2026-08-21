/*
 * RBAC Note (Senior 2026-05-27):
 * UI hides Create/Edit/Delete for staff/developer based on canManageInventory.
 * DB RLS (can_modify_data) currently allows developer/staff to bypass via direct API.
 * Post-launch: tighten RLS to (super_admin, admin) only.
 * Tracked in: docs/tech-debt/rls-inventory-tighten.md
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InventoryStatsStrip } from "@/components/admin/inventory/InventoryStatsStrip";
import { InventoryFiltersBar } from "@/components/admin/inventory/InventoryFiltersBar";
import { InventoryTable } from "@/components/admin/inventory/InventoryTable";
import { InventoryCard } from "@/components/admin/inventory/InventoryCard";
import {
  CreateInventoryButton,
  InventoryFormDialog,
} from "@/components/admin/inventory/InventoryFormDialog";
import { DeleteInventoryDialog } from "@/components/admin/inventory/DeleteInventoryDialog";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  adminInventoryQueryOptions,
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
  DEFAULT_INVENTORY_FILTERS,
  type InventoryFilters,
  type InventoryInput,
  type InventoryItem,
  type InventoryUpdate,
} from "@/lib/admin-inventory";

export const Route = createFileRoute("/_admin/admin/inventory")({
  head: () => ({
    meta: [
      { title: "المخزون — إدارة شاهد" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  // الوصول محكوم مركزياً بـ RequireAccess (الدور OR الصلاحيات الإضافية) + RLS كمرجع نهائي.
  return <InventoryContent />;
}

function InventoryContent() {
  const queryClient = useQueryClient();
  const { can } = useAdminUser();
  const canModify = can("canManageInventory");

  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_INVENTORY_FILTERS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [toDelete, setToDelete] = useState<InventoryItem | null>(null);

  const { data, isLoading, isFetching, error } = useQuery(
    adminInventoryQueryOptions(filters),
  );
  const rows = data?.rows ?? [];

  const formatErr = (err: unknown): string => {
    const e = err as { code?: string; message?: string };
    if (e?.code === "23505")
      return "هذا الاشتراك موجود مسبقاً (نفس المزوّد واسم المستخدم).";
    if (e?.message?.toLowerCase().includes("duplicate"))
      return "هذا الاشتراك موجود مسبقاً.";
    if (e?.code?.startsWith("PGRST"))
      return "خطأ في قاعدة البيانات: " + (e.message ?? "غير محدد");
    return e?.message ?? "خطأ غير معروف";
  };

  const createMutation = useMutation({
    mutationFn: (input: InventoryInput) => createInventoryItem(input),
    onSuccess: () => {
      toast.success("تمت إضافة الاشتراك للمخزون");
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
    onError: (err) => toast.error("تعذّر الإنشاء: " + formatErr(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: InventoryUpdate }) =>
      updateInventoryItem(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "inventory"] });
      const snapshot = queryClient.getQueriesData<{ rows: InventoryItem[] }>({
        queryKey: ["admin", "inventory"],
      });
      snapshot.forEach(([key, prev]) => {
        if (!prev) return;
        queryClient.setQueryData(key, {
          ...prev,
          rows: prev.rows.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        });
      });
      return { snapshot };
    },
    onError: (err, _v, ctx) => {
      ctx?.snapshot.forEach(([k, p]) => p && queryClient.setQueryData(k, p));
      toast.error("تعذّر التحديث: " + formatErr(err));
    },
    onSuccess: () => toast.success("تم التحديث"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InventoryItem["status"] }) =>
      deleteInventoryItem(id, status),
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
    onError: (err) => toast.error("تعذّر الحذف: " + formatErr(err)),
  });

  const handleCreate = async (
    input: InventoryInput,
    opts: { keepOpen: boolean },
  ) => {
    await createMutation.mutateAsync(input);
    if (!opts.keepOpen) setCreateOpen(false);
  };

  const handleEdit = async (input: InventoryInput) => {
    if (!editing) return;
    const updates: InventoryUpdate = {
      username: input.username,
      password: input.password,
      url: input.url,
      extra_info: input.extra_info,
      expires_at: input.expires_at,
      cogs: input.cogs,
      notes: input.notes,
    };
    await updateMutation.mutateAsync({ id: editing.id, updates });
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate({ id: toDelete.id, status: toDelete.status });
    setToDelete(null);
  };

  const hasActive =
    filters.search ||
    filters.provider !== "all" ||
    filters.status !== "all" ||
    filters.duration !== "all";

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">إدارة المخزون</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} اشتراك في المخزون.
          </p>
        </div>
        {canModify && <CreateInventoryButton onClick={() => setCreateOpen(true)} />}
      </header>

      {!isLoading && <InventoryStatsStrip rows={rows} />}

      <InventoryFiltersBar
        value={filters}
        onChange={setFilters}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] })
        }
        isRefreshing={isFetching}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل المخزون: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        hasActive ? (
          <EmptyFiltered onReset={() => setFilters(DEFAULT_INVENTORY_FILTERS)} />
        ) : (
          <EmptyNoInventory />
        )
      ) : (
        <>
          <div className="hidden md:block">
            <InventoryTable
              rows={rows}
              onEdit={setEditing}
              onDelete={setToDelete}
              canModify={canModify}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onEdit={setEditing}
                onDelete={setToDelete}
                canModify={canModify}
              />
            ))}
          </div>
        </>
      )}

      {canModify && (
        <>
          <InventoryFormDialog
            mode="create"
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={handleCreate}
          />
          <InventoryFormDialog
            mode="edit"
            open={!!editing}
            onOpenChange={(o) => !o && setEditing(null)}
            initial={editing}
            onSubmit={async (input) => handleEdit(input)}
          />
        </>
      )}

      <DeleteInventoryDialog
        item={toDelete}
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function EmptyNoInventory() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-black">لا يوجد مخزون بعد</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        أضف اشتراكاً جديداً من الزر بالأعلى لبدء التسليم التلقائي.
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
