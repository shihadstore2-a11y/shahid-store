-- ════════════════════════════════════════════════════════════════
-- 🗑️ A.4 Pre-Cleanup — 23 May 2026
-- ════════════════════════════════════════════════════════════════
-- Author: PM Ahmed (via Lovable agent)
-- Deletes: 16 test orders + 16 payment_transactions
-- Protected (NOT deleted): LG-260522-9296 (production EdfaPay, 5 SAR),
--                          LG-260522-7901 (ثامر, 70 SAR),
--                          admin_audit_logs, SUMMER25 coupon
-- Restore snapshot (16 orders + 16 tx, full row values):
--   docs/snapshots/a4-pre-cleanup-2026-05-23.sql
-- Atomicity: Supabase wraps every migration in a single transaction;
--            any failure (including the safety assertions below) rolls
--            back the entire DELETE.
-- ════════════════════════════════════════════════════════════════

DELETE FROM public.payment_transactions
WHERE order_id IN (
  '8cb3d4ef-7d0c-40ed-9908-8cdd40248349','264d8e73-396e-4fea-ab81-bf8f9aac3eb1',
  '5c33cc17-7cdf-4ecc-a6b3-e3b1a1054bf9','f7b234d1-4680-44c9-a2b7-64ed672be3be',
  'e37b59e0-8ef6-4581-a082-9a5f19d9f834','00b912d8-4502-4b4f-a21c-0595d5857731',
  '7288a1de-e5b5-4928-9994-e4c9276efa32','697a8f6c-0552-4218-96e0-96806cc868be',
  'c1765ac2-f0dc-48a5-8f5a-d3be554b8764','4bd567ad-abb5-493e-b9fc-d552062802d0',
  'c21ba9e6-4fa5-47f4-bf35-483b3998a4ef','e80598ff-7a89-4b77-8080-d4a4417dc8b2',
  'd5302229-fd0d-4a07-a5dc-08753bc01142','c44eab18-1588-4613-8e65-b016cf168eac',
  '06e70464-dc59-449c-b390-4f66cb1c6509','9225b9dc-895a-4237-a9b0-39eb7263cbde'
);

DELETE FROM public.orders
WHERE id IN (
  '8cb3d4ef-7d0c-40ed-9908-8cdd40248349','264d8e73-396e-4fea-ab81-bf8f9aac3eb1',
  '5c33cc17-7cdf-4ecc-a6b3-e3b1a1054bf9','f7b234d1-4680-44c9-a2b7-64ed672be3be',
  'e37b59e0-8ef6-4581-a082-9a5f19d9f834','00b912d8-4502-4b4f-a21c-0595d5857731',
  '7288a1de-e5b5-4928-9994-e4c9276efa32','697a8f6c-0552-4218-96e0-96806cc868be',
  'c1765ac2-f0dc-48a5-8f5a-d3be554b8764','4bd567ad-abb5-493e-b9fc-d552062802d0',
  'c21ba9e6-4fa5-47f4-bf35-483b3998a4ef','e80598ff-7a89-4b77-8080-d4a4417dc8b2',
  'd5302229-fd0d-4a07-a5dc-08753bc01142','c44eab18-1588-4613-8e65-b016cf168eac',
  '06e70464-dc59-449c-b390-4f66cb1c6509','9225b9dc-895a-4237-a9b0-39eb7263cbde'
);

-- ════════════════════════════════════════════════════════════════
-- 🛡️ SAFETY ASSERTIONS — any RAISE EXCEPTION rolls back everything
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_9296 int; v_7901 int; v_remaining int; v_audit int;
BEGIN
  SELECT count(*) INTO v_9296 FROM public.orders WHERE order_number = 'LG-260522-9296';
  IF v_9296 <> 1 THEN RAISE EXCEPTION 'SAFETY FAIL: protected order 9296 missing'; END IF;

  SELECT count(*) INTO v_7901 FROM public.orders WHERE order_number = 'LG-260522-7901';
  IF v_7901 <> 1 THEN RAISE EXCEPTION 'SAFETY FAIL: protected order 7901 missing'; END IF;

  SELECT count(*) INTO v_remaining FROM public.orders WHERE id IN (
    '8cb3d4ef-7d0c-40ed-9908-8cdd40248349','264d8e73-396e-4fea-ab81-bf8f9aac3eb1',
    '5c33cc17-7cdf-4ecc-a6b3-e3b1a1054bf9','f7b234d1-4680-44c9-a2b7-64ed672be3be',
    'e37b59e0-8ef6-4581-a082-9a5f19d9f834','00b912d8-4502-4b4f-a21c-0595d5857731',
    '7288a1de-e5b5-4928-9994-e4c9276efa32','697a8f6c-0552-4218-96e0-96806cc868be',
    'c1765ac2-f0dc-48a5-8f5a-d3be554b8764','4bd567ad-abb5-493e-b9fc-d552062802d0',
    'c21ba9e6-4fa5-47f4-bf35-483b3998a4ef','e80598ff-7a89-4b77-8080-d4a4417dc8b2',
    'd5302229-fd0d-4a07-a5dc-08753bc01142','c44eab18-1588-4613-8e65-b016cf168eac',
    '06e70464-dc59-449c-b390-4f66cb1c6509','9225b9dc-895a-4237-a9b0-39eb7263cbde'
  );
  IF v_remaining <> 0 THEN
    RAISE EXCEPTION 'SAFETY FAIL: % of the 16 target IDs still present after DELETE', v_remaining;
  END IF;

  SELECT count(*) INTO v_audit FROM public.admin_audit_logs;
  RAISE NOTICE 'A.4 OK — 9296 alive, 7901 alive, 16 test orders gone, admin_audit_logs=%', v_audit;
END$$;