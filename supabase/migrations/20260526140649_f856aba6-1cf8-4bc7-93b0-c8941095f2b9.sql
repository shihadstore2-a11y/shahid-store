
REVOKE EXECUTE ON FUNCTION public.get_product_cost_at(text, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_product_cost(text, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_monthly_financials(int, int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_kpi_dashboard(timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_product_profitability(timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.close_financial_period(int, int) FROM PUBLIC, anon;
