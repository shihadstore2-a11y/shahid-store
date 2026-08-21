import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ChevronLeft, ExternalLink } from "lucide-react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { AdminNotifications } from "@/components/admin/AdminNotifications";

const TITLES: Record<string, string> = {
  "/admin/dashboard": "لوحة التحكم",
  "/admin/profile": "ملفي الشخصي",
  "/admin/orders": "الطلبات",
  "/admin/products": "المنتجات",
  "/admin/customers": "العملاء",
  "/admin/coupons": "الكوبونات",
  "/admin/articles": "المقالات",
  "/admin/reviews": "التقييمات",
  "/admin/reports": "التقارير",
  "/admin/settings": "الإعدادات",
  "/admin/users": "الصلاحيات",
};

export function AdminHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { adminUser } = useAdminUser();
  const title = TITLES[path] ?? "اللوحة";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-gold/20 bg-card/70 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-md p-1.5 transition-colors hover:bg-accent/20 lg:hidden"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/admin/dashboard" className="text-muted-foreground transition-colors hover:text-gold-foreground">
            الإدارة
          </Link>
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-black">{title}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <AdminNotifications />
        <Link
          to="/"
          className="hidden items-center gap-1.5 rounded-lg border border-gold/30 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:border-gold/60 hover:bg-gold/10 hover:text-foreground sm:inline-flex"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          الموقع
        </Link>
        <Link
          to="/admin/profile"
          className="flex items-center gap-2 rounded-lg border border-gold/25 bg-card/60 px-2.5 py-1.5 text-xs font-bold transition-all hover:border-gold/55 hover:bg-gold/10"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold/30 to-gold/10 text-[10px] font-black text-gold-foreground ring-2 ring-gold/30 ring-offset-1 ring-offset-card">
            {(adminUser?.full_name || adminUser?.email || "؟").slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden max-w-[100px] truncate sm:inline">
            {adminUser?.full_name || adminUser?.email}
          </span>
        </Link>
      </div>
    </header>
  );
}
