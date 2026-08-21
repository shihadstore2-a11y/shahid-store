-- إضافة دالة can_modify_data: تستثني دور orders_coupons_viewer من التعديل
CREATE OR REPLACE FUNCTION public.can_modify_data(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND is_active = true
      AND role IN ('super_admin','admin','developer','staff')
  );
$$;

-- ── coupons: قراءة للمشاهد، تعديل للدوار المعدِّلة فقط ──
DROP POLICY IF EXISTS admin_can_insert_coupons ON public.coupons;
DROP POLICY IF EXISTS admin_can_update_coupons ON public.coupons;
DROP POLICY IF EXISTS admin_can_delete_coupons ON public.coupons;

CREATE POLICY admin_can_insert_coupons ON public.coupons
  FOR INSERT TO authenticated
  WITH CHECK (public.can_modify_data(auth.uid()));

CREATE POLICY admin_can_update_coupons ON public.coupons
  FOR UPDATE TO authenticated
  USING (public.can_modify_data(auth.uid()))
  WITH CHECK (public.can_modify_data(auth.uid()));

CREATE POLICY admin_can_delete_coupons ON public.coupons
  FOR DELETE TO authenticated
  USING (public.can_modify_data(auth.uid()));

-- ── orders: التعديل للدوار المعدِّلة فقط ──
DROP POLICY IF EXISTS admin_can_update_orders ON public.orders;

CREATE POLICY admin_can_update_orders ON public.orders
  FOR UPDATE TO authenticated
  USING (public.can_modify_data(auth.uid()))
  WITH CHECK (public.can_modify_data(auth.uid()));

-- ── products: تعديل المنتجات للدوار المعدِّلة فقط ──
DROP POLICY IF EXISTS admin_can_update_products ON public.products;

CREATE POLICY admin_can_update_products ON public.products
  FOR UPDATE TO authenticated
  USING (public.can_modify_data(auth.uid()))
  WITH CHECK (public.can_modify_data(auth.uid()));