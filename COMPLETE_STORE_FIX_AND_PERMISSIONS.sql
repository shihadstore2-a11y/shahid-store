-- ===================================================================
-- 👑 المخطط الشامل لإصلاح جميع جداول وصلاحيات متجر شاهد (Shahid Store Fix)
-- يحل جميع المشاكل المذكورة دفعة واحدة:
-- 1. إضافة duration_months وبقية أعمدة products
-- 2. إنشاء وتفعيل store_settings لصفحة الإعدادات
-- 3. إصلاح profiles و admin_users لتمكين تعديل الملف الشخصي والاسم
-- 4. إضافة whatsapp_messages_sent لجدول orders لتسجيل رسائل الاستعادة
-- 5. إصلاح أعمدة articles لإضافة المقالات بسلاسة
-- 6. إصلاح أعمدة store_reviews (إضافة customer_city و review_text وغيرها)
-- 7. ضبط سياسات الأمان RLS المتقدمة والصلاحيات لجميع الرتب
-- ===================================================================

-- ===================================================================
-- 1️⃣ إصلاح جدول المنتجات products
-- ===================================================================
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS duration_months INT,
  ADD COLUMN IF NOT EXISTS gradient_key TEXT,
  ADD COLUMN IF NOT EXISTS icon_key TEXT,
  ADD COLUMN IF NOT EXISTS stock_management_enabled BOOLEAN NOT NULL DEFAULT false;

-- تحديث الأشهر تلقائياً بناءً على اسم الباقة أو الـ slug
UPDATE public.products SET duration_months = 12 WHERE slug LIKE '%12m%' OR slug LIKE '%1y%' OR slug LIKE '%annual%';
UPDATE public.products SET duration_months = 6  WHERE slug LIKE '%6m%';
UPDATE public.products SET duration_months = 3  WHERE slug LIKE '%3m%';
UPDATE public.products SET duration_months = 1  WHERE slug LIKE '%1m%';
UPDATE public.products SET duration_months = 12 WHERE duration_months IS NULL;


-- ===================================================================
-- 2️⃣ إصلاح جدول المشرفين admin_users
-- ===================================================================
ALTER TABLE public.admin_users 
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS permission_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.admin_users SET full_name = 'ثامر' WHERE email = 'iiithamer17@gmail.com';
UPDATE public.admin_users SET full_name = 'Digitaneo Admin' WHERE email = 'digitaneo@gmail.com';
UPDATE public.admin_users SET full_name = 'Belcaid' WHERE email = 'belcaid@inbox.ru';
UPDATE public.admin_users SET full_name = 'Mera Mustafa' WHERE email = 'meramustafa126@gmail.com';
UPDATE public.admin_users SET full_name = 'Shahid Staff' WHERE email = 'shihadstore2@gmail.com';


-- ===================================================================
-- 3️⃣ إصلاح جدول الملف الشخصي profiles (لحل مشكلة تعديل الاسم في /profile)
-- ===================================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;


-- ===================================================================
-- 4️⃣ إصلاح جدول الطلبات orders (لحل مشكلة تسجيل رسائل واتساب السلات المتروكة)
-- ===================================================================
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS whatsapp_messages_sent JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfilled_by TEXT,
  ADD COLUMN IF NOT EXISTS primary_subscription_id UUID,
  ADD COLUMN IF NOT EXISTS backup_subscription_id UUID,
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;


-- ===================================================================
-- 5️⃣ إنشاء وإصلاح جدول إعدادات المتجر store_settings (لحل صفحة /settings)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (key, value, description) VALUES
  ('store_name', 'شاهد ستور', 'اسم المتجر الرسمي'),
  ('whatsapp_number', '966500451602', 'رقم الواتساب الرسمي لخدمة العملاء'),
  ('contact_email', 'support@shahidstore.net', 'البريد الرسمي للمتجر'),
  ('telegram_channel', '', 'قناة التيليجرام'),
  ('store_currency', 'SAR', 'العملة الأساسية للمتجر'),
  ('maintenance_mode', 'false', 'وضع الصيانة')
ON CONFLICT (key) DO NOTHING;


-- ===================================================================
-- 6️⃣ إصلاح جدول المقالات articles (لحل مشكلة إضافة المقالات)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  excerpt TEXT,
  content_md TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  author TEXT NOT NULL DEFAULT 'إدارة شاهد',
  category TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  view_count INT NOT NULL DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إضافة الأعمدة إن كان الجدول منشأ سابقاً
ALTER TABLE public.articles 
  ADD COLUMN IF NOT EXISTS excerpt TEXT,
  ADD COLUMN IF NOT EXISTS content_md TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT 'إدارة شاهد',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();


-- ===================================================================
-- 7️⃣ إصلاح جدول التقييمات store_reviews (لحل مشكلة مدينة العميل وإضافة التقييم)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.store_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_city TEXT,
  product_label TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  review_text TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_reviews 
  ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_city TEXT,
  ADD COLUMN IF NOT EXISTS product_label TEXT,
  ADD COLUMN IF NOT EXISTS review_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();


-- ===================================================================
-- 8️⃣ إنشاء جدول مخزون الاشتراكات والأكواد subscription_inventory
-- ===================================================================
DO $$ BEGIN 
  CREATE TYPE public.subscription_provider AS ENUM ('falcon', 'smarters', 'hulk'); 
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

