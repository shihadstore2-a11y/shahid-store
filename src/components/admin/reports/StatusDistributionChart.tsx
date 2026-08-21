import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import {
  statusDistributionQueryOptions,
  type ReportFilters,
} from "@/lib/admin-reports";

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--muted-foreground)",
  confirmed: "var(--primary)",
  processing: "var(--accent)",
  delivered: "var(--success)",
  cancelled: "var(--destructive)",
};

export function StatusDistributionChart({ filters }: { filters: ReportFilters }) {
  const { data, isLoading } = useQuery(statusDistributionQueryOptions(filters));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-1">
        <h3 className="text-lg font-black">توزيع حالات الطلبات</h3>
        <p className="text-xs text-muted-foreground">حسب الحالة الحالية</p>
      </div>

      <div className="mt-4 h-64">
        {isLoading ? (
          <div className="h-full animate-pulse rounded-xl bg-muted" />
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? "var(--muted-foreground)"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => <span className="text-foreground">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <PieIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-bold text-muted-foreground">
        لا توجد حالات للعرض
      </p>
    </div>
  );
}
