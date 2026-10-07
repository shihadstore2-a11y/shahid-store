-- ===================================================================
-- 🛡️ سياسات الأمان والصلاحيات الدقيقة لمتجر شاهد (Role-Based RLS Policies)
-- مشروع: https://umozikpkfmjkcglizysd.supabase.co
-- ===================================================================

-- 1️⃣ دالة مساعدة سريعة وآمنة للتحقق من رتبة المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_current_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- 2️⃣ سياسات المنتجات (Products)
DROP POLICY IF EXISTS "admin_full_access_products" ON public.products;
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;

-- القراءة متاحة للجميع (العملاء والزوار والمشرفين)
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);

-- الإضافة والتعديل: المدير العام ومدير المتجر فقط (super_admin, admin)
CREATE POLICY "products_admin_insert" ON public.products FOR INSERT WITH CHECK (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);
CREATE POLICY "products_admin_update" ON public.products FOR UPDATE USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);

-- الحذف: المدير العام فقط (ثامر - super_admin) منعاً للحذف بالخطأ
CREATE POLICY "products_admin_delete" ON public.products FOR DELETE USING (
  public.get_current_admin_role() = 'super_admin'
);


-- 3️⃣ سياسات التصنيفات (Categories)
DROP POLICY IF EXISTS "admin_full_access_categories" ON public.categories;
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;

CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR INSERT WITH CHECK (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);
CREATE POLICY "categories_admin_update" ON public.categories FOR UPDATE USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);
CREATE POLICY "categories_admin_delete" ON public.categories FOR DELETE USING (
  public.get_current_admin_role() = 'super_admin'
);


-- 4️⃣ سياسات الطلبات (Orders)
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select" ON public.orders;
DROP POLICY IF EXISTS "admin_full_access_orders" ON public.orders;
DROP POLICY IF EXISTS "orders_staff_update" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;

-- إنشاء الطلبات: متاح للجميع (العملاء كـ Guest أو بعد التسجيل)
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT WITH CHECK (true);

-- قراءة الطلبات: العميل يرى طلباته الخاصة، وفريق الإدارة يرى جميع الطلبات
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT USING (
  auth.uid() = user_id 
  OR user_id IS NULL 
  OR public.get_current_admin_role() IS NOT NULL
);

-- تعديل الطلبات (تحديث الحالة وإرسال بيانات التفعيل): متاح للمدير والموظفين
CREATE POLICY "orders_staff_update" ON public.orders FOR UPDATE USING (
  public.get_current_admin_role() IN ('super_admin', 'admin', 'staff')
);

-- حذف الطلبات: متاح حصرياً للمدير العام (super_admin) منعاً للتلاعب المالي
CREATE POLICY "orders_admin_delete" ON public.orders FOR DELETE USING (
  public.get_current_admin_role() = 'super_admin'
);


-- 5️⃣ سياسات الكوبونات (Coupons)
DROP POLICY IF EXISTS "admin_full_access_coupons" ON public.coupons;
DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_manage" ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_delete" ON public.coupons;

CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT USING (is_active = true OR public.get_current_admin_role() IS NOT NULL);
CREATE POLICY "coupons_admin_manage" ON public.coupons FOR INSERT WITH CHECK (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);
CREATE POLICY "coupons_admin_update" ON public.coupons FOR UPDATE USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);
CREATE POLICY "coupons_admin_delete" ON public.coupons FOR DELETE USING (
  public.get_current_admin_role() = 'super_admin'
);


-- 6️⃣ سياسات جدول المشرفين (admin_users)
DROP POLICY IF EXISTS "admin_users_read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_manage" ON public.admin_users;

-- القراءة: متاح للمشرفين لمعرفة صلاحياتهم
CREATE POLICY "admin_users_read" ON public.admin_users FOR SELECT USING (
  public.get_current_admin_role() IS NOT NULL
);

-- الإضافة والتعديل والحذف: متاح حصرياً للمدير العام (ثامر - super_admin)
CREATE POLICY "admin_users_manage_insert" ON public.admin_users FOR INSERT WITH CHECK (
  public.get_current_admin_role() = 'super_admin'
);
CREATE POLICY "admin_users_manage_update" ON public.admin_users FOR UPDATE USING (
  public.get_current_admin_role() = 'super_admin'
);
CREATE POLICY "admin_users_manage_delete" ON public.admin_users FOR DELETE USING (
  public.get_current_admin_role() = 'super_admin'
);

-- 7️⃣ سياسات المصروفات (Expenses)
DROP POLICY IF EXISTS "admin_full_access_expenses" ON public.expenses;
CREATE POLICY "expenses_admin_select" ON public.expenses FOR SELECT USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);
CREATE POLICY "expenses_admin_insert" ON public.expenses FOR INSERT WITH CHECK (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);
CREATE POLICY "expenses_admin_delete" ON public.expenses FOR DELETE USING (
  public.get_current_admin_role() = 'super_admin'
);
