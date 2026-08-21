import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, LogIn, UserPlus, Package, Settings, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CategoriesBar } from "./CategoriesBar";
import { Logo } from "./brand/Logo";
import { getCategoryIcon } from "./icons/CategoryIcons";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { slug: "falcon", label: "فالكون" },
  { slug: "hulk", label: "هولك" },
  { slug: "smarters", label: "سمارترز برو" },
] as const;

const mainNav = [
  { to: "/about", label: "من نحن" },
  { to: "/reviews", label: "التقييمات" },
  { to: "/activation-guide", label: "طريقة التفعيل" },
] as const;

const helpLinks = [
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { location } = useRouterState();
  const path = location.pathname;
  const { user, signOut } = useAuth();
  const navItemCls =
    "flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-bold text-foreground hover:bg-secondary";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className={`transition-all duration-300 ${
          scrolled
            ? "border-b border-border bg-background/85 backdrop-blur-xl shadow-[0_4px_24px_-12px_oklch(0.03_0.015_268/0.6)]"
            : "border-b border-transparent bg-background/30 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:h-16">
          <Link to="/" aria-label="شاهد ستور" className="flex shrink-0 items-center">
            <Logo size="md" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {mainNav.map((item) => {
              const active = path.startsWith(item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`group relative rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                    active ? "text-accent" : "text-foreground hover:text-accent"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3 bottom-1 h-[2px] origin-right rounded-full bg-gradient-to-l from-accent to-accent/40 transition-transform duration-300 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/40 px-3 text-sm font-bold text-foreground transition-all hover:border-accent/60 hover:bg-accent/10 hover:text-accent"
                    aria-label="حسابي"
                  >
                    <UserIcon className="h-4 w-4" />
                    حسابي
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-right text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders" className="flex w-full cursor-pointer items-center gap-2">
                      <Package className="h-4 w-4" />
                      طلباتي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="flex w-full cursor-pointer items-center gap-2">
                      <Settings className="h-4 w-4" />
                      بياناتي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      toast.success("تم تسجيل الخروج");
                      window.location.href = "/";
                    }}
                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  to="/login"
                  search={{ redirect: "/account", force: false }}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/40 px-3 text-sm font-bold text-foreground transition-all hover:border-accent/60 hover:bg-accent/10 hover:text-accent"
                >
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-3 text-sm font-bold text-accent-foreground transition-all hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4" />
                  حساب جديد
                </Link>
              </>
            )}
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/40 text-foreground transition-all hover:border-accent/60 hover:bg-accent/10 hover:text-accent lg:hidden"
                aria-label="القائمة"
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] overflow-y-auto bg-card p-0 sm:w-[340px]"
            >
              <SheetHeader className="border-b border-border p-4 text-right">
                <SheetTitle className="text-base">
                  <Logo size="sm" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                <p className="px-1 py-1 text-[11px] font-bold uppercase text-muted-foreground">
                  التصنيفات
                </p>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-bold text-foreground hover:bg-secondary hover:text-accent"
                  >
                    <span className="flex h-6 w-6 items-center justify-center">
                      {getCategoryIcon(c.slug, 22)}
                    </span>
                    {c.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border" />
                {mainNav.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-bold text-foreground hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border" />
                <p className="px-1 py-1 text-[11px] font-bold uppercase text-muted-foreground">
                  حسابي
                </p>
                {user ? (
                  <>
                    <Link
                      to="/account/orders"
                      onClick={() => setMenuOpen(false)}
                      className={navItemCls}
                    >
                      <Package className="h-4 w-4" />
                      طلباتي
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setMenuOpen(false)}
                      className={navItemCls}
                    >
                      <Settings className="h-4 w-4" />
                      بياناتي
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOut();
                        setMenuOpen(false);
                        toast.success("تم تسجيل الخروج");
                        window.location.href = "/";
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      search={{ redirect: "/account", force: false }}
                      onClick={() => setMenuOpen(false)}
                      className={navItemCls}
                    >
                      <LogIn className="h-4 w-4" />
                      تسجيل الدخول
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className={navItemCls}
                    >
                      <UserPlus className="h-4 w-4" />
                      إنشاء حساب جديد
                    </Link>
                  </>
                )}
                <div className="my-2 border-t border-border" />
                {helpLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <CategoriesBar />
    </header>
  );
}
