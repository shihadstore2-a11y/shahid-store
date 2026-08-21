import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteReview, type StoreReview } from "@/lib/admin-reviews";

type Props = {
  review: StoreReview | null;
  onClose: () => void;
};

export function DeleteReviewDialog({ review, onClose }: Props) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["public-reviews"] });
      toast.success("تم حذف التقييم");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "فشل الحذف"),
  });

  return (
    <AlertDialog open={!!review} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف نهائي للتقييم؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيُحذف تقييم <span className="font-bold">{review?.customer_name}</span> نهائياً ولا يمكن استرجاعه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mut.isPending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            disabled={mut.isPending}
            onClick={(e) => {
              e.preventDefault();
              if (review) mut.mutate(review.id);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mut.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حذف نهائي
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
