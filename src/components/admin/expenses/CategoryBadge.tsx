import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/types/accounting';
import { cn } from '@/lib/utils';

const TONE: Record<ExpenseCategory, string> = {
  marketing: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  tools: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  salaries: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  hosting: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  support: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  legal: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  other: 'bg-muted/40 text-muted-foreground border-border',
};

export function CategoryBadge({ category }: { category: ExpenseCategory }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold',
        TONE[category],
      )}
    >
      {EXPENSE_CATEGORIES[category]}
    </span>
  );
}
