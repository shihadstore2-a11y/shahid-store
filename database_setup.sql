-- ===================================================================
-- 🛒 Shahid Store Dedicated Database Setup (مشروع متجر شاهد المستقل)
-- Target Project: https://umozikpkfmjkcglizysd.supabase.co
-- Generated automatically: Isolated schema, performance-optimized, pre-seeded
-- ===================================================================

-- 1️⃣ Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2️⃣ Enums
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'user'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded', 'paid'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3️⃣ Tables Definition

-- 3.1 Stores
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  domain TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  onboarded BOOLEAN DEFAULT true,
  onboarding_completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 Categories
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4 Products
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
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5 Product Durations
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

-- 3.6 Coupons
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

-- 3.7 Orders
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
  fulfilled_at TIMESTAMPTZ,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.8 Payment Transactions
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

-- 3.9 Activation Steps
CREATE TABLE IF NOT EXISTS public.activation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  step_order INT NOT NULL DEFAULT 0,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.10 Store Reviews
CREATE TABLE IF NOT EXISTS public.store_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  comment_ar TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  store_id UUID DEFAULT '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.11 Expenses
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

-- 3.12 Articles
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  excerpt_ar TEXT,
  content_ar TEXT,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.13 Admin Users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.14 Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.15 Email Queue
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

-- 4️⃣ Performance Indexes (Prevent CPU & Memory Exhaustion)
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

-- 5️⃣ Enable Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 6️⃣ RLS Policies
-- Public Read
CREATE POLICY "stores_public_read" ON public.stores FOR SELECT USING (true);
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "product_durations_public_read" ON public.product_durations FOR SELECT USING (true);
CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "activation_steps_public_read" ON public.activation_steps FOR SELECT USING (is_active = true);
CREATE POLICY "store_reviews_public_read" ON public.store_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "articles_public_read" ON public.articles FOR SELECT USING (is_published = true);

-- Orders: Public can create order (guest checkout), users can read their own
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_user_select" ON public.orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "payments_public_insert" ON public.payment_transactions FOR INSERT WITH CHECK (true);

-- Profiles
CREATE POLICY "profiles_user_read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_user_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admin Users: Full access for service_role and admin users
CREATE POLICY "admin_full_access_categories" ON public.categories FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true));
CREATE POLICY "admin_full_access_products" ON public.products FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true));
CREATE POLICY "admin_full_access_orders" ON public.orders FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true));
CREATE POLICY "admin_full_access_coupons" ON public.coupons FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true));
CREATE POLICY "admin_full_access_expenses" ON public.expenses FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true));
CREATE POLICY "admin_users_read" ON public.admin_users FOR SELECT USING (true);

-- 7️⃣ Triggers for Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, onboarded)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    true
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8️⃣ Seed Initial Data (Data Migration)

-- 8.1 Default Store Record
INSERT INTO public.stores (id, slug, name_ar, name_en, domain, logo_url, is_active)
VALUES (
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01',
  'shahid-store',
  'شاهد ستور',
  'Shahid Store',
  'shahid-store.digitaneo.workers.dev',
  'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/logo.webp',
  true
) ON CONFLICT (id) DO UPDATE SET
  logo_url = 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/logo.webp';

