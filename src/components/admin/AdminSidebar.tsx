import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, ShoppingBag, ShoppingCart, Users, Tag, FileText,
  Star, BarChart3, Settings, Shield, User, LogOut, X, BookOpen, Crown,
  Calculator, Receipt, TrendingUp, Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminUser } from "@/hooks/useAdminUser";
import { type AdminRoute } from "@/lib/admin-rbac";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = { to: string; label: string; Icon: LucideIcon; route: AdminRoute };

const ITEMS: Item[] = [
  { to: "/admin/dashboard", label: "لوحة التحكم", Icon: LayoutDashboard, route: "dashboard" },
  { to: "/admin/orders", label: "الطلبات", Icon: ShoppingBag, route: "orders" },
  { to: "/admin/abandoned-orders", label: "السلات المتروكة", Icon: ShoppingCart, route: "abandoned-orders" },
  { to: "/admin/products", label: "المنتجات", Icon: Package, route: "products" },
  { to: "/admin/customers", label: "العملاء", Icon: Users, route: "customers" },
  { to: "/admin/coupons", label: "الكوبونات", Icon: Tag, route: "coupons" },
  { to: "/admin/articles", label: "المقالات", Icon: FileText, route: "articles" },
  { to: "/admin/reviews", label: "التقييمات", Icon: Star, route: "reviews" },
  { to: "/admin/activation-guide", label: "دليل التفعيل", Icon: BookOpen, route: "activation-guide" },
  { to: "/admin/reports", label: "التقارير", Icon: BarChart3, route: "reports" },
  { to: "/admin/settings", label: "الإعدادات", Icon: Settings, route: "settings" },
  { to: "/admin/users", label: "إدارة المستخدمين", Icon: Shield, route: "users" },
];

const ACCOUNTING_ITEMS: Item[] = [
  { to: "/admin/accounting/costs", label: "التكاليف", Icon: Tag, route: "accounting-costs" },
  { to: "/admin/accounting/expenses", label: "المصاريف", Icon: Receipt, route: "accounting-expenses" },
  { to: "/admin/accounting/reports", label: "التقارير المالية", Icon: TrendingUp, route: "accounting-reports" },
  { to: "/admin/accounting/periods", label: "الإقفال الشهري", Icon: Lock, route: "accounting-periods" },
];

const INVENTORY_ITEMS: Item[] = [
  { to: "/admin/inventory", label: "إدارة المخزون", Icon: Package, route: "inventory" },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مشرف عام",
  admin: "مشرف",
  staff: "موظف",
  developer: "مطوّر",
};

function renderItem(item: Item, path: string, onClose?: () => void) {
  const active = path === item.to;
  return (
    <Link
      key={item.to}
      to={item.to}
      onClick={onClose}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200 ease-out",
        active
          ? "bg-gradient-to-l from-gold/20 via-gold/10 to-transparent text-foreground"
          : "text-muted-foreground hover:bg-accent/15 hover:text-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-y-1.5 right-0 w-[3px] rounded-l-full bg-gradient-to-b from-gold to-[oklch(0.88_0.20_90)] shadow-[0_0_12px_oklch(0.78_0.16_85/0.55)]"
        />
      )}
      <item.Icon
        className={cn(
          "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
          active && "text-gold-foreground",
        )}
      />
      {item.label}
    </Link>
  );
}

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const { adminUser, role, canRoute, isLoading } = useAdminUser();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    window.location.href = "/admin/login";
  };

  return (
    <aside className="flex h-full w-[260px] flex-col border-l border-gold/25 bg-card shadow-[var(--shadow-elevated)]">
      <div className="relative flex items-center justify-between border-b border-gold/20 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            <p className="bg-gradient-to-l from-gold via-gold to-[oklch(0.88_0.20_90)] bg-clip-text text-base font-black text-transparent">
              إدارة شاهد
            </p>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {adminUser?.full_name || adminUser?.email || "مشرف"}
          </p>
          {adminUser?.role && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-gold/35 bg-gold/10 px-2 py-0.5 text-[10px] font-black text-gold-foreground">
              <Crown className="h-2.5 w-2.5" />
              {ROLE_LABELS[adminUser.role]}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1 transition-colors hover:bg-accent/20 lg:hidden" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="admin-shimmer h-10 rounded-lg" />
          ))
        ) : (
          <>
            {ITEMS.filter((i) => canRoute(i.route)).map((item) => renderItem(item, path, onClose))}
            {(() => {
              const accountingVisible = ACCOUNTING_ITEMS.filter((i) => canRoute(i.route));
              if (accountingVisible.length === 0) return null;
              return (
                <>
                  <div className="mt-4 flex items-center gap-2 px-3 pb-1 pt-3 text-[11px] font-black uppercase tracking-wider text-gold/80">
                    <Calculator className="h-3.5 w-3.5" />
                    <span>المحاسبة</span>
                    <span className="ml-auto h-px flex-1 bg-gradient-to-l from-transparent via-gold/30 to-transparent" />
                  </div>
                  {accountingVisible.map((item) => renderItem(item, path, onClose))}
                </>
              );
            })()}
            {(() => {
              const inventoryVisible = INVENTORY_ITEMS.filter((i) => canRoute(i.route));
              if (inventoryVisible.length === 0) return null;
              return (
                <>
                  <div className="mt-4 flex items-center gap-2 px-3 pb-1 pt-3 text-[11px] font-black uppercase tracking-wider text-gold/80">
                    <Package className="h-3.5 w-3.5" />
                    <span>المخزون</span>
                    <span className="ml-auto h-px flex-1 bg-gradient-to-l from-transparent via-gold/30 to-transparent" />
                  </div>
                  {inventoryVisible.map((item) => renderItem(item, path, onClose))}
                </>
              );
            })()}
          </>
        )}
      </nav>


      <div className="space-y-1 border-t border-gold/20 p-3">
        <Link
          to="/admin/profile"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground transition-all duration-200 ease-out hover:bg-accent/15 hover:text-foreground"
        >
          <User className="h-4 w-4" />
          ملفي الشخصي
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-destructive transition-all duration-200 ease-out hover:bg-destructive/15"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
