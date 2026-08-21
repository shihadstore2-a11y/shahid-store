import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSAR } from '@/lib/format';
import type { Expense } from '@/types/accounting';
import { CategoryBadge } from './CategoryBadge';

export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  canModify = true,
}: {
  expense: Expense;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
  canModify?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(expense.expense_date), 'd MMMM yyyy', { locale: ar })}
          </div>
          <div className="mt-1 text-xl font-black">{formatSAR(expense.amount)}</div>
        </div>
        <CategoryBadge category={expense.category} />
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {expense.description}
      </p>

      {expense.receipt_url && (
        <a
          href={expense.receipt_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:opacity-80"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          عرض الإيصال
        </a>
      )}

      {canModify && (
        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            size="sm"
            variant="outline"
            className="min-h-[44px] gap-1"
            onClick={() => onEdit(expense)}
          >
            <Pencil className="h-4 w-4" />
            تعديل
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="min-h-[44px] gap-1 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(expense)}
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>
        </div>
      )}
    </div>
  );
}
