import { useQueries } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { monthlyFinancialsQueryOptions } from "@/lib/admin-accounting";
import { formatSAR } from "@/lib/format";

const MONTH_LABELS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function getLast6Months() {
  const months: { year: number; month: number; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: MONTH_LABELS_AR[d.getMonth()],
    });
  }
  return months;
}

export function RevenueProfitChart() {
  const months = getLast6Months();

  const results = useQueries({
    queries: months.map(({ year, month }) =>
      monthlyFinancialsQueryOptions(year, month),
    ),
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gold/15 p-2">
            <TrendingUp className="h-4 w-4 text-gold" />
          </div>
          <h3 className="text-base font-black">الإيرادات والأرباح (آخر 6 أشهر)</h3>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[300px] w-full rounded-xl" />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertDescription>تعذّر تحميل بيانات المخطط.</AlertDescription>
        </Alert>
      ) : (
        <ChartBody
          data={months.map((m, i) => {
            const r = results[i].data;
            return {
              label: m.label,
              revenue: Number(r?.revenue ?? 0),
              net_profit: Number(r?.net_profit ?? 0),
            };
          })}
        />
      )}
    </div>
  );
}

function ChartBody({
  data,
}: {
  data: { label: string; revenue: number; net_profit: number }[];
}) {
  const allZero = data.every((d) => d.revenue === 0 && d.net_profit === 0);
  if (allZero) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-center">
        <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          بيانات غير كافية لعرض المخطط بعد.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          reversed
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)}
          orientation="right"
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatSAR(value),
            name === "revenue" ? "الإيرادات" : "صافي الربح",
          ]}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontFamily: "inherit",
          }}
        />
        <Legend
          formatter={(v) => (v === "revenue" ? "الإيرادات" : "صافي الربح")}
          wrapperStyle={{ paddingTop: 8 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#d4af37"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#d4af37" }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="net_profit"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#10b981" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
