CREATE POLICY "admin_can_read_coupons" ON public.coupons FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "admin_can_insert_coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_can_update_coupons" ON public.coupons FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_can_delete_coupons" ON public.coupons FOR DELETE TO authenticated USING (is_admin(auth.uid()));