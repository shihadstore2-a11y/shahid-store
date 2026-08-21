import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PROVIDER_LABEL, type InventoryItem } from "@/lib/admin-inventory";

export function DeleteInventoryDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
}: {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  const isClaimed = item?.status === "claimed";
  const isAvailable = item?.status === "available";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isClaimed
              ? "لا يمكن حذف اشتراك مسلَّم"
              : `حذف اشتراك ${item ? PROVIDER_LABEL[item.provider] : ""} — ${item?.username ?? ""}؟`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isClaimed ? (
              "هذا الاشتراك مرتبط بطلب فعلي ولا يمكن حذفه. عدّل الحالة أو اتركه."
            ) : isAvailable ? (
              "هذا الاشتراك متاح وقد يستخدمه التسليم التلقائي خلال ثوانٍ — هل أنت متأكد من الحذف؟"
            ) : (
              "هذا الإجراء لا يمكن التراجع عنه. سيختفي الاشتراك من المخزون نهائياً."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          {!isClaimed && (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف نهائياً
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
