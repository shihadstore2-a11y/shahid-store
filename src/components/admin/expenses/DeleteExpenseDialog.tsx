import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatSAR } from '@/lib/format';
import type { Expense } from '@/types/accounting';

export function DeleteExpenseDialog({
  expense,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف هذا المصروف؟</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء، وسيتأثر إجمالي
              مصاريف الشهر.
            </span>
            {expense && (
              <span className="mt-2 block rounded-lg border border-border bg-muted/40 p-3 text-xs">
                <span className="block font-bold text-foreground">
                  {formatSAR(expense.amount)} — {expense.description.slice(0, 80)}
                </span>
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'جاري الحذف…' : 'حذف نهائياً'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
