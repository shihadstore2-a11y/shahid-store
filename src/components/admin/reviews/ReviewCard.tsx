import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "./StarRating";
import { toggleReviewActive, type StoreReview } from "@/lib/admin-reviews";

type Props = {
  review: StoreReview;
  onDelete: (review: StoreReview) => void;
};

export function ReviewCard({ review, onDelete }: Props) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (v: boolean) => toggleReviewActive(review.id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["public-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{review.customer_name}</p>
          <p className="text-xs text-muted-foreground">
            {review.customer_city ?? "—"} · {review.product_label ?? "—"}
          </p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{review.review_text}</p>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={review.is_active}
            onCheckedChange={(v) => toggle.mutate(v)}
          />
          <span className="text-xs">{review.is_active ? "ظاهر" : "مخفي"}</span>
          <span className="text-xs text-muted-foreground">· #{review.display_order}</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(review)}
          aria-label="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
