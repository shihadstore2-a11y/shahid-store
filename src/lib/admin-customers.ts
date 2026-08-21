import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_VISIBLE_STATUSES } from "@/lib/admin-orders";
import type { AdminOrderRow, OrderItemJson } from "@/lib/admin-orders";

export type Customer = {
  customer_phone: string;
  customer_name: string;
  customer_email: string | null;
  order_count: number;
  total_spent: number;
  last_order_at: string;
  first_order_at: string;
};

export type CustomerSortBy =
  | "total_spent"
  | "last_order"
  | "order_count"
  | "first_order";

export type CustomerPeriod = "all" | "30d" | "90d";

export type CustomerFilters = {
  search?: string;
  sortBy?: CustomerSortBy;
  period?: CustomerPeriod;
};

export type CustomerStats = {
  totalCustomers: number;
  avgSpendPerCustomer: number;
  topCustomerName: string | null;
  topCustomerSpent: number;
  newCustomersThisMonth: number;
};

function periodSince(period: CustomerPeriod | undefined): string | null {
  if (!period || period === "all") return null;
  const d = new Date();
  if (period === "30d") d.setDate(d.getDate() - 30);
  if (period === "90d") d.setDate(d.getDate() - 90);
  return d.toISOString();
}

type OrderSlim = {
  customer_phone: string;
  customer_name: string;
  customer_email: string | null;
  total: number | string;
  created_at: string;
  status: string;
};

async function loadOrdersForAggregation(period?: CustomerPeriod): Promise<OrderSlim[]> {
  let q = supabase
    .from("orders")
    .select("customer_phone, customer_name, customer_email, total, created_at, status")
    .in("status", ADMIN_VISIBLE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(10000);
  const since = periodSince(period);
  if (since) q = q.gte("created_at", since);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as OrderSlim[];
}

function aggregate(rows: OrderSlim[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const r of rows) {
    if (!r.customer_phone) continue;
    const existing = map.get(r.customer_phone);
    const total = Number(r.total) || 0;
    if (existing) {
      existing.order_count += 1;
      existing.total_spent += total;
      if (r.created_at > existing.last_order_at) existing.last_order_at = r.created_at;
      if (r.created_at < existing.first_order_at) existing.first_order_at = r.created_at;
      if (!existing.customer_email && r.customer_email) existing.customer_email = r.customer_email;
    } else {
      map.set(r.customer_phone, {
        customer_phone: r.customer_phone,
        customer_name: r.customer_name || "—",
        customer_email: r.customer_email ?? null,
        order_count: 1,
        total_spent: total,
        last_order_at: r.created_at,
        first_order_at: r.created_at,
      });
    }
  }
  return Array.from(map.values());
}

export async function fetchAdminCustomers(filters: CustomerFilters): Promise<Customer[]> {
  const rows = await loadOrdersForAggregation(filters.period);
  let customers = aggregate(rows);

  const term = (filters.search ?? "").trim().toLowerCase();
  if (term) {
    customers = customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(term) ||
        c.customer_phone.includes(term),
    );
  }

  const sortBy = filters.sortBy ?? "total_spent";
  switch (sortBy) {
    case "total_spent":
      customers.sort((a, b) => b.total_spent - a.total_spent);
      break;
    case "last_order":
      customers.sort((a, b) => b.last_order_at.localeCompare(a.last_order_at));
      break;
    case "order_count":
      customers.sort((a, b) => b.order_count - a.order_count);
      break;
    case "first_order":
      customers.sort((a, b) => a.first_order_at.localeCompare(b.first_order_at));
      break;
  }
  return customers;
}

export async function fetchAdminCustomersStats(): Promise<CustomerStats> {
  const rows = await loadOrdersForAggregation("all");
  const customers = aggregate(rows);

  const totalCustomers = customers.length;
  const sumSpent = customers.reduce((a, c) => a + c.total_spent, 0);
  const avgSpendPerCustomer = totalCustomers ? sumSpent / totalCustomers : 0;

  let topName: string | null = null;
  let topSpent = 0;
  for (const c of customers) {
    if (c.total_spent > topSpent) {
      topSpent = c.total_spent;
      topName = c.customer_name;
    }
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const newCustomersThisMonth = customers.filter(
    (c) => c.first_order_at >= monthStart,
  ).length;

  return {
    totalCustomers,
    avgSpendPerCustomer,
    topCustomerName: topName,
    topCustomerSpent: topSpent,
    newCustomersThisMonth,
  };
}

export async function fetchCustomerOrders(phone: string): Promise<AdminOrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_phone", phone)
    .in("status", ADMIN_VISIBLE_STATUSES)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    items: Array.isArray(r.items) ? (r.items as OrderItemJson[]) : [],
  })) as AdminOrderRow[];
}

export const adminCustomersQueryOptions = (filters: CustomerFilters) =>
  queryOptions({
    queryKey: ["admin", "customers", "list", filters],
    queryFn: () => fetchAdminCustomers(filters),
    staleTime: 60_000,
  });

export const adminCustomersStatsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "customers", "stats"],
    queryFn: fetchAdminCustomersStats,
    staleTime: 60_000,
  });

export const customerOrdersQueryOptions = (phone: string) =>
  queryOptions({
    queryKey: ["admin", "customers", "orders", phone],
    queryFn: () => fetchCustomerOrders(phone),
    enabled: !!phone,
    staleTime: 30_000,
  });

export function waLink(phone: string): string {
  const p = phone.replace(/^0/, "966").replace(/\D/g, "");
  return `https://wa.me/${p}`;
}
