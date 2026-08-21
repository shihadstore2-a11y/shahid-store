import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LogOut, Package, User as UserIcon } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "حسابي — شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  const { user, signOut } = useAuth();
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">حسابي</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut().then(() => (window.location.href = "/"))}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-1 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] lg:h-fit">
            <Tab to="/account" icon={<UserIcon className="h-4 w-4" />} label="الملف الشخصي" exact />
            <Tab to="/account/orders" icon={<Package className="h-4 w-4" />} label="طلباتي" />
          </aside>
          <div>
            <Outlet />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Tab({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to as never}
      activeOptions={{ exact }}
      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-foreground hover:bg-secondary"
      activeProps={{ className: "bg-secondary text-primary" }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
