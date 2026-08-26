import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  updateAdminUser, type AdminRole, type AdminUserRow,
} from "@/lib/admin-users";
import { ROLE_LABEL_AR } from "@/lib/admin-rbac";

const ROLES: AdminRole[] = ["orders_coupons_viewer", "staff", "admin", "developer", "super_admin"];

export function EditAdminDialog({
  user, onClose,
}: { user: AdminUserRow | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setPassword("");
      setRole(user.role);
    }
  }, [user]);

  const m = useMutation({
    mutationFn: updateAdminUser,
    onSuccess: async () => {
      toast.success("تم تحديث بيانات المستخدم وكلمة المرور بنجاح");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    m.mutate({
      id: user.id,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      role,
      password: password.trim() ? password.trim() : undefined,
    });
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل حساب المشرف / الموظف</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">البريد الإلكتروني</Label>
            <Input dir="ltr" value={user.email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">الاسم الكامل</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">رقم الجوال</Label>
            <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9665... أو +212..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">تعيين كلمة مرور جديدة (اختياري)</Label>
            <Input
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="اتركها فارغة إذا كنت لا تريد تغييرها"
            />
            <p className="text-[11px] text-muted-foreground">
              يمكنك كتابة كلمة مرور جديدة هنا لتفعيل حساب الموظف فوراً دون الحاجة لرسائل البريد.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">الصلاحية</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABEL_AR[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "جارٍ الحفظ…" : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
