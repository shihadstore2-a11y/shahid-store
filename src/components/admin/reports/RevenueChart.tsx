import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatSAR } from "@/lib/format";
import {
  dailyRevenueQueryOptions,
  rangeLabel,
  type ReportFilters,
} from "@/lib/admin-reports";

export function RevenueChart({ filters }: { filters: ReportFilters }) {
  const { data, isLoading } = useQuery(dailyRevenueQueryOptions(filters));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-1 flex items-end justify-between">
        <div>
          <h3 className="text-lg font-black">الإيرادات اليومية</h3>
          <p className="text-xs text-muted-foreground">{rangeLabel(filters)}</p>
        </div>
      </div>

      <div className="mt-4 h-72">
        {isLoading ? (
          <div className="h-full animate-pulse rounded-xl bg-muted" />
        ) : !data || data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(new Date(d), "d MMM", { locale: ar })}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                width={50}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
                formatter={(v: number) => [formatSAR(v), "الإيرادات"]}
                labelFormatter={(d) =>
                  format(new Date(d as string), "d MMMM yyyy", { locale: ar })
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#goldFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="text-sm font-bold text-muted-foreground">
        لا توجد إيرادات في هذه الفترة
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        سيظهر الرسم البياني فور وصول أول طلب
      </p>
    </div>
  );
}