-- 8.2 Seed Categories
INSERT INTO public.categories (id, slug, name_ar, description, image_url, sort_order, store_id)
VALUES ('ec734828-b116-4224-8123-048b609302c5', 'vulture', 'فولتشر Vulture', 'باقات فولتشر بمحتوى ضخم ودعم فني متواصل.', NULL, 4, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description;

INSERT INTO public.categories (id, slug, name_ar, description, image_url, sort_order, store_id)
VALUES ('c99cacbb-451b-4270-a2a6-490881ab199d', 'falcon', 'فالكون Falcon', 'باقات فالكون الأقوى في عالم البث الرقمي بجودة 4K واستقرار عالي.', 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp', 1, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description;

INSERT INTO public.categories (id, slug, name_ar, description, image_url, sort_order, store_id)
VALUES ('f7ba3a58-38b4-431c-9299-58d3fdf896a7', 'hulk', 'هولك Hulk', 'باقات هولك بسيرفرات قوية وأسعار منافسة لجميع الأجهزة.', 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp', 2, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description;

INSERT INTO public.categories (id, slug, name_ar, description, image_url, sort_order, store_id)
VALUES ('3e084df6-ee7a-4d5a-8186-ed2093a55110', 'smarters', 'سمارترز برو Smarters Pro', 'تطبيق سمارترز برو الرسمي مع دعم كل الأجهزة الذكية.', 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/smarters-card.webp', 3, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description;

INSERT INTO public.categories (id, slug, name_ar, description, image_url, sort_order, store_id)
VALUES ('1e63c74d-516a-4b14-9513-30f1338a5421', 'annual-offers', 'العروض السنوية', 'أفضل العروض السنوية بأسعار خاصة وتوفير حتى 40%.', 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/bundle-falcon-hulk-1y.webp', 4, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description;

-- 8.3 Seed Products
INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '7abd6a9c-3d96-4006-a9fc-46df82a6b0cc',
  'falcon-3m',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'فالكون برو — 3 أشهر',
  'باقة فالكون لثلاثة أشهر بجودة فائقة ودعم لجميع الشاشات والأجهزة الذكية.',
  '[]'::jsonb,
  '[]'::jsonb,
  140,
  110,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  5,
  0,
  true,
  true,
  2,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '68ab69d6-e4fd-428c-89a6-a296ac1a3490',
  'falcon-6m',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'اشتراك فالكون 6 أشهر',
  'باقة فالكون نصف السنوية بجودة 4K ومكتبة أفلام ضخمة متجددة يومياً.',
  '[]'::jsonb,
  '[]'::jsonb,
  220,
  180,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  5,
  0,
  true,
  false,
  3,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '17951674-52c7-441a-a938-5f6eeb430cfa',
  'falcon-1y',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'فالكون برو — سنة كاملة',
  'الباقة السنوية الأفضل مبيعاً واستقراراً مع ضمان كامل طوال فترة الاشتراك.',
  '[]'::jsonb,
  '[]'::jsonb,
  380,
  299,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  5,
  0,
  true,
  true,
  4,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  'afaa40da-60c9-4a95-8e49-77f199ac43d8',
  'hulk-6m',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — 6 أشهر',
  'اشتراك هولك النصف سنوي سريع ومستقر مع كافة الباقات الرياضية والترفيهية.',
  '[]'::jsonb,
  '[]'::jsonb,
  200,
  150,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  5,
  0,
  false,
  false,
  3,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  'f7fa9d82-95da-4b85-a277-cb70f5332866',
  'hulk-1y-2dev',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — سنة | جهازان',
  'اشتراك هولك بلاير سنوي لجهازين في نفس الوقت — راحة ومرونة لجميع أفراد الأسرة.',
  '["سنة كاملة لجهازين متزامنين","سعر اقتصادي موفّر","محتوى رياضي وعائلي ضخم","ثبات ممتاز للبث"]'::jsonb,
  '["Smart TV","Android","iOS","Windows","MAG"]'::jsonb,
  480,
  380,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  4.8,
  180,
  false,
  false,
  5,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '8895df0a-d165-42b5-9836-ea829fd88997',
  'falcon-1y-2dev',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'فالكون برو — سنة | جهازان',
  'اشتراك فالكون برو IPTV لسنة كاملة على جهازين متزامنين — مثالي للعائلات مع مشاهدة مستقلة لكل فرد. تغطية رياضية وترفيهية شاملة بجودة 4K.',
  '["12 شهر اشتراك على جهازين متزامنين في نفس الوقت","مشاهدة مستقلة لكل فرد في العائلة","توفير كبير مقارنة باشتراكين منفصلين","ثبات البث على كلا الجهازين","مكتبة كاملة وجودة 4K","دعم فني متميز طوال السنة"]'::jsonb,
  '["Smart TV","Android","iOS","Windows","Mac","Fire Stick","Apple TV"]'::jsonb,
  550,
  450,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  4.9,
  410,
  true,
  false,
  5,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '53364be2-0b8a-450c-a504-36f1cc56ddf0',
  'hulk-1m',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — شهر واحد',
  'اشتراك هولك بلاير لمدة شهر واحد — تفعيل سريع وبث رياضي شامل بجودة عالية.',
  '["بث رياضي وترفيهي شامل","جودة HD/4K مستقرة","تفعيل سريع خلال دقائق","دعم فني سريع ومتجاوب"]'::jsonb,
  '["Smart TV","Android","iOS","Windows","MAG"]'::jsonb,
  60,
  40,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  4.8,
  820,
  false,
  true,
  1,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  'd67a62e3-1139-44b3-b456-d734a9b2599f',
  'hulk-3m',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — 3 أشهر',
  'اشتراك هولك بلا��ر لمدة 3 أشهر مع ثبات ممتاز ومكتبة أفلام ومسلسلات ضخمة.',
  '["3 أشهر اشتراك مستقر","توفير مقارنة بالاشتراك الشهري","قنوات رياضية بجودة ممتازة","مكتبة أفلام ومسلسلات","تفعيل فوري"]'::jsonb,
  '["Smart TV","Android","iOS","Windows","MAG"]'::jsonb,
  130,
  95,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  4.8,
  510,
  false,
  false,
  2,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '54574024-f9ef-4a44-b064-f33b2de629ce',
  'hulk-1y',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — سنة كاملة',
  'باقة هولك السنوية بأفضل سعر في السوق مع محتوى ضخم وسيرفرات متوازنة.',
  '["12 شهر اشتراك متواصل","أفضل سعر سنوي منافس","أكثر من 20 ألف قناة وباقة أفلام","تحديثا�� مستمرة للمحتوى","دعم فني عربي"]'::jsonb,
  '["Smart TV","Android","iOS","Windows","MAG"]'::jsonb,
  320,
  250,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  4.9,
  980,
  true,
  false,
  4,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '3eb4dc47-89b2-4e84-ab9b-9872cb9fe378',
  'smarters-1y-plus-3',
  '3e084df6-ee7a-4d5a-8186-ed2093a55110',
  'سمارترز برو — سنة + 3 أشهر',
  'اشتراك تطبيق سمارترز برو الرسمي لمدة 15 شهراً (سنة + 3 أشهر مجاناً) لشاشتين.',
  '["15 شهر اشتراك (12 + 3 مجاناً)","يعمل على شاشتين متزامنتين","تطبيق رسمي مدفوع بالكامل","واجهة عربية أنيقة وسهلة","تحديثات مستمرة لمكتبة المحتوى"]'::jsonb,
  '["iOS","Android","Smart TV","Firestick","Windows","Mac"]'::jsonb,
  280,
  220,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/smarters-card.webp']::text[],
  4.9,
  760,
  true,
  true,
  1,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  'dabc950e-728c-4f87-b666-eb8546827d38',
  'smarters-1y-plus-3-solo',
  '3e084df6-ee7a-4d5a-8186-ed2093a55110',
  'سمارترز برو — سنة + 3 أشهر (شاشة واحدة)',
  'اشتراك تطبيق سمارترز برو الرسمي لشاشة فردية واحدة لمدة 15 شهراً مع تفعيل فوري.',
  '["15 شهر اشتراك فردي","شاشة واحدة مخصصة","تطبيق رسمي مستقر","دعم فني وتفعيل سريع"]'::jsonb,
  '["iOS","Android","Smart TV","Firestick","Windows","Mac"]'::jsonb,
  210,
  160,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/smarters-card.webp']::text[],
  4.8,
  450,
  false,
  false,
  2,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  'dc4d683c-774a-49aa-b108-00d04b3c1b93',
  'bundle-falcon-hulk-1y',
  '1e63c74d-516a-4b14-9513-30f1338a5421',
  'الباقة الذهبية السنوية (فالكون + هولك)',
  'حزمة سنوية ذهبية تجمع اشتراك فالكون واشتراك هولك لمدة سنة كاملة. تغطية محتوى مضاعفة بسعر استثنائي مع تنويع كامل بين منصتين مختلفتين.',
  '["اشتراك فالكون سنة كاملة + اشتراك هولك سنة كاملة","تغطية محتوى مضاعفة بسعر واحد موحد","توفير يصل إلى 150 ر.س مقارنة بالشراء المنفصل","مكتبتا أفلام ومسلسلات منفصلتان وثريتان","ضمان استمرارية وبث بديل في أي وقت","دعم فني عربي VIP طوال السنة"]'::jsonb,
  '["Smart TV","Android","iOS","Windows","Mac","Fire Stick","Apple TV","MAG"]'::jsonb,
  600,
  450,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/bundle-falcon-hulk-1y.webp']::text[],
  5,
  650,
  true,
  true,
  1,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

INSERT INTO public.products (id, slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '47e7a119-1074-44d3-bfb6-93f5ef39c248',
  'falcon-1m',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'فالكون برو — شهر واحد',
  'اشتراك فالكون برو IPTV لمدة شهر كامل — آلاف القنوات الرياضية والترفيهية والأفلام بدقة تصل إلى 4K. تفعيل سريع، ثبات عالي في البث، ودعم فني عربي. مثالي لتجربة الخدمة.',
  '["آلاف القنوات والأفلام والمسلسلات في باقة واحدة","جودة بث تصل إلى 4K Ultra HD","قنوات رياضية وتغطية شاملة للبطولات","مكتبة أفلام ومسلسلات محدثة","تفعيل فوري خلال دقائق بعد الدفع","دعم فني طوال فترة الاشتراك"]'::jsonb,
  '["Smart TV","Android","iOS","Windows","Mac","Fire Stick","Apple TV"]'::jsonb,
  60,
  45,
  'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  4.8,
  320,
  false,
  false,
  1,
  true,
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  base_price = EXCLUDED.base_price,
  sale_price = EXCLUDED.sale_price,
  name_ar = EXCLUDED.name_ar,
  features = EXCLUDED.features;

-- 8.4 Seed Durations
INSERT INTO public.product_durations (id, product_id, label_ar, months, price, sale_price, is_default, sort_order)
VALUES ('6c0c79bc-0678-4bfd-9b15-e57ca9895f59', '68ab69d6-e4fd-428c-89a6-a296ac1a3490', '6 أشهر', 6, 180, 149, true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_durations (id, product_id, label_ar, months, price, sale_price, is_default, sort_order)
VALUES ('91963a3a-e8bf-4c5b-85db-c42b95ef7ecd', '68ab69d6-e4fd-428c-89a6-a296ac1a3490', '6 أشهر', 6, 180, 149, true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_durations (id, product_id, label_ar, months, price, sale_price, is_default, sort_order)
VALUES ('8a7960a8-a9dc-4d4a-a6d9-7430019ae85f', '68ab69d6-e4fd-428c-89a6-a296ac1a3490', '6 أشهر', 6, 180, 149, true, 1)
ON CONFLICT (id) DO NOTHING;

-- 8.5 Seed Coupons
INSERT INTO public.coupons (id, code, discount_percent, valid_until, applies_to_duration_min, is_active, max_uses, current_uses, store_id)
VALUES ('0a8ca6e0-4c51-4479-a98b-493d7efbe480', 'SUMMER26', 10, NULL, 3, true, NULL, 0, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.coupons (id, code, discount_percent, valid_until, applies_to_duration_min, is_active, max_uses, current_uses, store_id)
VALUES ('9623aefe-a67a-496e-a362-a315ec12e6bb', 'WELCOME10', 10, NULL, 0, true, NULL, 0, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO NOTHING;

-- 8.6 Seed Activation Steps
INSERT INTO public.activation_steps (title_ar, description_ar, step_order, icon, is_active) VALUES
('اختيار الباقة', 'اختر باقة الاشتراك المناسبة لك ولجهازك وأتمم الطلب بأمان.', 1, 'package', true),
('استلام بيانات التفعيل', 'فور الدفع ستصلك بيانات الاشتراك (اسم المستخدم، كلمة المرور ورابط السيرفر) عبر الواتساب والإيميل.', 2, 'mail', true),
('تحميل التطبيق والمشاهدة', 'حمّل التطبيق المناسب لجهازك، أدخل البيانات واستمتع بمشاهدة فورية بدون تقطيع!', 3, 'play', true)
ON CONFLICT DO NOTHING;
