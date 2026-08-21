import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GRANTABLE_ROUTES,
  GRANTABLE_ACTIONS,
  ROUTE_LABEL_AR,
  ACTION_LABEL_AR,
  ROLE_LABEL_AR,
  ROLE_PERMISSIONS,
  parseOverrides,
  actionEffectiveForRole,
  type AdminRoute,
  type PermAction,
} from "@/lib/admin-rbac";
import { updateAdminPermissions, type AdminUserRow } from "@/lib/admin-users";

export function ManagePermissionsDialog({
  user,
  onClose,
}: {
  user: AdminUserRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [actions, setActions] = useState<PermAction[]>([]);

  useEffect(() => {
    if (user) {
      const parsed = parseOverrides(user.permission_overrides);
      setRoutes(parsed.routes);
      setActions(parsed.actions);
    }
  }, [user]);

  const baseline = user ? ROLE_PERMISSIONS[user.role] : null;

  const save = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("لا يوجد مستخدم");
      return updateAdminPermissions(user.id, { routes, actions });
    },
    onSuccess: async () => {
      toast.success("تم تحديث الصلاحيات الإضافية");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      await qc.invalidateQueries({ queryKey: ["admin-user"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRoute = (r: AdminRoute) =>
    setRoutes((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  const toggleAction = (a: PermAction) =>
    setActions((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const ineffective = useMemo(
    () =>
      user
        ? actions.filter((a) => !actionEffectiveForRole(user.role, a))
        : [],
    [actions, user],
  );

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            الصلاحيات الإضافية
          </DialogTitle>
          <DialogDescription>
            {user && (
              <>
                {user.full_name || user.email} — الدور الأساسي:{" "}
                <span className="font-bold text-foreground">{ROLE_LABEL_AR[user.role]}</span>.
                المنح إضافي فقط فوق الدور (لا يسحب أي صلاحية).
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {ineffective.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-amber-200">
              الأفعال التالية لن تعمل فعلياً لهذا الدور دون ترقية الدور (قاعدة البيانات سترفض الكتابة):{" "}
              <span className="font-bold">
                {ineffective.map((a) => ACTION_LABEL_AR[a]).join("، ")}
              </span>
            </p>
          </div>
        )}

        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-black">الوصول للصفحات</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {GRANTABLE_ROUTES.map((r) => {
                const inherited = baseline?.canAccessRoutes.includes(r) ?? false;
                const checked = inherited || routes.includes(r);
                return (
                  <label
                    key={r}
                    className={`flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm ${
                      inherited ? "opacity-60" : "cursor-pointer hover:bg-accent/10"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={inherited}
                      onCheckedChange={() => toggleRoute(r)}
                    />
                    <span>{ROUTE_LABEL_AR[r]}</span>
                    {inherited && <span className="ms-auto text-[10px] text-muted-foreground">موروثة</span>}
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-black">صلاحيات التعديل</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {GRANTABLE_ACTIONS.map((a) => {
                const inherited = baseline?.[a] ?? false;
                const checked = inherited || actions.includes(a);
                return (
                  <label
                    key={a}
                    className={`flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm ${
                      inherited ? "opacity-60" : "cursor-pointer hover:bg-accent/10"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={inherited}
                      onCheckedChange={() => toggleAction(a)}
                    />
                    <span>{ACTION_LABEL_AR[a]}</span>
                    {inherited && <span className="ms-auto text-[10px] text-muted-foreground">موروثة</span>}
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "جارٍ الحفظ…" : "حفظ الصلاحيات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
