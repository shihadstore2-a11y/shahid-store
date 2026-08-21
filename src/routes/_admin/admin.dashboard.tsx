import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingBag, UserPlus, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/admin/KpiCard";
import { SalesLineChart } from "@/components/admin/SalesLineChart";
import { OrderStatusPieChart } from "@/components/admin/OrderStatusPieChart";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { TopProductsList } from "@/components/admin/TopProductsList";
import {
  fetchDashboardKpis,
  fetchSalesLast30Days,
  fetchOrderStatusBreakdown,
  fetchRecentOrders,
  fetchTopProducts,
} from "@/lib/admin-queries";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const kpis = useQuery({ queryKey: ["admin", "kpis"], queryFn: fetchDashboardKpis });
  const sales = useQuery({ queryKey: ["admin", "sales-30d"], queryFn: fetchSalesLast30Days });
  const status = useQuery({ queryKey: ["admin", "status"], queryFn: fetchOrderStatusBreakdown });
  const recent = useQuery({ queryKey: ["admin", "recent-orders"], queryFn: () => fetchRecentOrders(5) });
  const top = useQuery({ queryKey: ["admin", "top-products"], queryFn: () => fetchTopProducts(5) });

  const k = kpis.data;

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="مبيعات اليوم"
          value={`${(k?.salesToday ?? 0).toFixed(0)} ر.س`}
          hint="مقارنة بالأمس"
          current={k?.salesToday ?? 0}
          previous={k?.salesYesterday ?? 0}
          Icon={DollarSign}
          iconBg="bg-success"
        />
        <KpiCard
          title="طلبات اليوم"
          value={`${k?.ordersToday ?? 0}`}
          hint="مقارنة بالأمس"
          current={k?.ordersToday ?? 0}
          previous={k?.ordersYesterday ?? 0}
          Icon={ShoppingBag}
          iconBg="bg-primary"
        />
        <KpiCard
          title="عملاء بطلبات مكتملة اليوم"
          value={`${k?.customersToday ?? 0}`}
          hint="مقارنة بالأمس"
          current={k?.customersToday ?? 0}
          previous={k?.customersYesterday ?? 0}
          Icon={UserPlus}
          iconBg="bg-[oklch(0.55_0.18_295)]"
        />
        <KpiCard
          title="متوسط قيمة الطلب"
          value={`${(k?.aovMonth ?? 0).toFixed(0)} ر.س`}
          hint="vs الشهر الماضي"
          current={k?.aovMonth ?? 0}
          previous={k?.aovPrevMonth ?? 0}
          Icon={TrendingUp}
          iconBg="bg-[var(--gold)]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-base font-black">المبيعات — آخر 30 يوماً</h3>
          {sales.data ? <SalesLineChart data={sales.data} /> : <Skeleton />}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-base font-black">حالات الطلبات</h3>
          {status.data ? <OrderStatusPieChart data={status.data} /> : <Skeleton />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrdersTable rows={recent.data ?? []} />
        <TopProductsList items={top.data ?? []} />
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="admin-shimmer h-[260px] rounded-lg" />;
}
