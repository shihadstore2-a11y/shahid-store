import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  type Expense,
  type ExpenseCategory,
  type ExpenseCreate,
} from '@/types/accounting';

const today = () => format(new Date(), 'yyyy-MM-dd');
const minDate = () => subDays(new Date(), 90);

const DESC_PLACEHOLDER = 'مثال: فاتورة Hostinger مايو 2026 - دفع بالبنك الأهلي';

type FormState = {
  expense_date: string;
  category: ExpenseCategory | '';
  amount: string;
  description: string;
  receipt_url: string;
};

const emptyForm = (): FormState => ({
  expense_date: today(),
  category: '',
  amount: '',
  description: '',
  receipt_url: '',
});

function isValidUrl(u: string) {
  if (!u.trim()) return true;
  try {
    const url = new URL(u.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense: Expense | null;
  onSubmit: (input: ExpenseCreate, id?: string) => Promise<void>;
}) {
  const isEdit = !!expense;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        expense_date: expense.expense_date,
        category: expense.category,
        amount: String(expense.amount),
        description: expense.description,
        receipt_url: expense.receipt_url ?? '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, expense]);

  const amountNum = Number(form.amount);
  const descLen = form.description.trim().length;
  const errors = {
    category: !form.category ? 'اختر فئة' : '',
    amount:
      form.amount === ''
        ? 'أدخل المبلغ'
        : !Number.isFinite(amountNum) || amountNum <= 0
          ? 'المبلغ يجب أن يكون أكبر من صفر'
          : amountNum > 99999
            ? 'المبلغ كبير جداً (الحد 99,999)'
            : '',
    description:
      descLen < 3 ? 'الوصف يجب أن يكون 3 أحرف على الأقل' : descLen > 500 ? 'الوصف طويل (500 حرف كحد أقصى)' : '',
    date: !form.expense_date ? 'اختر التاريخ' : '',
    receipt: !isValidUrl(form.receipt_url) ? 'رابط غير صالح' : '',
  };
  const canSubmit =
    !errors.category && !errors.amount && !errors.description && !errors.date && !errors.receipt && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !form.category) return;
    setSaving(true);
    try {
      await onSubmit(
        {
          category: form.category,
          description: form.description.trim(),
          amount: amountNum,
          expense_date: form.expense_date,
          receipt_url: form.receipt_url.trim() || null,
        },
        expense?.id,
      );
      onOpenChange(false);
    } catch {
      // toast handled upstream
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</DialogTitle>
          <DialogDescription>
            سجّل المصاريف التشغيلية لاحتسابها ضمن صافي ربح المتجر.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>التاريخ</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start gap-2 font-normal',
                    !form.expense_date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {form.expense_date
                    ? format(new Date(form.expense_date), 'd MMMM yyyy', { locale: ar })
                    : 'اختر التاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.expense_date ? new Date(form.expense_date) : undefined}
                  onSelect={(d) => {
                    if (d) {
                      setForm({ ...form, expense_date: format(d, 'yyyy-MM-dd') });
                      setDateOpen(false);
                    }
                  }}
                  disabled={(d) => d > new Date() || d < minDate()}
                  locale={ar}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-cat">الفئة</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}
            >
              <SelectTrigger id="exp-cat">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORY_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {EXPENSE_CATEGORIES[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-amount">المبلغ</Label>
            <div className="relative">
              <Input
                id="exp-amount"
                type="number"
                inputMode="decimal"
                min={0.01}
                max={99999}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="pl-14"
                placeholder="0.00"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                ر.س
              </span>
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-desc">
              الوصف <span className="text-xs font-normal text-muted-foreground">({descLen}/500)</span>
            </Label>
            <Textarea
              id="exp-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={DESC_PLACEHOLDER}
              rows={3}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-receipt">
              رابط الإيصال <span className="text-xs font-normal text-muted-foreground">(اختياري)</span>
            </Label>
            <Input
              id="exp-receipt"
              type="url"
              value={form.receipt_url}
              onChange={(e) => setForm({ ...form, receipt_url: e.target.value })}
              placeholder="https://..."
              dir="ltr"
            />
            {errors.receipt && <p className="text-xs text-destructive">{errors.receipt}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={!canSubmit} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'حفظ التغييرات' : 'إضافة المصروف'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
