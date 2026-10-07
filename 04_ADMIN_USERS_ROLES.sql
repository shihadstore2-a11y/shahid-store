-- ===================================================================
-- 👥 04_ADMIN_USERS_ROLES.sql
-- الملف 4 من 4: ربط حسابات فريق العمل وتحديد الرتب الإدارية (Admin Team Setup)
-- يربط الحسابات المسجلة في auth.users بجدول المشرفين admin_users وجدول profiles
-- ===================================================================

-- 0️⃣ تنظيف أي تكرارات سابقة وفرض قيد الفرادة على user_id لمنع تكرار الحسابات
DELETE FROM public.admin_users a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.admin_users
  ORDER BY user_id, updated_at DESC, created_at DESC
);

DO $$ BEGIN
  ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;


-- 1️⃣ ربط وتعيين المدير العام (Super Admin) - ثامر
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
SELECT 
  id, 
  email, 
  'ثامر', 
  'super_admin', 
  true
FROM auth.users 
WHERE email = 'iiithamer17@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  full_name = 'ثامر',
  is_active = true,
  updated_at = now();

-- 2️⃣ ربط وتعيين مدير المتجر (Admin) - Digitaneo
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
SELECT 
  id, 
  email, 
  'Digitaneo Admin', 
  'admin', 
  true
FROM auth.users 
WHERE email = 'digitaneo@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  full_name = 'Digitaneo Admin',
  is_active = true,
  updated_at = now();

-- 3️⃣ ربط وتعيين الموظف (Staff) - Belcaid
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
SELECT 
  id, 
  email, 
  'Belcaid', 
  'staff', 
  true
FROM auth.users 
WHERE email = 'belcaid@inbox.ru'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'staff',
  full_name = 'Belcaid',
  is_active = true,
  updated_at = now();

-- 4️⃣ ربط وتعيين الموظفة (Staff) - Mera Mustafa
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
SELECT 
  id, 
  email, 
  'Mera Mustafa', 
  'staff', 
  true
FROM auth.users 
WHERE email = 'meramustafa126@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'staff',
  full_name = 'Mera Mustafa',
  is_active = true,
  updated_at = now();

-- 5️⃣ ربط وتعيين الموظف (Staff) - Shahid Staff
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
SELECT 
  id, 
  email, 
  'Shahid Staff', 
  'staff', 
  true
FROM auth.users 
WHERE email = 'shihadstore2@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'staff',
  full_name = 'Shahid Staff',
  is_active = true,
  updated_at = now();


-- 6️⃣ مزامنة وتحديث جداول profiles لجميع أعضاء الفريق
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

INSERT INTO public.profiles (id, user_id, email, full_name, role)
SELECT 
  id, 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  'admin'
FROM auth.users
WHERE email IN (
  'iiithamer17@gmail.com',
  'digitaneo@gmail.com',
  'belcaid@inbox.ru',
  'meramustafa126@gmail.com',
  'shihadstore2@gmail.com'
)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.id,
  full_name = EXCLUDED.full_name;

-- تحديث أسماء الملفات الشخصية المحددة بدقة
UPDATE public.profiles SET full_name = 'ثامر', user_id = id WHERE email = 'iiithamer17@gmail.com';
UPDATE public.profiles SET full_name = 'Digitaneo Admin', user_id = id WHERE email = 'digitaneo@gmail.com';
UPDATE public.profiles SET full_name = 'Belcaid', user_id = id WHERE email = 'belcaid@inbox.ru';
UPDATE public.profiles SET full_name = 'Mera Mustafa', user_id = id WHERE email = 'meramustafa126@gmail.com';
UPDATE public.profiles SET full_name = 'Shahid Staff', user_id = id WHERE email = 'shihadstore2@gmail.com';


-- إنعاش كاش PostgREST
NOTIFY pgrst, 'reload schema';
