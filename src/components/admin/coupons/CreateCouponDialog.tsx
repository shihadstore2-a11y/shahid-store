import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CouponInput } from "@/lib/admin-coupons";

const DEFAULT: CouponInput = {
  code: "",
  discount_percent: 10,
  valid_until: null,
  applies_to_duration_min: 0,
};

export function CreateCouponDialog({
  onCreate,
}: {
  onCreate: (input: CouponInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CouponInput>(DEFAULT);
  const [creating, setCreating] = useState(false);
  const [dateInput, setDateInput] = useState("");

  const codeOk = /^[A-Z0-9_-]{4,20}$/.test(form.code.trim().toUpperCase());
  const valueOk = form.discount_percent >= 1 && form.discount_percent <= 100;
  const canSubmit = codeOk && valueOk && !creating;

  const reset = () => {
    setForm(DEFAULT);
    setDateInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setCreating(true);
    try {
      const valid_until = dateInput ? new Date(dateInput + "T23:59:59").toISOString() : null;
      await onCreate({ ...form, valid_until, code: form.code.trim().toUpperCase() });
      reset();
      setOpen(false);
    } catch {
      // toast handled by mutation
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          كوبون جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء كوبون جديد</DialogTitle>
          <DialogDescription>أنشئ كوبون خصم للعملاء — كل الحقول مطلوبة عدا تاريخ الانتهاء.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">كود الكوبون</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="font-mono uppercase"
              maxLength={20}
              placeholder="SUMMER25"
              required
            />
            <p className="text-xs text-muted-foreground">
              حروف إنجليزية وأرقام وشرطات فقط، 4-20 حرف.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">نسبة الخصم (%)</Label>
            <Input
              id="value"
              type="number"
              min={1}
              max={100}
              value={form.discount_percent}
              onChange={(e) =>
                setForm({ ...form, discount_percent: Number(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-months">حد أدنى للمدة (بالأشهر)</Label>
            <Input
              id="min-months"
              type="number"
              min={0}
              value={form.applies_to_duration_min}
              onChange={(e) =>
                setForm({ ...form, applies_to_duration_min: Number(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              0 = يصلح لأي مدة. اكتب 12 لقصره على الاشتراكات السنوية.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid">تاريخ الانتهاء (اختياري)</Label>
            <Input
              id="valid"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">اتركه فارغاً لكوبون دائم.</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {creating ? "جاري الإنشاء..." : "إنشاء الكوبون"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
