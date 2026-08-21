import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAccess } from "@/components/admin/RequireAccess";

export const Route = createFileRoute("/_admin")({
  component: AdminShell,
});

type GuardState = "checking" | "allowed";

function AdminShell() {
  const navigate = useNavigate();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    let alive = true;

    const verifyAdminSession = async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const session = sess.session;

        if (!alive) return;
        if (!session) {
          await navigate({ to: "/admin/login", replace: true });
          return;
        }

        const remembered = localStorage.getItem("admin_remember_me") === "true";
        const tabAlive = sessionStorage.getItem("admin_session_tab") === "1";

        if (!remembered && !tabAlive) {
          await supabase.auth.signOut();
          if (alive) await navigate({ to: "/admin/login", replace: true });
          return;
        }

        if (!remembered) sessionStorage.setItem("admin_session_tab", "1");

        const { data: admin, error } = await supabase
          .from("admin_users")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (!alive) return;
        if (error || !admin) {
          await navigate({ to: "/", search: { unauthorized: "1" } as never, replace: true });
          return;
        }

        setState("allowed");
      } catch {
        if (alive) await navigate({ to: "/admin/login", replace: true });
      }
    };

    void verifyAdminSession();

    return () => {
      alive = false;
    };
  }, [navigate]);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-2xl border border-gold/25 bg-card/80 px-6 py-5 text-center shadow-[var(--shadow-gold)]">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gold/25 border-t-gold" />
          <p className="text-sm font-bold text-muted-foreground">جارٍ استعادة جلسة الإدارة…</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <RequireAccess>
        <Outlet />
      </RequireAccess>
    </AdminLayout>
  );
}
