-- ===================================================================
-- 📦 03_INITIAL_DATA_AND_SETTINGS.sql
-- الملف 3 من 3: البيانات الأولية والإعدادات الافتراضية (Seed Data & Settings)
-- يزرع إعدادات المتجر والتصنيفات والمنتجات وخطوات التفعيل والكوبونات
-- ===================================================================

-- 0️⃣ ضمان وجود الأعمدة الأساسية وإلغاء القيود القديمة قبل زرع البيانات (Column Assurance)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration_months INT DEFAULT 12;

DO $$ BEGIN
  ALTER TABLE public.store_reviews ALTER COLUMN author_name DROP NOT NULL;
  ALTER TABLE public.store_reviews ALTER COLUMN comment_ar DROP NOT NULL;
  ALTER TABLE public.store_reviews ALTER COLUMN is_approved DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS comment_ar TEXT;
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS customer_city TEXT;
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS review_text TEXT DEFAULT '';
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- 1️⃣ إدخال بيانات المتجر الأساسية (Store Record)
INSERT INTO public.stores (id, slug, name_ar, name_en, domain, is_active)
VALUES (
  '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01',
  'shahid',
  'متجر شاهد الرسمي',
  'Shahid Store Official',
  'ksa-tv.com',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  domain = EXCLUDED.domain;


-- 2️⃣ إدخال إعدادات المتجر العامة (Store Settings)
INSERT INTO public.store_settings (key, value, description) VALUES
  ('store_name', 'شاهد ستور', 'اسم المتجر الرسمي الظاهر للعملاء'),
  ('whatsapp_number', '966500451602', 'رقم الواتساب الرسمي لخدمة العملاء والدعم الفني'),
  ('contact_email', 'support@ksa-tv.com', 'البريد الإلكتروني الرسمي للمتجر'),
  ('telegram_channel', '', 'رابط قناة التيليجرام الرسمية'),
  ('store_currency', 'SAR', 'العملة الأساسية المستخدمة في المتجر'),
  ('maintenance_mode', 'false', 'وضع الصيانة للمتجر (true / false)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;


-- 3️⃣ إدخال التصنيفات والأقسام (Categories)
INSERT INTO public.categories (id, slug, name_ar, description, image_url, sort_order, store_id)
VALUES 
  ('c99cacbb-451b-4270-a2a6-490881ab199d', 'falcon', 'اشتراكات فالكون برو', 'اشتراكات فالكون IPTV الأكثر استقراراً وجودة 4K فائقة.', 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp', 1, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'),
  ('f7ba3a58-38b4-431c-9299-58d3fdf896a7', 'hulk', 'اشتراكات هولك بلاير', 'سيرفر هولك بلاير الغني بآلاف القنوات والأفلام والمسلسلات.', 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp', 2, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'),
  ('3e084df6-ee7a-4d5a-8186-ed2093a55110', 'smarters', 'تطبيق سمارترز برو', 'اشتراكات تطبيق IPTV Smarters Pro الرسمي على مختلف الأجهزة.', 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/smarters-card.webp', 3, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'),
  ('1e63c74d-516a-4b14-9513-30f1338a5421', 'annual-offers', 'العروض السنوية', 'أفضل العروض السنوية بأسعار خاصة وتوفير حتى 40%.', 'https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/bundle-falcon-hulk-1y.webp', 4, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;


-- 4️⃣ إدخال المنتجات والباقات (Products)
-- باقة فالكون 1 شهر
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '47e7a119-1074-44d3-bfb6-93f5ef39c248',
  'falcon-1m',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'فالكون برو — شهر واحد',
  'اشتراك فالكون برو IPTV لمدة شهر كامل — آلاف القنوات الرياضية والترفيهية والأفلام بدقة تصل إلى 4K. تفعيل سريع، ثبات عالي في البث، ودعم فني عربي.',
  1, 60, 45, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  4.8, 320, false, false, 1, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة فالكون 3 أشهر
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '7abd6a9c-3d96-4006-a9fc-46df82a6b0cc',
  'falcon-3m',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'فالكون برو — 3 أشهر',
  'باقة فالكون لثلاثة أشهر بجودة فائقة ودعم لجميع الشاشات والأجهزة الذكية.',
  3, 140, 110, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  5.0, 420, true, true, 2, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة فالكون 6 أشهر
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '68ab69d6-e4fd-428c-89a6-a296ac1a3490',
  'falcon-6m',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'اشتراك فالكون 6 أشهر',
  'باقة فالكون نصف السنوية بجودة 4K ومكتبة أفلام ضخمة متجددة يومياً.',
  6, 220, 180, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  5.0, 580, true, false, 3, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة فالكون سنة كاملة
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '17951674-52c7-441a-a938-5f6eeb430cfa',
  'falcon-1y',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'فالكون برو — سنة كاملة',
  'الباقة السنوية الأفضل مبيعاً واستقراراً مع ضمان كامل طوال فترة الاشتراك وتحديثات مستمرة.',
  12, 380, 299, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  5.0, 1250, true, true, 4, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة فالكون سنة جهازان
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '8895df0a-d165-42b5-9836-ea829fd88997',
  'falcon-1y-2dev',
  'c99cacbb-451b-4270-a2a6-490881ab199d',
  'فالكون برو — سنة | جهازان',
  'اشتراك فالكون برو IPTV لسنة كاملة على جهازين متزامنين — مثالي للعائلات مع مشاهدة مستقلة لكل فرد.',
  12, 550, 450, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/falcon-card.webp']::text[],
  4.9, 410, true, false, 5, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة هولك 1 شهر
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '53364be2-0b8a-450c-a504-36f1cc56ddf0',
  'hulk-1m',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — شهر واحد',
  'اشتراك هولك بلاير لمدة شهر واحد — تفعيل سريع وبث رياضي شامل بجودة عالية.',
  1, 60, 40, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  4.8, 820, false, true, 1, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة هولك 3 أشهر
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  'd67a62e3-1139-44b3-b456-d734a9b2599f',
  'hulk-3m',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — 3 أشهر',
  'اشتراك هولك بلاير لمدة 3 أشهر مع ثبات ممتاز ومكتبة أفلام ومسلسلات ضخمة.',
  3, 130, 95, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  4.8, 510, false, false, 2, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة هولك 6 أشهر
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  'afaa40da-60c9-4a95-8e49-77f199ac43d8',
  'hulk-6m',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — 6 أشهر',
  'اشتراك هولك النصف سنوي سريع ومستقر مع كافة الباقات الرياضية والترفيهية.',
  6, 200, 150, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  5.0, 390, false, false, 3, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة هولك سنة كاملة
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '54574024-f9ef-4a44-b064-f33b2de629ce',
  'hulk-1y',
  'f7ba3a58-38b4-431c-9299-58d3fdf896a7',
  'هولك بلاير — سنة كاملة',
  'باقة هولك السنوية بأفضل سعر في السوق مع محتوى ضخم وسيرفرات متوازنة.',
  12, 320, 250, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/hulk-card.webp']::text[],
  4.9, 980, true, false, 4, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة سمارترز برو سنة + 3 أشهر
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  '3eb4dc47-89b2-4e84-ab9b-9872cb9fe378',
  'smarters-1y-plus-3',
  '3e084df6-ee7a-4d5a-8186-ed2093a55110',
  'سمارترز برو — سنة + 3 أشهر',
  'اشتراك تطبيق سمارترز برو الرسمي لمدة 15 شهراً (سنة + 3 أشهر مجاناً) لشاشتين.',
  15, 280, 220, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/smarters-card.webp']::text[],
  4.9, 760, true, true, 1, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;

-- باقة الحزمة الذهبية السنوية (فالكون + هولك)
INSERT INTO public.products (id, slug, category_id, name_ar, description, duration_months, base_price, sale_price, currency, image_urls, rating, sales_count, is_featured, is_bestseller, sort_order, is_active, store_id)
VALUES (
  'dc4d683c-774a-49aa-b108-00d04b3c1b93',
  'bundle-falcon-hulk-1y',
  '1e63c74d-516a-4b14-9513-30f1338a5421',
  'الباقة الذهبية السنوية (فالكون + هولك)',
  'حزمة سنوية ذهبية تجمع اشتراك فالكون واشتراك هولك لمدة سنة كاملة. تغطية محتوى مضاعفة بسعر استثنائي.',
  12, 600, 450, 'SAR',
  ARRAY['https://umozikpkfmjkcglizysd.supabase.co/storage/v1/object/public/products/bundle-falcon-hulk-1y.webp']::text[],
  5.0, 650, true, true, 1, true, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'
)
ON CONFLICT (id) DO UPDATE SET duration_months = EXCLUDED.duration_months, base_price = EXCLUDED.base_price, sale_price = EXCLUDED.sale_price;


-- 5️⃣ إدخال خطوات التفعيل والشراء (Activation Steps)
INSERT INTO public.activation_steps (title_ar, description_ar, step_order, icon, is_active) VALUES
  ('اختيار الباقة المناسبة', 'اختر باقة الاشتراك المناسبة لك ولجهازك وأتمم الطلب بأمان وسهولة.', 1, 'package', true),
  ('استلام بيانات التفعيل فوراً', 'فور إتمام الدفع ستصلك بيانات الاشتراك (اسم المستخدم، كلمة المرور ورابط السيرفر) عبر الواتساب والبريد.', 2, 'mail', true),
  ('تحميل التطبيق والاستمتاع بالبث', 'حمّل التطبيق المناسب لجهازك الذكي، أدخل بياناتك واستمتع بمشاهدة بدون تقطيع!', 3, 'play', true)
ON CONFLICT DO NOTHING;


-- 6️⃣ إدخال كوبونات الخصم (Coupons)
INSERT INTO public.coupons (id, code, discount_percent, valid_until, applies_to_duration_min, is_active, max_uses, current_uses, store_id)
VALUES 
  ('0a8ca6e0-4c51-4479-a98b-493d7efbe480', 'SUMMER26', 10, NULL, 3, true, NULL, 0, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'),
  ('9623aefe-a67a-496e-a362-a315ec12e6bb', 'WELCOME10', 10, NULL, 0, true, NULL, 0, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT (id) DO NOTHING;


-- 7️⃣ إدخال تقييمات العملاء المبدئية (Initial Reviews)
INSERT INTO public.store_reviews (
  customer_name,
  author_name,
  customer_city,
  product_label,
  rating,
  review_text,
  comment_ar,
  is_active,
  is_approved,
  display_order,
  store_id
)
VALUES
  ('أبو خالد التميمي', 'أبو خالد التميمي', 'الرياض', 'فالكون برو — سنة كاملة', 5.0, 'خدمة ممتازة وسريعة جداً. البث مستقر والمباريات ولا غلطة، وسرعة الدعم في الواتساب تبهرك.', 'خدمة ممتازة وسريعة جداً. البث مستقر والمباريات ولا غلطة، وسرعة الدعم في الواتساب تبهرك.', true, true, 1, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'),
  ('سعد القحطاني', 'سعد القحطاني', 'جدة', 'هولك بلاير — سنة', 5.0, 'سيرفر هولك جبار والأفلام كلها مترجمة وجودة 4K خرافية. شكراً للقائمين على المتجر.', 'سيرفر هولك جبار والأفلام كلها مترجمة وجودة 4K خرافية. شكراً للقائمين على المتجر.', true, true, 2, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'),
  ('محمد الشمري', 'محمد الشمري', 'الدمام', 'الباقة الذهبية السنوية', 5.0, 'أفضل متجر تعاملت معه، التفعيل وصلني بالواتساب بعد الدفع مباشرة بدون تأخير.', 'أفضل متجر تعاملت معه، التفعيل وصلني بالواتساب بعد الدفع مباشرة بدون تأخير.', true, true, 3, '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01')
ON CONFLICT DO NOTHING;


-- 8️⃣ تحديث كاش PostgREST
NOTIFY pgrst, 'reload schema';
