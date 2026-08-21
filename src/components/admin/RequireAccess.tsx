import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  routeFromPathname,
  ROUTE_LABEL_AR,
  ACCESS_EXEMPT_PATHS,
} from "@/lib/admin-rbac";

/**
 * حارس الوصول المركزي للوحة الإدارة.
 * يُغلق فجوة "URL مباشر يتجاوز السايدبار" — يتحقق فعلياً من صلاحية المسار
 * (الدور الأساسي OR الصلاحيات الإضافية للحساب).
 * RLS يبقى المرجع النهائي لحماية البيانات على مستوى قاعدة البيانات.
 */
export function RequireAccess({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role, canRoute, isLoading } = useAdminUser();

  // مسارات معفاة (الملف الشخصي / تسجيل الدخول) — ليست أجزاء صلاحيات
  if (ACCESS_EXEMPT_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  const route = routeFromPathname(pathname);

  // مسار غير معروف → لا نمنع (يتركه لحارس __root / NotFound)
  if (route === null) return <>{children}</>;

  if (isLoading || !role) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold/25 border-t-gold" />
      </div>
    );
  }

  if (!canRoute(route)) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-destructive" />
        <h2 className="text-xl font-black text-foreground">غير مصرّح بالوصول</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ليست لديك صلاحية الوصول إلى صفحة «{ROUTE_LABEL_AR[route]}».
          راجع المشرف العام لمنحك الصلاحية المناسبة.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
