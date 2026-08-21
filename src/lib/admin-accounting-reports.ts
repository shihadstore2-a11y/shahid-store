// Phase E.2.3 — Financial Reports helpers
// Period presets + query options + CSV builders.
// لا يلمس admin-accounting.ts (مستخدم كما هو).

import { queryOptions } from "@tanstack/react-query";
import {
  getKpiDashboard,
  getProductProfitability,
} from "@/lib/admin-accounting";
import type {
  KpiDashboard,
  ProductProfitabilityRow,
} from "@/types/accounting";

export type PeriodPreset =
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "ytd";

export const PERIOD_PRESETS: PeriodPreset[] = [
  "last7days",
  "last30days",
  "thisMonth",
  "lastMonth",
  "ytd",
];

export const PERIOD_LABELS_AR: Record<PeriodPreset, string> = {
  last7days: "آخر 7 أيام",
  last30days: "آخر 30 يوم",
  thisMonth: "هذا الشهر",
  lastMonth: "الشهر الماضي",
  ytd: "السنة حتى الآن",
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export function getCurrentPeriodRange(preset: PeriodPreset): {
  from: Date;
  to: Date;
} {
  const now = new Date();
  const to = endOfDay(now);

  switch (preset) {
    case "last7days": {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 6);
      return { from, to };
    }
    case "last30days": {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 29);
      return { from, to };
    }
    case "thisMonth": {
      const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { from, to };
    }
    case "lastMonth": {
      const from = startOfDay(
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
      );
      const toLast = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { from, to: toLast };
    }
    case "ytd": {
      const from = startOfDay(new Date(now.getFullYear(), 0, 1));
      return { from, to };
    }
  }
}

export function getPreviousPeriodRange(preset: PeriodPreset): {
  from: Date;
  to: Date;
} {
  const current = getCurrentPeriodRange(preset);
  const ms = current.to.getTime() - current.from.getTime();

  if (preset === "lastMonth") {
    const ref = current.from;
    const from = startOfDay(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
    const to = endOfDay(new Date(ref.getFullYear(), ref.getMonth(), 0));
    return { from, to };
  }
  if (preset === "thisMonth") {
    const now = new Date();
    const from = startOfDay(
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
    );
    const to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    return { from, to };
  }
  if (preset === "ytd") {
    const now = new Date();
    const from = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
    const to = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
    return { from, to };
  }

  const to = new Date(current.from.getTime() - 1);
  const from = new Date(to.getTime() - ms);
  return { from, to };
}

// ───────────── Query options ─────────────

export const kpiDashboardQueryOptions = (from: Date, to: Date) =>
  queryOptions({
    queryKey: ["admin", "accounting", "kpi-dashboard", from.toISOString(), to.toISOString()],
    queryFn: () => getKpiDashboard(from, to),
    staleTime: 60_000,
  });

export const productProfitabilityQueryOptions = (from: Date, to: Date) =>
  queryOptions({
    queryKey: [
      "admin",
      "accounting",
      "product-profitability",
      from.toISOString(),
      to.toISOString(),
    ],
    queryFn: () => getProductProfitability(from, to),
    staleTime: 60_000,
  });

// ───────────── CSV ─────────────

const csvEscape = (v: string | number | null | undefined): string => {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export function csvFromKpiDashboard(kpi: KpiDashboard, period: string): string {
  const lines: string[] = [];
  lines.push("التقرير المالي — شاهد ستور");
  lines.push(`الفترة,${csvEscape(period)}`);
  lines.push(`من,${csvEscape(kpi.period.from)}`);
  lines.push(`إلى,${csvEscape(kpi.period.to)}`);
  lines.push("");
  lines.push("المقياس,القيمة");
  lines.push(`الإيرادات (ر.س),${kpi.tier1.revenue}`);
  lines.push(`عدد الطلبات,${kpi.tier1.orders_count}`);
  lines.push(`الربح الإجمالي (ر.س),${kpi.tier1.gross_profit}`);
  lines.push(`صافي الربح (ر.س),${kpi.tier1.net_profit}`);
  lines.push(`هامش الربح الإجمالي %,${kpi.tier1.gross_margin_pct}`);
  lines.push(`التكاليف (ر.س),${kpi.tier2.cogs}`);
  lines.push(`رسوم الدفع (ر.س),${kpi.tier2.fees}`);
  lines.push(`المسترجعات (ر.س),${kpi.tier2.refunds}`);
  lines.push(`المصاريف (ر.س),${kpi.tier2.expenses}`);
  lines.push(`عدد العملاء,${kpi.tier2.customers_count}`);
  lines.push(`متوسط قيمة الطلب (ر.س),${kpi.tier2.aov}`);
  lines.push(`هامش الربح الصافي %,${kpi.tier2.net_margin_pct}`);
  return lines.join("\n");
}

export function csvFromProductProfitability(
  rows: ProductProfitabilityRow[],
): string {
  const lines: string[] = [];
  lines.push("ربحية المنتجات");
  lines.push("المنتج,Slug,عدد المبيعات,الإيرادات (ر.س),التكاليف (ر.س),الربح (ر.س),الهامش %");
  for (const r of rows) {
    const margin = r.revenue > 0 ? ((r.gross_profit / r.revenue) * 100).toFixed(2) : "0";
    lines.push(
      [
        csvEscape(r.name),
        csvEscape(r.slug),
        r.units_sold,
        r.revenue,
        r.cogs,
        r.gross_profit,
        margin,
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function downloadCSV(content: string, filename: string): void {
  // BOM لدعم Excel مع العربية
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}
