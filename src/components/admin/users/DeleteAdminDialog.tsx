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
import type { AdminUserRow } from "@/lib/admin-users";

export function DeleteAdminDialog({
  user,
  onCancel,
  onConfirm,
  pending,
}: {
  user: AdminUserRow | null;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <AlertDialog open={!!user} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            حذف المستخدم من الإدارة وإعادته كعميل
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-right">
            <p>
              هل أنت متأكد من حذف{" "}
              <strong className="text-foreground">
                {user?.full_name || user?.email}
              </strong>{" "}
              من طاقم الإدارة؟
            </p>
            <p className="text-xs text-muted-foreground">
              ⚠️ سيتم سحب كافة الصلاحيات الإدارية منه، وتحويل حسابه فوراً إلى
              عميل عادي في المتجر ليتمكن من التسوق ومتابعة طلباته دون أي وصول
              للوحة التحكم.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={pending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
          >
            {pending ? "جارٍ الحذف والتحويل…" : "حذف وتحويل لعميل"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
