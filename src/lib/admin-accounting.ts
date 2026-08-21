// Phase E — Admin Accounting client (B.3 + E.2.1)
// طبقة استدعاء RPCs المحاسبية + queries لإدارة COGS.
// كل الدوال هنا تتطلب أدمن مسجّل (الفحص داخل الـ RPC أو RLS).

import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  CostHistoryEntry,
  Expense,
  ExpenseCreate,
  ExpenseFilters,
  ExpenseUpdate,
  FinancialPeriod,
  KpiDashboard,
  MonthlyFinancials,
  ProductProfitabilityRow,
  ProductWithCost,
} from '@/types/accounting';

/** تكلفة منتج عند تاريخ محدد (افتراضياً الآن). */
export async function getProductCostAt(slug: string, at?: Date): Promise<number> {
  const { data, error } = await supabase.rpc('get_product_cost_at', {
    _slug: slug,
    _at: (at ?? new Date()).toISOString(),
  });
  if (error) throw error;
  return Number(data ?? 0);
}

/** تحديث تكلفة منتج (يقفل النسخة السابقة + يسجّل في الـ audit log). */
export async function setProductCost(
  slug: string,
  newCost: number,
  note?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('set_product_cost', {
    _slug: slug,
    _new_cost: newCost,
    _note: note,
  });
  if (error) throw error;
  return data as string;
}

/** KPIs مالية شهرية. */
export async function getMonthlyFinancials(
  year: number,
  month: number,
): Promise<MonthlyFinancials> {
  const { data, error } = await supabase.rpc('get_monthly_financials', {
    _year: year,
    _month: month,
  });
  if (error) throw error;
  return data as unknown as MonthlyFinancials;
}

/** لوحة KPI شاملة لفترة (Tier 1+2). */
export async function getKpiDashboard(from: Date, to: Date): Promise<KpiDashboard> {
  const { data, error } = await supabase.rpc('get_kpi_dashboard', {
    _from: from.toISOString(),
    _to: to.toISOString(),
  });
  if (error) throw error;
  return data as unknown as KpiDashboard;
}

/** ربحية كل منتج خلال فترة. */
export async function getProductProfitability(
  from: Date,
  to: Date,
): Promise<ProductProfitabilityRow[]> {
  const { data, error } = await supabase.rpc('get_product_profitability', {
    _from: from.toISOString(),
    _to: to.toISOString(),
  });
  if (error) throw error;
  return (data as unknown as ProductProfitabilityRow[]) ?? [];
}

/** إقفال فترة مالية (super_admin فقط). */
export async function closeFinancialPeriod(year: number, month: number): Promise<string> {
  const { data, error } = await supabase.rpc('close_financial_period', {
    _year: year,
    _month: month,
  });
  if (error) throw error;
  return data as string;
}

// ─────────────────────────────────────────────
// E.2.1 — COGS Management (UI helpers)
// ─────────────────────────────────────────────

/** يجلب المنتجات النشطة + التكلفة الفعّالة الحالية لكل واحد (JS join). */
export async function fetchProductsWithCosts(): Promise<ProductWithCost[]> {
  const [productsRes, costsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, slug, name_ar, base_price, sale_price, sort_order')
      .eq('is_active', true)
      .neq('slug', 'edfa-test')
      .order('sort_order', { ascending: true }),
    supabase
      .from('product_costs')
      .select('id, product_slug, unit_cost, effective_from, updated_at')
      .is('effective_to', null),
  ]);

  if (productsRes.error) throw new Error(productsRes.error.message);
  if (costsRes.error) throw new Error(costsRes.error.message);

  const costBySlug = new Map(
    (costsRes.data ?? []).map((c) => [
      c.product_slug,
      {
        id: c.id,
        unit_cost: Number(c.unit_cost),
        effective_from: c.effective_from,
        updated_at: c.updated_at,
      },
    ]),
  );

  return (productsRes.data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name_ar: p.name_ar,
    base_price: Number(p.base_price),
    sale_price: p.sale_price == null ? null : Number(p.sale_price),
    sort_order: p.sort_order,
    current_cost: costBySlug.get(p.slug) ?? null,
  }));
}

