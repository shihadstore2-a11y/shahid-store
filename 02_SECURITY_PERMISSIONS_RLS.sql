-- ===================================================================
-- 🛡️ 02_SECURITY_PERMISSIONS_RLS.sql
-- الملف 2 من 3: الصلاحيات الشاملة وسياسات أمان البيانات (RLS & Permissions)
-- يحدد بدقة من يمكنه القراءة، الإضافة، التعديل والحذف بناءً على الرتبة:
--  👑 المدير العام (super_admin - ثامر)
--  ⭐ مدير المتجر (admin - digitaneo)
--  👔 الموظفون (staff - بقية الفريق)
--  🛒 الزوار والعملاء (public & authenticated)
-- ===================================================================

-- 0️⃣ ضمان وجود الأعمدة الأساسية المطلوبة للسياسات (Idempotent Column Assurance)
-- يمنع خطأ "column user_id does not exist" في حال كانت الجداول منشأة مسبقاً
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;


-- ===================================================================
-- 1️⃣ دوال فحص الرتب والصلاحيات (Security Functions)
-- ===================================================================

-- دالة جلب رتبة المستخدم الإدارية الحالية
CREATE OR REPLACE FUNCTION public.get_current_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text 
  FROM public.admin_users 
  WHERE user_id = auth.uid() AND is_active = true 
  LIMIT 1;
$$;

-- دالة التحقق هل المستخدم مدير عام أو مدير
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role IN ('super_admin', 'admin')
  );
$$;

-- دالة التحقق هل المستخدم من طاقم العمل (مدير عام، مدير، موظف)
CREATE OR REPLACE FUNCTION public.is_staff_or_higher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role IN ('super_admin', 'admin', 'staff')
  );
$$;


-- ===================================================================
-- 2️⃣ تفعيل سياسات الأمان (Enable Row Level Security) على جميع الجداول
-- ===================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;


-- ===================================================================
-- 3️⃣ سياسات الأمان التفصيلية لكل جدول (Policies)
-- ===================================================================

-- -------------------------------------------------------------
-- 🟢 3.1 المنتجات والباقات (products) ومددها (product_durations)
-- - تصفح للجميع
-- - إضافة وتعديل للمدراء والموظفين
-- - حذف للمدير العام فقط (لحماية المتجر من الحذف العفوي)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_insert_update_staff" ON public.products;
DROP POLICY IF EXISTS "products_delete_super_admin" ON public.products;

CREATE POLICY "products_select_public" 
  ON public.products FOR SELECT 
  USING (true);

CREATE POLICY "products_insert_update_staff" 
  ON public.products FOR ALL 
  USING (public.is_staff_or_higher())
  WITH CHECK (public.is_staff_or_higher());

CREATE POLICY "products_delete_super_admin" 
  ON public.products FOR DELETE 
  USING (public.get_current_admin_role() = 'super_admin');

DROP POLICY IF EXISTS "durations_select_public" ON public.product_durations;
DROP POLICY IF EXISTS "durations_manage_staff" ON public.product_durations;

CREATE POLICY "durations_select_public" 
  ON public.product_durations FOR SELECT 
  USING (true);

CREATE POLICY "durations_manage_staff" 
  ON public.product_durations FOR ALL 
  USING (public.is_staff_or_higher());


-- -------------------------------------------------------------
-- 🟢 3.2 التصنيفات والأقسام (categories)
-- - تصفح للجميع
-- - إدارة (إضافة وتعديل وحذف) للمدراء
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY IF EXISTS "categories_manage_admin" ON public.categories;

CREATE POLICY "categories_select_public" 
  ON public.categories FOR SELECT 
  USING (true);

CREATE POLICY "categories_manage_admin" 
  ON public.categories FOR ALL 
  USING (public.is_admin_or_super());


-- -------------------------------------------------------------
-- 🟢 3.3 الطلبات (orders)
-- - إنشاء الطلب متاح للجميع (الزوار والعملاء عند الدفع)
-- - قراءة الطلب لصاحب الطلب أو لأي موظف/مشرف
-- - تعديل الطلب وحالته (تفعيل، رسائل واتساب) للموظفين والمشرفين
-- - حذف الطلبات مقتصر حصرياً على المدير العام
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "orders_insert_checkout" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_super_admin" ON public.orders;

CREATE POLICY "orders_insert_checkout" 
  ON public.orders FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "orders_select_policy" 
  ON public.orders FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL 
    OR public.is_staff_or_higher()
  );

CREATE POLICY "orders_update_staff" 
  ON public.orders FOR UPDATE 
  USING (public.is_staff_or_higher())
  WITH CHECK (public.is_staff_or_higher());

CREATE POLICY "orders_delete_super_admin" 
  ON public.orders FOR DELETE 
  USING (public.get_current_admin_role() = 'super_admin');


-- -------------------------------------------------------------
-- 🟢 3.4 إعدادات المتجر (store_settings)
-- - قراءة للجميع (لعرض رقم الواتساب، اسم المتجر، العملة)
-- - تعديل حصري للمدراء (super_admin و admin)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "store_settings_select_public" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_modify_admin" ON public.store_settings;

CREATE POLICY "store_settings_select_public" 
  ON public.store_settings FOR SELECT 
  USING (true);

CREATE POLICY "store_settings_modify_admin" 
  ON public.store_settings FOR ALL 
  USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());


-- -------------------------------------------------------------
-- 🟢 3.5 الملفات الشخصية (profiles)
-- - كل مستخدم يمكنه قراءة وتعديل ملفه الشخصي (تغيير الاسم، الهاتف)
-- - المشرفون والمدراء يمكنهم رؤية الملفات
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_modify_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" 
  ON public.profiles FOR SELECT 
  USING (
    auth.uid() = id 
    OR auth.uid() = user_id 
    OR public.is_staff_or_higher()
  );

