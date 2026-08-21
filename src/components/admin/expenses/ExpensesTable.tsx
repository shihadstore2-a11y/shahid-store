import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Expense } from '@/types/accounting';
import { ExpenseRow } from './ExpenseRow';

export function ExpensesTable({
  rows,
  onEdit,
  onDelete,
  canModify = true,
}: {
  rows: Expense[];
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
  canModify?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التاريخ</TableHead>
            <TableHead>الفئة</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead>الوصف</TableHead>
            {canModify && <TableHead className="text-end">الإجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              onEdit={onEdit}
              onDelete={onDelete}
              canModify={canModify}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
