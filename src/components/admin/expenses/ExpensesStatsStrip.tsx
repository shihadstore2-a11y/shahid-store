import { Receipt, Hash, TrendingUp, Sigma } from 'lucide-react';
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from '@/types/accounting';
import { formatSAR } from '@/lib/format';

function computeStats(rows: Expense[]) {
  let total = 0;
  const byCat: Partial<Record<ExpenseCategory, number>> = {};
  for (const r of rows) {
    total += r.amount;
    byCat[r.category] = (byCat[r.category] ?? 0) + r.amount;
  }
  let topKey: ExpenseCategory | null = null;
  let topAmount = 0;
  for (const [k, v] of Object.entries(byCat)) {
    if ((v ?? 0) > topAmount) {
      topAmount = v ?? 0;
      topKey = k as ExpenseCategory;
    }
  }
  const avg = rows.length > 0 ? total / rows.length : 0;
  return { total, count: rows.length, topKey, topAmount, avg };
}

export function ExpensesStatsStrip({ rows }: { rows: Expense[] }) {
  const s = computeStats(rows);
  const items = [
    {
      label: 'إجمالي المصاريف',
      value: formatSAR(s.total),
      Icon: Receipt,
      tone: 'text-accent',
    },
    {
      label: 'عدد المعاملات',
      value: String(s.count),
      Icon: Hash,
      tone: 'text-foreground',
    },
    {
      label: 'أعلى فئة',
      value: s.topKey ? `${EXPENSE_CATEGORIES[s.topKey]} • ${formatSAR(s.topAmount)}` : '—',
      Icon: TrendingUp,
      tone: 'text-emerald-400',
    },
    {
      label: 'متوسط المصروف',
      value: formatSAR(s.avg),
      Icon: Sigma,
      tone: 'text-sky-400',
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(({ label, value, Icon, tone }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Icon className={`h-5 w-5 ${tone}`} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs text-muted-foreground">{label}</div>
            <div className="truncate text-base font-black md:text-lg">{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
