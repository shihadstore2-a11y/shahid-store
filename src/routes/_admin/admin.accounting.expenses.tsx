import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

import { ExpensesStatsStrip } from '@/components/admin/expenses/ExpensesStatsStrip';
import {
  ExpensesFiltersBar,
  defaultExpenseFilters,
} from '@/components/admin/expenses/ExpensesFiltersBar';
import { ExpensesTable } from '@/components/admin/expenses/ExpensesTable';
import { ExpenseCard } from '@/components/admin/expenses/ExpenseCard';
import { ExpenseFormDialog } from '@/components/admin/expenses/ExpenseFormDialog';
import { DeleteExpenseDialog } from '@/components/admin/expenses/DeleteExpenseDialog';
import {
  createExpense,
  deleteExpense,
  expensesQueryOptions,
  updateExpense,
} from '@/lib/admin-accounting';
import type {
  Expense,
  ExpenseCreate,
  ExpenseFilters,
} from '@/types/accounting';

export const Route = createFileRoute('/_admin/admin/accounting/expenses')({
  head: () => ({
    meta: [
      { title: 'المصاريف التشغيلية — إدارة شاهد' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AccountingExpensesPage,
});

function AccountingExpensesPage() {
  // الوصول محكوم مركزياً بـ RequireAccess (الدور OR الصلاحيات الإضافية) + RLS كمرجع نهائي.
  return <ExpensesPageInner />;
}

function ExpensesPageInner() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ExpenseFilters>(defaultExpenseFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const { data: rows = [], isLoading, error } = useQuery(expensesQueryOptions(filters));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'accounting', 'expenses'] });

  const upsertMutation = useMutation({
    mutationFn: async ({ input, id }: { input: ExpenseCreate; id?: string }) => {
      if (id) return updateExpense(id, input);
      return createExpense(input);
    },
    onMutate: async ({ input, id }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'accounting', 'expenses'] });
      const snapshots = queryClient.getQueriesData<Expense[]>({
        queryKey: ['admin', 'accounting', 'expenses'],
      });
      snapshots.forEach(([key, prev]) => {
        if (!prev) return;
        if (id) {
          queryClient.setQueryData<Expense[]>(
            key,
            prev.map((e) => (e.id === id ? { ...e, ...input } : e)),
          );
        } else {
          const optimistic: Expense = {
            id: `optimistic-${Date.now()}`,
            category: input.category,
            description: input.description,
            amount: input.amount,
            currency: 'SAR',
            expense_date: input.expense_date,
            receipt_url: input.receipt_url ?? null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          queryClient.setQueryData<Expense[]>(key, [optimistic, ...prev]);
        }
      });
      return { snapshots };
    },
    onError: (err: unknown, _v, ctx) => {
      ctx?.snapshots.forEach(([k, p]) => p && queryClient.setQueryData(k, p));
      const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
      toast.error('تعذّر الحفظ: ' + msg);
    },
    onSuccess: (_d, v) => {
      toast.success(v.id ? 'تم تحديث المصروف' : 'تم إضافة المصروف');
    },
    onSettled: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'accounting', 'expenses'] });
      const snapshots = queryClient.getQueriesData<Expense[]>({
        queryKey: ['admin', 'accounting', 'expenses'],
      });
      snapshots.forEach(([key, prev]) => {
        if (!prev) return;
        queryClient.setQueryData<Expense[]>(
          key,
          prev.filter((e) => e.id !== id),
        );
      });
      return { snapshots };
    },
    onError: (err: unknown, _v, ctx) => {
      ctx?.snapshots.forEach(([k, p]) => p && queryClient.setQueryData(k, p));
      const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
      toast.error('تعذّر الحذف: ' + msg);
    },
    onSuccess: () => toast.success('تم حذف المصروف'),
    onSettled: () => invalidate(),
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setFormOpen(true);
  };
  const handleSubmit = async (input: ExpenseCreate, id?: string) => {
    await upsertMutation.mutateAsync({ input, id });
  };
  const confirmDelete = () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">إدارة المصاريف</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تسجيل ومتابعة المصاريف التشغيلية للمتجر — تُحتسب تلقائياً في صافي الربح.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مصروف
        </Button>
      </header>

      <ExpensesStatsStrip rows={rows} />

      <ExpensesFiltersBar value={filters} onChange={setFilters} />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل المصاريف: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <>
          <div className="hidden md:block">
            <ExpensesTable rows={rows} onEdit={openEdit} onDelete={setToDelete} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map((e) => (
              <ExpenseCard key={e.id} expense={e} onEdit={openEdit} onDelete={setToDelete} />
            ))}
          </div>
        </>
      )}

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editing}
        onSubmit={handleSubmit}
      />

      <DeleteExpenseDialog
        expense={toDelete}
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Receipt className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-black">لا توجد مصاريف مسجّلة</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        ابدأ بإضافة أوّل مصروف ليُحتسب ضمن صافي ربح المتجر.
      </p>
      <Button onClick={onAdd} className="mt-4 gap-2">
        <Plus className="h-4 w-4" />
        إضافة مصروف
      </Button>
    </div>
  );
}
