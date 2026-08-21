import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SalesPoint } from "@/lib/admin-queries";

export function SalesLineChart({ data }: { data: SalesPoint[] }) {
  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sales-gold-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.18} />
        <XAxis dataKey="date" tickFormatter={fmt} fontSize={11} stroke="currentColor" opacity={0.5} />
        <YAxis fontSize={11} stroke="currentColor" opacity={0.5} width={40} />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
            boxShadow: "var(--shadow-card)",
          }}
          labelFormatter={(l) => `تاريخ: ${l}`}
          formatter={(v: number) => [`${v.toFixed(0)} ر.س`, "المبيعات"]}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--gold)"
          strokeWidth={3}
          fill="url(#sales-gold-fill)"
          dot={false}
          activeDot={{ r: 5, fill: "var(--gold)", stroke: "var(--card)", strokeWidth: 2 }}
          style={{ filter: "drop-shadow(0 2px 6px oklch(0.78 0.16 85 / 0.35))" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