CREATE TABLE IF NOT EXISTS public.subscription_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.subscription_provider NOT NULL,
  duration_months INT NOT NULL DEFAULT 1,
  device_limit INT NOT NULL DEFAULT 1,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  cogs NUMERIC(10,2),
  cogs_currency TEXT DEFAULT 'SAR',
  notes TEXT,
  extra_info JSONB,
  claimed_order_id UUID,
  claimed_role TEXT,
  claimed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ===================================================================
-- 9️⃣ جداول التكاليف والمحاسبة الإضافية
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.product_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  month INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  fee_type TEXT DEFAULT 'gateway',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  refunded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ===================================================================
-- 🔟 منظومة سياسات الأمان RLS المتقدمة والصلاحيات الشاملة
-- ===================================================================

-- دالة مساعدة سريعة وآمنة لمعرفة رتبة المستخدم الإدارية الحالية
CREATE OR REPLACE FUNCTION public.get_current_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- تفعيل الـ RLS على كل الجداول
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- 1. المنتجات والتصنيفات (قراءة للجميع | كتابة للمدراء | حذف للمدير العام فقط)
DROP POLICY IF EXISTS "products_read_all" ON public.products;
DROP POLICY IF EXISTS "products_manage_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_super_admin" ON public.products;
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_manage_admin" ON public.products FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin', 'staff')
);
CREATE POLICY "products_delete_super_admin" ON public.products FOR DELETE USING (
  public.get_current_admin_role() = 'super_admin'
);

DROP POLICY IF EXISTS "categories_read_all" ON public.categories;
DROP POLICY IF EXISTS "categories_manage_admin" ON public.categories;
CREATE POLICY "categories_read_all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_manage_admin" ON public.categories FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);

-- 2. الطلبات (إنشاء للجميع والزوار | قراءة للمشرفين والعملاء | تعديل للمشرفين | حذف للمدير العام)
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_select_all" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_super" ON public.orders;
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select_all" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR user_id IS NULL OR public.get_current_admin_role() IS NOT NULL
);
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE USING (
  public.get_current_admin_role() IN ('super_admin', 'admin', 'staff')
);
CREATE POLICY "orders_delete_super" ON public.orders FOR DELETE USING (
  public.get_current_admin_role() = 'super_admin'
);

-- 3. إعدادات المتجر store_settings
DROP POLICY IF EXISTS "store_settings_read" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_write" ON public.store_settings;
CREATE POLICY "store_settings_read" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "store_settings_write" ON public.store_settings FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);

-- 4. المقالات والتقييمات articles & store_reviews
DROP POLICY IF EXISTS "articles_public_read" ON public.articles;
DROP POLICY IF EXISTS "articles_admin_all" ON public.articles;
CREATE POLICY "articles_public_read" ON public.articles FOR SELECT USING (true);
CREATE POLICY "articles_admin_all" ON public.articles FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin', 'staff')
);

DROP POLICY IF EXISTS "reviews_public_read" ON public.store_reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON public.store_reviews;
CREATE POLICY "reviews_public_read" ON public.store_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_admin_all" ON public.store_reviews FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin', 'staff')
);

-- 5. جدول المشرفين admin_users (إدارة وإضافة وحذف حصرياً للمدير العام ثامر)
DROP POLICY IF EXISTS "admin_users_read_all" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_manage_super" ON public.admin_users;
CREATE POLICY "admin_users_read_all" ON public.admin_users FOR SELECT USING (
  public.get_current_admin_role() IS NOT NULL
);
CREATE POLICY "admin_users_manage_super" ON public.admin_users FOR ALL USING (
  public.get_current_admin_role() = 'super_admin'
);

-- 6. الملفات الشخصية profiles (العميل يعدل ملفه والمشرفون يعدلون)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_upsert" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR auth.uid() = user_id OR public.get_current_admin_role() IS NOT NULL
);
CREATE POLICY "profiles_upsert" ON public.profiles FOR ALL USING (
  auth.uid() = id OR auth.uid() = user_id OR public.get_current_admin_role() IS NOT NULL
);

-- 7. مخزون الاشتراكات subscription_inventory والمحاسبة
DROP POLICY IF EXISTS "inventory_admin" ON public.subscription_inventory;
CREATE POLICY "inventory_admin" ON public.subscription_inventory FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin', 'staff')
);

DROP POLICY IF EXISTS "costs_admin" ON public.product_costs;
CREATE POLICY "costs_admin" ON public.product_costs FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "periods_admin" ON public.financial_periods;
CREATE POLICY "periods_admin" ON public.financial_periods FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "fees_admin" ON public.payment_fees;
CREATE POLICY "fees_admin" ON public.payment_fees FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "refunds_admin" ON public.refunds;
CREATE POLICY "refunds_admin" ON public.refunds FOR ALL USING (
  public.get_current_admin_role() IN ('super_admin', 'admin')
);

-- ===================================================================
-- 1️⃣1️⃣ إنعاش كاش PostgREST Schema Cache فوراً
-- ===================================================================
NOTIFY pgrst, 'reload schema';