export const productCostsWithProductsQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'accounting', 'product-costs'],
    queryFn: () => fetchProductsWithCosts(),
    staleTime: 60_000,
  });

/** سجل التكاليف التاريخي لمنتج (آخر N تغيير). */
export async function fetchCostHistory(
  slug: string,
  limit = 5,
): Promise<CostHistoryEntry[]> {
  const { data, error } = await supabase
    .from('product_costs')
    .select('id, unit_cost, effective_from, effective_to, note, created_by')
    .eq('product_slug', slug)
    .order('effective_from', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    unit_cost: Number(r.unit_cost),
    effective_from: r.effective_from,
    effective_to: r.effective_to,
    note: r.note,
    created_by: r.created_by,
  }));
}

export const costHistoryQueryOptions = (slug: string | null, limit = 5) =>
  queryOptions({
    queryKey: ['admin', 'accounting', 'cost-history', slug, limit],
    queryFn: () => (slug ? fetchCostHistory(slug, limit) : Promise.resolve([])),
    enabled: !!slug,
    staleTime: 30_000,
  });

// ─────────────────────────────────────────────
// E.2.4 — Period Closing (UI helpers)
// ─────────────────────────────────────────────

export async function fetchAllPeriods(): Promise<FinancialPeriod[]> {
  const { data, error } = await supabase
    .from('financial_periods')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FinancialPeriod[];
}

export const financialPeriodsQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'accounting', 'financial-periods'],
    queryFn: () => fetchAllPeriods(),
    staleTime: 30_000,
  });

export const monthlyFinancialsQueryOptions = (year: number, month: number) =>
  queryOptions({
    queryKey: ['admin', 'accounting', 'monthly-financials', year, month],
    queryFn: () => getMonthlyFinancials(year, month),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: !!(year && month),
  });

// ─────────────────────────────────────────────
// E.2.2 — Expenses (CRUD)
// ─────────────────────────────────────────────

export async function fetchExpenses(filters: ExpenseFilters): Promise<Expense[]> {
  let q = supabase
    .from('expenses')
    .select('id, category, description, amount, currency, expense_date, receipt_url, created_by, created_at, updated_at')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.dateFrom) q = q.gte('expense_date', filters.dateFrom);
  if (filters.dateTo) q = q.lte('expense_date', filters.dateTo);
  if (filters.category && filters.category !== 'all') {
    q = q.eq('category', filters.category);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    ...r,
    amount: Number(r.amount),
  })) as Expense[];
}

export const expensesQueryOptions = (filters: ExpenseFilters) =>
  queryOptions({
    queryKey: ['admin', 'accounting', 'expenses', filters],
    queryFn: () => fetchExpenses(filters),
    staleTime: 60_000,
  });

export async function createExpense(input: ExpenseCreate): Promise<Expense> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id ?? null;

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      category: input.category,
      description: input.description.trim(),
      amount: input.amount,
      currency: 'SAR',
      expense_date: input.expense_date,
      receipt_url: input.receipt_url?.trim() || null,
      created_by: uid,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { ...data, amount: Number(data.amount) } as Expense;
}

export async function updateExpense(id: string, patch: ExpenseUpdate): Promise<Expense> {
  const payload: {
    category?: ExpenseUpdate['category'];
    description?: string;
    amount?: number;
    expense_date?: string;
    receipt_url?: string | null;
  } = {};
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.description !== undefined) payload.description = patch.description.trim();
  if (patch.amount !== undefined) payload.amount = patch.amount;
  if (patch.expense_date !== undefined) payload.expense_date = patch.expense_date;
  if (patch.receipt_url !== undefined) {
    payload.receipt_url = patch.receipt_url?.trim() || null;
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { ...data, amount: Number(data.amount) } as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}



