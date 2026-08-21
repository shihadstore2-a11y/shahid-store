import { Check, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { InlineEditField } from "@/components/admin/InlineEditField";
import { CouponStatusBadge } from "./CouponStatusBadge";
import type { AdminCoupon, CouponUpdate } from "@/lib/admin-coupons";

export function CouponCard({
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

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold">{coupon.code}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyCode}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <CouponStatusBadge coupon={coupon} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">نسبة الخصم</div>
          <InlineEditField
            value={coupon.discount_percent}
            type="number"
            min={1}
            suffix="%"
            onSave={(v) => onUpdate(coupon.id, { discount_percent: Number(v) })}
          />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">حد أدنى للمدة</div>
          <InlineEditField
            value={coupon.applies_to_duration_min}
            type="number"
            min={0}
            suffix="شهر"
            onSave={(v) => onUpdate(coupon.id, { applies_to_duration_min: Number(v) })}
          />
        </div>
        <div className="col-span-2">
          <div className="text-xs text-muted-foreground">تاريخ الانتهاء</div>
          <div className="text-sm">
            {coupon.valid_until
              ? new Date(coupon.valid_until).toLocaleDateString("ar-SA")
              : "بدون انتهاء"}
          </div>
        </div>
      </div>

      {canModify ? (
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={coupon.is_active}
              onCheckedChange={(v) => onUpdate(coupon.id, { is_active: v })}
            />
            <span className="text-sm">نشط</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(coupon)}
          >
            <Trash2 className="ml-1 h-4 w-4" />
            حذف
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-center text-[11px] text-muted-foreground">
          وضع المشاهدة فقط
        </div>
      )}
    </div>
  );
}
