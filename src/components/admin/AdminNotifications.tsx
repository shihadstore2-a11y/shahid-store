import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Package, AlertCircle, CheckCircle2, Clock, Inbox } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type OrderNotif = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  fulfilled_at?: string | null;
};

const LS_SEEN_KEY = "admin_notifs_seen_at";

export function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<OrderNotif[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seenAt, setSeenAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const v = localStorage.getItem(LS_SEEN_KEY);
    return v ? parseInt(v, 10) : 0;
  });

  const load = async () => {
    setLoading(true);
    try {
      // طبقة العرض: حصراً paid/fulfilled (لا pending). الإجراء المطلوب = تسليم المدفوع.
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, total, status, created_at, fulfilled_at")
        .eq("is_test", false)
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(8);
      if (!error && data) {
        setOrders(data as OrderNotif[]);
        // "بانتظار التسليم" = مدفوع بلا fulfilled_at (المعيار الموثوق).
        setPendingCount(
          data.filter((o) => o.status === "paid" && !(o as OrderNotif).fulfilled_at).length,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-notif-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load(),
      )
      .subscribe();
    const t = setInterval(load, 60_000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(t);
    };
  }, []);

  const unseen = orders.filter(
    (o) => new Date(o.created_at).getTime() > seenAt,
  ).length;

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      const now = Date.now();
      setSeenAt(now);
      try {
        localStorage.setItem(LS_SEEN_KEY, String(now));
      } catch {}
    }
  };

  const statusIcon = (s: string) => {
    if (s === "pending") return <Clock className="h-3.5 w-3.5 text-amber-400" />;
    if (s === "paid" || s === "completed" || s === "delivered")
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    if (s === "cancelled" || s === "failed")
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Package className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const statusLabel = (s: string) =>
    ({
      pending: "بانتظار التأكيد",
      paid: "مدفوع",
      completed: "مكتمل",
      delivered: "تم التسليم",
      cancelled: "ملغي",
      failed: "فشل الدفع",
    } as Record<string, string>)[s] ?? s;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          aria-label={`إشعارات${unseen ? ` (${unseen} جديد)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unseen > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-black leading-none text-destructive-foreground ring-2 ring-card">
              {unseen > 9 ? "9+" : unseen}
            </span>
          )}
          {unseen > 0 && (
            <span className="pointer-events-none absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 animate-ping rounded-full bg-destructive/60" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,360px)] overflow-hidden rounded-xl border border-zinc-200 bg-white p-0 shadow-[0_24px_60px_-15px_oklch(0_0_0/0.35)] ring-1 ring-black/5"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-600">
              <Bell className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm font-black text-zinc-900">الإشعارات</p>
              <p className="text-xs text-zinc-600">
                آخر الطلبات والتنبيهات
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-700">
              {pendingCount} بانتظار التسليم
            </span>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="admin-shimmer h-14 rounded-lg"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Inbox className="h-8 w-8 text-zinc-400" />
              <p className="text-sm font-bold text-zinc-900">لا توجد إشعارات</p>
              <p className="text-xs text-zinc-600">
                سيظهر هنا أي طلب جديد فور وصوله
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {orders.map((o) => {
                const isNew = new Date(o.created_at).getTime() > seenAt;
                return (
                  <li key={o.id}>
                    <Link
                      to="/admin/orders"
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-100"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 ring-1 ring-zinc-200">
                        {statusIcon(o.status)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-black text-zinc-900">
                            #{o.order_number}
                          </p>
                          {isNew && (
                            <span className="shrink-0 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-black text-red-600">
                              جديد
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-zinc-700">
                          {o.customer_name} • {statusLabel(o.status)}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-xs text-zinc-500">
                            {formatDistanceToNow(new Date(o.created_at), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                          <span className="text-xs font-bold tabular-nums text-amber-600">
                            {Number(o.total).toFixed(2)} ر.س
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-zinc-200 p-2">
          <Link
            to="/admin/orders"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/10"
          >
            عرض كل الطلبات
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
