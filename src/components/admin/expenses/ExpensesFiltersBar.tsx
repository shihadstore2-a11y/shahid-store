import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_KEYS,
  type ExpenseCategory,
  type ExpenseFilters,
} from '@/types/accounting';

const fmtDate = (d: Date) => format(d, 'yyyy-MM-dd');

export function defaultExpenseFilters(): ExpenseFilters {
  const now = new Date();
  return {
    dateFrom: fmtDate(startOfMonth(now)),
    dateTo: fmtDate(endOfMonth(now)),
    category: 'all',
  };
}

type Preset = 'this-month' | '3-months' | 'custom';

function detectPreset(f: ExpenseFilters): Preset {
  const now = new Date();
  const thisFrom = fmtDate(startOfMonth(now));
  const thisTo = fmtDate(endOfMonth(now));
  if (f.dateFrom === thisFrom && f.dateTo === thisTo) return 'this-month';
  const threeFrom = fmtDate(startOfMonth(subMonths(now, 2)));
  if (f.dateFrom === threeFrom && f.dateTo === thisTo) return '3-months';
  return 'custom';
}

export function ExpensesFiltersBar({
  value,
  onChange,
}: {
  value: ExpenseFilters;
  onChange: (next: ExpenseFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const preset = detectPreset(value);
  const [draft, setDraft] = useState<DateRange | undefined>(
    value.dateFrom && value.dateTo
      ? { from: new Date(value.dateFrom), to: new Date(value.dateTo) }
      : undefined,
  );

  const setPreset = (p: Preset) => {
    const now = new Date();
    if (p === 'this-month') {
      onChange({ ...value, dateFrom: fmtDate(startOfMonth(now)), dateTo: fmtDate(endOfMonth(now)) });
    } else if (p === '3-months') {
      onChange({
        ...value,
        dateFrom: fmtDate(startOfMonth(subMonths(now, 2))),
        dateTo: fmtDate(endOfMonth(now)),
      });
    }
  };

  const applyCustom = () => {
    if (draft?.from && draft?.to) {
      onChange({ ...value, dateFrom: fmtDate(draft.from), dateTo: fmtDate(draft.to) });
      setOpen(false);
    }
  };

  const label =
    value.dateFrom && value.dateTo
      ? `${format(new Date(value.dateFrom), 'd MMM', { locale: ar })} → ${format(
          new Date(value.dateTo),
          'd MMM',
          { locale: ar },
        )}`
      : 'اختر فترة';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:flex-wrap">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={preset === 'this-month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreset('this-month')}
        >
          هذا الشهر
        </Button>
        <Button
          variant={preset === '3-months' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreset('3-months')}
        >
          آخر 3 أشهر
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={preset === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn('gap-2', preset === 'custom' && 'font-bold')}
            >
              <CalendarIcon className="h-4 w-4" />
              {preset === 'custom' ? label : 'تاريخ مخصّص'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={1}
              locale={ar}
              className={cn('p-0 pointer-events-auto')}
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button size="sm" onClick={applyCustom} disabled={!draft?.from || !draft?.to}>
                تطبيق
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Select
        value={value.category ?? 'all'}
        onValueChange={(v) =>
          onChange({ ...value, category: v as ExpenseCategory | 'all' })
        }
      >
        <SelectTrigger className="lg:w-[180px]">
          <SelectValue placeholder="الفئة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الفئات</SelectItem>
          {EXPENSE_CATEGORY_KEYS.map((k) => (
            <SelectItem key={k} value={k}>
              {EXPENSE_CATEGORIES[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="lg:mr-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(defaultExpenseFilters())}
          className="gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          إعادة التعيين
        </Button>
      </div>
    </div>
  );
}
