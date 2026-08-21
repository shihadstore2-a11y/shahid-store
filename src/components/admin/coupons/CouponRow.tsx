import { Check, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineEditField } from "@/components/admin/InlineEditField";
import { CouponStatusBadge } from "./CouponStatusBadge";
import type { AdminCoupon, CouponUpdate } from "@/lib/admin-coupons";

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CouponRow({
  coupon,
  onUpdate,
  onDelete,
  canModify = true,
}: {
  coupon: AdminCoupon;
  onUpdate: (id: string, updates: CouponUpdate) => Promise<void>;
  onDelete: (coupon: AdminCoupon) => void;
  canModify?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState(toDateInput(coupon.valid_until));

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success("نُسخ الكود");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const saveDate = async () => {
    const iso = dateDraft ? new Date(dateDraft + "T23:59:59").toISOString() : null;
    if (iso === coupon.valid_until) {
      setEditingDate(false);
      return;
    }
    try {
      await onUpdate(coupon.id, { valid_until: iso });
      setEditingDate(false);
    } catch {
      setDateDraft(toDateInput(coupon.valid_until));
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{coupon.code}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={copyCode}
            aria-label="نسخ الكود"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </TableCell>

      <TableCell>
        <InlineEditField
          value={coupon.discount_percent}
          type="number"
          min={1}
          suffix="%"
          ariaLabel="نسبة الخصم"
          onSave={(v) => onUpdate(coupon.id, { discount_percent: Number(v) })}
        />
      </TableCell>

      <TableCell>
        <InlineEditField
          value={coupon.applies_to_duration_min}
          type="number"
          min={0}
          suffix="شهر"
          ariaLabel="الحد الأدنى للمدة"
          onSave={(v) => onUpdate(coupon.id, { applies_to_duration_min: Number(v) })}
        />
      </TableCell>

      <TableCell>
        {editingDate ? (
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={dateDraft}
              onChange={(e) => setDateDraft(e.target.value)}
              className="h-8 w-40"
              autoFocus
            />
            <Button size="sm" onClick={saveDate} className="h-8">حفظ</Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                setDateDraft(toDateInput(coupon.valid_until));
                setEditingDate(false);
              }}
            >
              إلغاء
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingDate(true)}
            className="rounded-md px-2 py-1 text-sm hover:bg-accent/10"
          >
            {coupon.valid_until
              ? new Date(coupon.valid_until).toLocaleDateString("ar-SA")
              : "بدون انتهاء"}
          </button>
        )}
      </TableCell>

      <TableCell>
        <CouponStatusBadge coupon={coupon} />
      </TableCell>

      {canModify && (
        <TableCell>
          <Switch
            checked={coupon.is_active}
            onCheckedChange={(v) => onUpdate(coupon.id, { is_active: v })}
            aria-label="تفعيل/إيقاف"
          />
        </TableCell>
      )}

      {canModify && (
        <TableCell>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(coupon)}
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}
