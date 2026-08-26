import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Loader2,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import type { ComponentType } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatSAR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useWhatsappNumber, whatsappLink } from "@/lib/whatsapp";
import {
  getRecoveryState,
  type OrderRecoveryState,
} from "@/lib/order-recovery";

export const Route = createFileRoute("/_authenticated/account/orders")({
  component: OrdersPage,
});

const STATUS_AR: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد الانتظار", cls: "bg-amber-500/10 text-amber-300 border border-amber-500/30" },
  initiated: { label: "بدء الدفع", cls: "bg-blue-500/10 text-blue-300 border border-blue-500/30" },
  paid: { label: "مدفوع", cls: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" },
  payment_failed: { label: "فشل الدفع", cls: "bg-red-500/10 text-red-300 border border-red-500/30" },
  cancelled: { label: "ملغى", cls: "bg-gray-500/10 text-gray-300 border border-gray-500/30" },
  failed: { label: "فاشل", cls: "bg-red-500/10 text-red-300 border border-red-500/30" },
  refunded: { label: "مستردّ", cls: "bg-purple-500/10 text-purple-300 border border-purple-500/30" },
  fulfilled: { label: "مُسلَّم 🎁", cls: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40" },
};

const ICON_MAP: Record<OrderRecoveryState["iconKey"], ComponentType<{ className?: string }>> = {
  "check-circle": CheckCircle2,
  clock: Clock,
  "x-circle": XCircle,
  ban: Ban,
  loader: Loader2,
  package: Package,
};

const BANNER_CLS: Record<OrderRecoveryState["variant"], string> = {
  success: "border-emerald-500/30 bg-emerald-500/5",
  info: "border-accent/30 bg-accent/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  destructive: "border-destructive/30 bg-destructive/10",
  default: "border-border bg-secondary/30",
};

const ICON_CLS: Record<OrderRecoveryState["variant"], string> = {
  success: "text-emerald-400",
  info: "text-accent",
  warning: "text-amber-400",
  destructive: "text-destructive",
  default: "text-muted-foreground",
};

function OrdersPage() {
  const { user } = useAuth();
  const whatsappNumber = useWhatsappNumber();

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id, user?.email, user?.phone],
    queryFn: async () => {
      if (!user) return [];
      const userEmail = user.email ? user.email.toLowerCase().trim() : null;
      const userPhone = user.phone || (user.user_metadata?.phone as string | undefined) || null;

      // 1. استخدام RPC لربط وجلب الطلبات
      try {
        const { data: rpcOrders, error: rpcErr } = await supabase.rpc(
          "get_my_customer_orders",
          {
            _user_id: user.id,
            _email: userEmail,
            _phone: userPhone,
          },
        );
        if (!rpcErr && rpcOrders && Array.isArray(rpcOrders)) {
          // استبعاد الطلبات غير المدفوعة (pending / initiated)
          return rpcOrders.filter((o: any) =>
            ["paid", "fulfilled", "refunded", "cancelled"].includes(o.status),
          );
        }
      } catch (e) {
        console.warn("[OrdersPage] RPC failed, fallback to direct query:", e);
      }

      // 2. Fallback query
      let q = supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, fulfilled_at")
        .in("status", ["paid", "fulfilled", "refunded", "cancelled"]);

      if (userEmail && userPhone) {
        q = q.or(`user_id.eq.${user.id},customer_email.ilike.${userEmail},customer_phone.eq.${userPhone}`);
      } else if (userEmail) {
        q = q.or(`user_id.eq.${user.id},customer_email.ilike.${userEmail}`);
      } else {
        q = q.eq("user_id", user.id);
      }

      const { data: directData, error: directErr } = await q.order("created_at", { ascending: false });
      if (directErr) throw directErr;
      return directData ?? [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        جارٍ التحميل...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Package className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mt-3 text-lg font-black">لا توجد طلبات بعد</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ابدأ بتصفّح اشتراكاتنا واطلب الآن.
        </p>
        <Link
          to="/products"
          className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          تصفّح الاشتراكات
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((o) => {
        const st = STATUS_AR[o.status] ?? STATUS_AR.pending;
        const recovery = getRecoveryState(
          {
            id: o.id,
            order_number: o.order_number,
            status: o.status,
            fulfilled_at: o.fulfilled_at,
          },
          (msg) => whatsappLink(msg, whatsappNumber),
        );
        const Icon = ICON_MAP[recovery.iconKey] ?? Package;
        const isLoaderIcon = recovery.iconKey === "loader";

        return (
          <div
            key={o.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-3"
          >
            {/* Header: clickable summary → تفاصيل الطلب */}
            <Link
              to="/account/order/$id"
              params={{ id: o.id }}
              className="flex items-center justify-between gap-3 transition hover:opacity-90"
              aria-label={`عرض تفاصيل الطلب ${o.order_number}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Package className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-sm font-bold text-foreground">
                    {o.order_number}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("ar-SA")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-primary">{formatSAR(o.total)}</span>
                <ArrowLeft className="h-4 w-4 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
              </div>
            </Link>

            {/* Status badge */}
            <div>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black ${st.cls}`}>
                {st.label}
              </span>
            </div>

            {/* Recovery banner */}
            <div
              className={cn(
                "rounded-xl border p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                BANNER_CLS[recovery.variant],
              )}
              role="status"
            >
              <div className="flex items-start gap-2 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    ICON_CLS[recovery.variant],
                    isLoaderIcon && "animate-spin",
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{recovery.title}</p>
                  {recovery.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {recovery.description}
                    </p>
                  )}
                </div>
              </div>

              {recovery.action && (
                <a
                  href={recovery.action.href}
                  target={recovery.action.external ? "_blank" : undefined}
                  rel={recovery.action.external ? "noopener noreferrer" : undefined}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition shrink-0",
                    recovery.action.variant === "primary" &&
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                    recovery.action.variant === "secondary" &&
                      "border border-border bg-background hover:bg-secondary",
                    recovery.action.variant === "whatsapp" &&
                      "bg-emerald-600 text-white hover:bg-emerald-700",
                  )}
                  aria-label={recovery.action.label}
                >
                  {recovery.action.variant === "whatsapp" && (
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {recovery.action.label}
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
