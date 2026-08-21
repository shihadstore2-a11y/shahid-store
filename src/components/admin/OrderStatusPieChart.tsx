import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { StatusSlice } from "@/lib/admin-queries";

const COLORS = ["var(--gold)", "var(--primary-light)", "var(--success)", "var(--destructive)"];

export function OrderStatusPieChart({ data }: { data: StatusSlice[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        لا توجد بيانات بعد
      </div>
    );
  }
  const total = data.reduce((acc, s) => acc + Number(s.value || 0), 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={3}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "var(--shadow-card)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="text-[11px] font-bold text-muted-foreground">الإجمالي</span>
        <span className="text-2xl font-black tabular-nums text-foreground">{total}</span>
      </div>
    </div>
  );
}
