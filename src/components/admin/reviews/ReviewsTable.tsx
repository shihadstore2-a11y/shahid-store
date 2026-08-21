import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { InlineEditField } from "@/components/admin/InlineEditField";
import { StarRating } from "./StarRating";
import {
  updateReview, toggleReviewActive, type StoreReview,
} from "@/lib/admin-reviews";

type Props = {
  reviews: StoreReview[];
  onDelete: (review: StoreReview) => void;
};

export function ReviewsTable({ reviews, onDelete }: Props) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["public-reviews"] });
  };

  const saveField = async (id: string, patch: Partial<StoreReview>) => {
    try {
      await updateReview(id, patch);
      invalidate();
      toast.success("تم الحفظ");
    } catch (e) {
      toast.error((e as Error).message || "فشل الحفظ");
      throw e;
    }
  };

  const toggleMut = useMutation({
    mutationFn: ({ id, v }: { id: string; v: boolean }) => toggleReviewActive(id, v),
    onSuccess: () => {
      invalidate();
      toast.success("تم التحديث");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-right text-sm">
        <thead className="bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-bold">العميل</th>
            <th className="px-4 py-3 font-bold">المدينة</th>
            <th className="px-4 py-3 font-bold">المنتج</th>
            <th className="px-4 py-3 font-bold">التقييم</th>
            <th className="px-4 py-3 font-bold">النص</th>
            <th className="px-4 py-3 font-bold">الترتيب</th>
            <th className="px-4 py-3 font-bold">ظاهر</th>
            <th className="px-4 py-3 font-bold">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reviews.map((r) => (
            <tr key={r.id} className="hover:bg-accent/5">
              <td className="px-4 py-3 font-bold">
                <InlineEditField
                  value={r.customer_name}
                  onSave={(v) => saveField(r.id, { customer_name: String(v) })}
                />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <InlineEditField
                  value={r.customer_city}
                  placeholder="—"
                  onSave={(v) => saveField(r.id, { customer_city: v ? String(v) : null })}
                />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <InlineEditField
                  value={r.product_label}
                  placeholder="—"
                  onSave={(v) => saveField(r.id, { product_label: v ? String(v) : null })}
                />
              </td>
              <td className="px-4 py-3">
                <StarRating
                  rating={r.rating}
                  editable
                  onChange={(rating) => saveField(r.id, { rating })}
                />
              </td>
              <td className="px-4 py-3 max-w-md">
                <InlineEditField
                  value={r.review_text}
                  inputClassName="w-80"
                  onSave={(v) => saveField(r.id, { review_text: String(v) })}
                  formatDisplay={(v) => {
                    const s = String(v ?? "");
                    return s.length > 60 ? s.slice(0, 60) + "…" : s;
                  }}
                />
              </td>
              <td className="px-4 py-3">
                <InlineEditField
                  value={r.display_order}
                  type="number"
                  min={0}
                  onSave={(v) => saveField(r.id, { display_order: Number(v) })}
                />
              </td>
              <td className="px-4 py-3">
                <Switch
                  checked={r.is_active}
                  onCheckedChange={(v) => toggleMut.mutate({ id: r.id, v })}
                />
              </td>
              <td className="px-4 py-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(r)}
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                لا توجد تقييمات بعد. أضف التقييم الأول.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