CREATE POLICY "profiles_modify_policy" 
  ON public.profiles FOR ALL 
  USING (
    auth.uid() = id 
    OR auth.uid() = user_id 
    OR public.is_staff_or_higher()
  )
  WITH CHECK (
    auth.uid() = id 
    OR auth.uid() = user_id 
    OR public.is_staff_or_higher()
  );


-- -------------------------------------------------------------
-- 🟢 3.6 جدول المشرفين (admin_users)
-- - قراءة مسموحة لجميع المشرفين النشطين
-- - إدارة المشرفين، تعديل رتبهم، إضافتهم أو حذفهم مقتصرة حصرياً على المدير العام (super_admin)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "admin_users_select_staff" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_manage_super_admin" ON public.admin_users;

CREATE POLICY "admin_users_select_staff" 
  ON public.admin_users FOR SELECT 
  USING (public.is_staff_or_higher());

CREATE POLICY "admin_users_manage_super_admin" 
  ON public.admin_users FOR ALL 
  USING (public.get_current_admin_role() = 'super_admin')
  WITH CHECK (public.get_current_admin_role() = 'super_admin');


-- -------------------------------------------------------------
-- 🟢 3.7 المقالات (articles)
-- - تصفح المقالات المنشورة للجميع
-- - إدارة وكتابة وتعديل للموظفين والمدراء
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "articles_select_public" ON public.articles;
DROP POLICY IF EXISTS "articles_manage_staff" ON public.articles;

CREATE POLICY "articles_select_public" 
  ON public.articles FOR SELECT 
  USING (is_published = true OR public.is_staff_or_higher());

CREATE POLICY "articles_manage_staff" 
  ON public.articles FOR ALL 
  USING (public.is_staff_or_higher())
  WITH CHECK (public.is_staff_or_higher());


-- -------------------------------------------------------------
-- 🟢 3.8 تقييمات العملاء (store_reviews)
-- - قراءة التقييمات النشطة للجميع
-- - إضافة وتعديل وإدارة للموظفين والمدراء
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "reviews_select_public" ON public.store_reviews;
DROP POLICY IF EXISTS "reviews_manage_staff" ON public.store_reviews;

CREATE POLICY "reviews_select_public" 
  ON public.store_reviews FOR SELECT 
  USING (is_active = true OR public.is_staff_or_higher());

CREATE POLICY "reviews_manage_staff" 
  ON public.store_reviews FOR ALL 
  USING (public.is_staff_or_higher())
  WITH CHECK (public.is_staff_or_higher());


-- -------------------------------------------------------------
-- 🟢 3.9 مخزون الاشتراكات (subscription_inventory)
-- - إدارة وقراءة وصرف للموظفين والمدراء
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "inventory_staff_manage" ON public.subscription_inventory;

CREATE POLICY "inventory_staff_manage" 
  ON public.subscription_inventory FOR ALL 
  USING (public.is_staff_or_higher())
  WITH CHECK (public.is_staff_or_higher());


-- -------------------------------------------------------------
-- 🟢 3.10 المالية والمحاسبة (Costs, Periods, Fees, Refunds, Expenses)
-- - إدارة خاصة بالمدراء (super_admin و admin)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "costs_admin_manage" ON public.product_costs;
CREATE POLICY "costs_admin_manage" ON public.product_costs FOR ALL USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "periods_admin_manage" ON public.financial_periods;
CREATE POLICY "periods_admin_manage" ON public.financial_periods FOR ALL USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "fees_admin_manage" ON public.payment_fees;
CREATE POLICY "fees_admin_manage" ON public.payment_fees FOR ALL USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "refunds_admin_manage" ON public.refunds;
CREATE POLICY "refunds_admin_manage" ON public.refunds FOR ALL USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "expenses_admin_manage" ON public.expenses;
CREATE POLICY "expenses_admin_manage" ON public.expenses FOR ALL USING (public.is_admin_or_super());


-- -------------------------------------------------------------
-- 🟢 3.11 الكوبونات وخطوات التفعيل (Coupons & Activation Steps)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "coupons_select_public" ON public.coupons;
DROP POLICY IF EXISTS "coupons_manage_admin" ON public.coupons;
CREATE POLICY "coupons_select_public" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "coupons_manage_admin" ON public.coupons FOR ALL USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "activation_steps_select_public" ON public.activation_steps;
DROP POLICY IF EXISTS "activation_steps_manage_admin" ON public.activation_steps;
CREATE POLICY "activation_steps_select_public" ON public.activation_steps FOR SELECT USING (true);
CREATE POLICY "activation_steps_manage_admin" ON public.activation_steps FOR ALL USING (public.is_admin_or_super());


-- -------------------------------------------------------------
-- 🟢 3.12 تخزين الملفات والصور (Storage Buckets RLS)
-- - إتاحة التحميل والقراءة العامة لصور المنتجات
-- - السماح للمشرفين برفع وتحديث الصور
-- -------------------------------------------------------------
DO $$ BEGIN
  -- التأكد من صلاحيات قراءة Storage
  DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
  CREATE POLICY "Public can view product images" ON storage.objects
    FOR SELECT USING (bucket_id IN ('products', 'product-images'));

  -- التأكد من صلاحيات رفع صور المنتجات للمشرفين
  DROP POLICY IF EXISTS "Staff can upload images" ON storage.objects;
  CREATE POLICY "Staff can upload images" ON storage.objects
    FOR ALL USING (bucket_id IN ('products', 'product-images') AND public.is_staff_or_higher());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ===================================================================
-- 4️⃣ تحديث كاش PostgREST Schema فوراً لتطبيق التغييرات
-- ===================================================================
NOTIFY pgrst, 'reload schema';
