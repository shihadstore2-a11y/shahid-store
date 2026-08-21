
DO $$
DECLARE
  test_emails text[] := ARRAY[
    'saalla012@gmail.com',
    'elbhery878@gmail.com',
    'ahmedtest-h4-1@test.com',
    'ahmedtest-h4-2@test.com',
    'ahmedtest-h4-3@test.com',
    '+h1test@gmail.com',
    'iiithamern18@gmail.com'
  ];
  test_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO test_ids FROM auth.users WHERE email = ANY(test_emails);

  DELETE FROM public.payment_transactions WHERE order_id IN (SELECT id FROM public.orders WHERE user_id = ANY(test_ids) OR customer_email = ANY(test_emails));
  DELETE FROM public.orders WHERE user_id = ANY(test_ids) OR customer_email = ANY(test_emails);
  DELETE FROM public.profiles WHERE user_id = ANY(test_ids) OR email = ANY(test_emails);
  DELETE FROM auth.users WHERE id = ANY(test_ids);
END $$;
