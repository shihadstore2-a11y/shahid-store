import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  canAccessRoute,
  hasPermission,
  parseOverrides,
  type AdminRoute,
  type PermAction,
  type PermissionOverrides,
} from "@/lib/admin-rbac";

export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"];

/**
 * Hook لجلب بيانات الـ admin المسجّل دخوله.
 * يستخدم supabase.auth مباشرة (SSR-safe) بدون اعتماد على AuthProvider context.
 */
export function useAdminUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setAuthLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUserId(data.session?.user?.id ?? null);
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setUserId(sess?.user?.id ?? null);
      setAuthLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const query = useQuery({
    queryKey: ["admin-user", userId ?? "anon"],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<AdminUser | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  const role = query.data?.role ?? null;

  const overrides: PermissionOverrides = useMemo(
    () => parseOverrides(query.data?.permission_overrides),
    [query.data?.permission_overrides],
  );

  const can = useMemo(
    () => (perm: PermAction) => hasPermission(role, perm, overrides),
    [role, overrides],
  );
  const canRoute = useMemo(
    () => (route: AdminRoute) => canAccessRoute(role, route, overrides),
    [role, overrides],
  );

  return {
    adminUser: query.data ?? null,
    isLoading: authLoading || (userId != null && query.isLoading),
    role,
    overrides,
    can,
    canRoute,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "super_admin" || role === "admin",
    isStaff: role === "super_admin" || role === "admin" || role === "staff",
    isDeveloper: role === "super_admin" || role === "developer",
  };
}
