-- ===================================================================
-- 🛒 01_DATABASE_SCHEMA.sql
-- الملف 1 من 3: هيكل وجداول قاعدة البيانات الشاملة (Database Schema & Tables)
-- متوافق تماماً مع أي مشروع Supabase جديد مستقل (Clean Setup)
-- ===================================================================

-- 1️⃣ الامتدادات الأساسية (Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2️⃣ أنواع التعداد المخصصة (Enums)
DO $$ BEGIN 
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'staff', 'user'); 
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

DO $$ BEGIN 
  CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded', 'paid'); 
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

DO $$ BEGIN 
  CREATE TYPE public.subscription_provider AS ENUM ('falcon', 'smarters', 'hulk'); 
EXCEPTION WHEN duplicate_object THEN null; 
END $$;


-- ===================================================================
-- 3️⃣ الجداول الرئيسية (Core Tables)
-- ===================================================================

-- 3.1 جدول المتاجر (Stores)
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  domain TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 جدول إعدادات المتجر العامة (Store Settings)
-- يُستخدم في صفحة /settings لعرض وتعديل بيانات المتجر، الواتساب، العملة ووضع الصيانة
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 جدول الملف الشخصي للمستخدمين والعملاء (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  onboarded BOOLEAN DEFAULT true,
  onboarding_completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4 جدول التصنيفات والأقسام (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  icon_key TEXT,
  gradient_key TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5 جدول المنتجات والباقات (Products)
-- يحتوي على جميع الأعمدة بما فيها duration_months و stock_management_enabled و gradient_key و icon_key
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  compatibility JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'SAR',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  sales_count INT NOT NULL DEFAULT 0,
  duration_months INT DEFAULT 12,
  gradient_key TEXT,
  icon_key TEXT,
  stock_management_enabled BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6 جدول مدد وأسعار المنتجات (Product Durations)
CREATE TABLE IF NOT EXISTS public.product_durations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label_ar TEXT NOT NULL,
  months INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2),
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.7 جدول كوبونات الخصم (Coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INT NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  applies_to_duration_min INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INT,
  current_uses INT DEFAULT 0,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.8 جدول الطلبات (Orders)
-- يشمل حقول السلات المتروكة ورسائل الواتساب والاشتراكات
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  city TEXT,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  vat NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  coupon_code TEXT,
  payment_method TEXT DEFAULT 'card',
  status TEXT NOT NULL DEFAULT 'pending',
  subscription_username TEXT,
  subscription_password TEXT,
  subscription_url TEXT,
  subscription_extra_info JSONB DEFAULT '{}'::jsonb,
  whatsapp_messages_sent JSONB NOT NULL DEFAULT '[]'::jsonb,
  credentials_sent_at TIMESTAMPTZ,
  fulfilled_by TEXT,
  primary_subscription_id UUID,
  backup_subscription_id UUID,
  is_test BOOLEAN NOT NULL DEFAULT false,
  fulfilled_at TIMESTAMPTZ,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.9 جدول معاملات الدفع (Payment Transactions)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'edfapay',
  transaction_id TEXT,
  raw_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.10 جدول خطوات التفعيل (Activation Steps)
CREATE TABLE IF NOT EXISTS public.activation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  step_order INT NOT NULL DEFAULT 0,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.11 جدول تقييمات وآراء العملاء (Store Reviews)
CREATE TABLE IF NOT EXISTS public.store_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_city TEXT,
  product_label TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  review_text TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.12 جدول المقالات والمدونة (Articles)
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

-- 3.13 جدول المشرفين والمدراء (Admin Users)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  permission_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.14 سجل تدقيق عمليات المشرفين (Admin Audit Logs)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.15 جدول مخزون الاشتراكات والأكواد (Subscription Inventory)
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

-- 3.16 جداول المحاسبة والتكاليف (Finance & Accounting)
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

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.17 جداول رسائل البريد الإلكتروني (Email Logs)
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT,
  subject TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_send_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_processed_at TIMESTAMPTZ DEFAULT now()
);


-- ===================================================================
-- 3.18 ضمان ترقية وإضافة الأعمدة إن كانت الجداول منشأة مسبقاً (Migration Assurance)
-- ===================================================================
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS duration_months INT DEFAULT 12,
  ADD COLUMN IF NOT EXISTS gradient_key TEXT,
  ADD COLUMN IF NOT EXISTS icon_key TEXT,
  ADD COLUMN IF NOT EXISTS stock_management_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

ALTER TABLE public.admin_users 
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS permission_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS whatsapp_messages_sent JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfilled_by TEXT,
  ADD COLUMN IF NOT EXISTS primary_subscription_id UUID,
  ADD COLUMN IF NOT EXISTS backup_subscription_id UUID,
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

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

ALTER TABLE public.store_reviews 
  ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_city TEXT,
  ADD COLUMN IF NOT EXISTS product_label TEXT,
  ADD COLUMN IF NOT EXISTS review_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.store_reviews ALTER COLUMN author_name DROP NOT NULL;
  ALTER TABLE public.store_reviews ALTER COLUMN comment_ar DROP NOT NULL;
  ALTER TABLE public.store_reviews ALTER COLUMN is_approved DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ===================================================================
-- 4️⃣ الفهارس عالية الأداء (Performance Indexes)
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_store ON public.categories(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_durations_product ON public.product_durations(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.subscription_inventory(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
