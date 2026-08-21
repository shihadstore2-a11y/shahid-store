import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, Users, Database } from "lucide-react";
import { systemCountsQueryOptions } from "@/lib/admin-settings";

export function SystemInfo() {
  const { data, isLoading } = useQuery(systemCountsQueryOptions());

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-black">معلومات النظام</h3>
      </div>
      <dl className="space-y-3 text-sm">
        <Row label="إصدار التطبيق" value="v1.0.0" />
        <Row
          icon={<Package className="h-4 w-4" />}
          label="عدد المنتجات النشطة"
          value={isLoading ? "…" : String(data?.products ?? 0)}
        />
        <Row
          icon={<ShoppingCart className="h-4 w-4" />}
          label="إجمالي الطلبات"
          value={isLoading ? "…" : String(data?.orders ?? 0)}
        />
        <Row
          icon={<Users className="h-4 w-4" />}
          label="عدد العملاء المسجّلين"
          value={isLoading ? "…" : String(data?.customers ?? 0)}
        />
        <Row
          icon={<Database className="h-4 w-4" />}
          label="النسخ الاحتياطية"
          value="تلقائية يومياً"
        />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon ? <span className="text-accent">{icon}</span> : null}
        {label}
      </dt>
      <dd className="font-black">{value}</dd>
    </div>
  );
}
