// Phase E — Accounting types (B.3)
// تعريفات TypeScript للوحة المحاسبة والـ KPIs

export interface MonthlyFinancials {
  year: number;
  month: number;
  period_start: string;
  period_end: string;
  orders_count: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  fees: number;
  refunds: number;
  expenses: number;
  net_profit: number;
  gross_margin_pct: number;
  net_margin_pct: number;
}

export interface KpiTier1 {
  revenue: number;
  orders_count: number;
  gross_profit: number;
  net_profit: number;
  gross_margin_pct: number;
}

export interface KpiTier2 {
  cogs: number;
  fees: number;
  refunds: number;
  expenses: number;
  customers_count: number;
  aov: number;
  net_margin_pct: number;
}

export interface KpiDashboard {
  period: { from: string; to: string };
  tier1: KpiTier1;
  tier2: KpiTier2;
}

export interface ProductProfitabilityRow {
  slug: string;
  name: string;
  units_sold: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
}

export interface ProductCost {
  id: string;
  product_slug: string;
  unit_cost: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ───────────── E.2.2 — Expenses ─────────────

export const EXPENSE_CATEGORIES = {
  marketing: 'تسويق',
  tools: 'أدوات',
  salaries: 'رواتب',
  hosting: 'استضافة',
  support: 'دعم',
  legal: 'قانوني',
  other: 'أخرى',
} as const;

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES;

export const EXPENSE_CATEGORY_KEYS = Object.keys(
  EXPENSE_CATEGORIES,
) as ExpenseCategory[];

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expense_date: string; // YYYY-MM-DD
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  receipt_url?: string | null;
}

export type ExpenseUpdate = Partial<ExpenseCreate>;

export interface ExpenseFilters {
  dateFrom?: string; // YYYY-MM-DD inclusive
  dateTo?: string;   // YYYY-MM-DD inclusive
  category?: ExpenseCategory | 'all';
}

export interface ExpensesStats {
  total: number;
  count: number;
  topCategory: { key: ExpenseCategory; amount: number } | null;
  average: number;
}

export interface Refund {
  id: string;
  order_id: string;
  amount: number;
  reason: string | null;
  refunded_at: string;
  created_by: string | null;
  created_at: string;
}

export interface PaymentFee {
  id: string;
  order_id: string;
  payment_transaction_id: string | null;
  provider: string;
  fee_amount: number;
  fee_percent: number | null;
  created_at: string;
}

export type PeriodStatus = 'open' | 'closed' | 'locked';

export interface FinancialPeriod {
  id: string;
  year: number;
  month: number;
  status: PeriodStatus;
  snapshot: MonthlyFinancials | null;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ───────────── E.2.1 — COGS UI ─────────────

export interface CurrentProductCost {
  id: string;
  unit_cost: number;
  effective_from: string;
  updated_at: string;
}

export interface ProductWithCost {
  id: string;
  slug: string;
  name_ar: string;
  base_price: number;
  sale_price: number | null;
  sort_order: number;
  current_cost: CurrentProductCost | null;
}

export interface CostHistoryEntry {
  id: string;
  unit_cost: number;
  effective_from: string;
  effective_to: string | null;
  note: string | null;
  created_by: string | null;
}

export interface ProductCostUpdate {
  slug: string;
  newCost: number;
  note?: string | null;
}

