-- Migration: orders_owner_insert (28 May 2026)
-- ─────────────────────────────────────────────────────────────────────────────
-- السبب الجذري:
--   بعد Option A (Checkout-Time Account Creation)، أصبح إدراج الطلب يُمرّر
--   user_id = auth.uid() للمستخدم المسجّل (checkout.$slug.tsx:489).
--   لكن سياسة INSERT الوحيدة الموجودة (orders_anon_insert) تشترط
--   user_id IS NULL — لذا الإدراج بـ user_id غير فارغ كان يُرفَض بـ RLS،
--   فيظهر "تعذّر إنشاء الطلب الآن" / "لم يتم إرسال الطلب".
--
-- الإصلاح:
--   إضافة سياسة INSERT للمستخدمين المسجّلين تسمح بإدراج طلب بـ user_id = auth.uid()
--   بنفس حُرّاس التحقق الموجودة في orders_anon_insert (الاسم/الجوال/المبلغ/العناصر/الحالة/طريقة الدفع).
--
-- لا يُمسّ:
--   • orders_anon_insert (زوّار WhatsApp بدون حساب) — تبقى كما هي.
--   • EdfaPay code/keys/webhook.
--   • claim_orders RPCs.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY orders_owner_insert ON public.orders
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND customer_name IS NOT NULL
  AND length(btrim(customer_name)) >= 2 AND length(customer_name) <= 120
  AND customer_phone IS NOT NULL
  AND customer_phone ~ '^(\+[1-9][0-9]{6,14}|05[0-9]{8})$'
  AND total > 0 AND total <= 10000
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) >= 1 AND jsonb_array_length(items) <= 20
  AND status = 'pending'
  AND payment_method = ANY (ARRAY['whatsapp','card'])
);

-- التحقق بعد التطبيق (مؤكَّد ✅):
--   orders_anon_insert  | a | {authenticated,anon}   ← زوّار
--   orders_owner_insert | a | {authenticated}        ← مسجّلون (جديد)
