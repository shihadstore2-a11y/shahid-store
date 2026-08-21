import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAdminUser, type AdminRole } from "@/hooks/useAdminUser";
import { ROLE_LABEL_AR } from "@/lib/admin-rbac";

export function RequireRole({
  roles,
  children,
  fallback,
}: {
  roles: AdminRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role, isLoading } = useAdminUser();

  if (isLoading) return null;

  if (!role || !roles.includes(role)) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <h2 className="text-xl font-black text-foreground">غير مصرّح بالوصول</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          هذه الصفحة متاحة فقط لـ{" "}
          {roles.map((r) => ROLE_LABEL_AR[r]).join(" و")}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
