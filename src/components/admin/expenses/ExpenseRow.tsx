import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatSAR } from '@/lib/format';
import type { Expense } from '@/types/accounting';
import { CategoryBadge } from './CategoryBadge';

export function ExpenseRow({
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
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {format(new Date(expense.expense_date), 'd MMM yyyy', { locale: ar })}
      </TableCell>
      <TableCell>
        <CategoryBadge category={expense.category} />
      </TableCell>
      <TableCell className="whitespace-nowrap font-bold">
        {formatSAR(expense.amount)}
      </TableCell>
      <TableCell className="max-w-[360px]">
        <div className="flex items-center gap-2">
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {expense.description}
          </span>
          {expense.receipt_url && (
            <a
              href={expense.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-accent hover:opacity-80"
              aria-label="إيصال"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </TableCell>
      {canModify && (
        <TableCell className="w-[110px]">
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEdit(expense)}
              aria-label="تعديل"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(expense)}
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
