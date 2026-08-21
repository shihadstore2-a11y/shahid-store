CREATE POLICY "admin_can_update_orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_can_read_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));