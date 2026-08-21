DELETE FROM public.orders WHERE order_number LIKE 'TEST-CUST-%';
DELETE FROM public.order_rate_limits WHERE phone IN ('0512345678','0598765432');