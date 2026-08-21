import { Link } from "@tanstack/react-router";
import { ArrowLeft, Inbox } from "lucide-react";
import type { RecentOrder } from "@/lib/admin-queries";
import { STATUS_AR } from "@/lib/admin-queries";

const STATUS_STYLES: Record<string, string> = {
  pending: "border-gold/30 bg-gold/15 text-gold-foreground",
  confirmed: "border-primary/30 bg-primary/15 text-foreground",
  delivered: "border-success/30 bg-success/15 text-emerald-300",
  cancelled: "border-destructive/30 bg-destructive/15 text-red-300",
};

export function RecentOrdersTable({ rows }: { rows: RecentOrder[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-gold/30">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black">آخر الطلبات</h3>
          {rows.length > 0 && (
            <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-black text-gold-foreground tabular-nums">
              {rows.length}
            </span>
          )}
        </div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-gold-foreground transition-colors hover:bg-gold/10"
        >
          عرض الكل <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold/15 to-transparent ring-1 ring-gold/25">
            <Inbox className="h-6 w-6 text-gold-foreground" />
          </div>
          <p className="text-sm text-zinc-400">لا توجد طلبات بعد</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-300">
                <th className="py-2 text-right font-bold">رقم الطلب</th>
                <th className="py-2 text-right font-bold">العميل</th>
                <th className="py-2 text-right font-bold">الإجمالي</th>
                <th className="py-2 text-right font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-gold/5"
                >
                  <td className="py-2.5 font-mono text-xs tabular-nums">{r.order_number}</td>
                  <td className="py-2.5">{r.customer_name}</td>
                  <td className="py-2.5 font-bold tabular-nums">{Number(r.total).toFixed(0)} ر.س</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[r.status] ?? "border-border bg-muted text-muted-foreground"}`}
                    >
                      {STATUS_AR[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
