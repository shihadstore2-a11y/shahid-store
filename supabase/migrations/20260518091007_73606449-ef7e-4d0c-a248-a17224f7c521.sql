
-- ============================================================
-- store_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  key text PRIMARY KEY,
  value text,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_settings_public_read" ON public.store_settings;
CREATE POLICY "store_settings_public_read"
  ON public.store_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "store_settings_admin_insert" ON public.store_settings;
CREATE POLICY "store_settings_admin_insert"
  ON public.store_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "store_settings_admin_update" ON public.store_settings;
CREATE POLICY "store_settings_admin_update"
  ON public.store_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS store_settings_touch ON public.store_settings;
CREATE TRIGGER store_settings_touch
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.store_settings (key, value, description) VALUES
  ('store_name', 'شاهد ستور', 'اسم المتجر يظهر في الـ Header'),
  ('whatsapp_number', '966507305518', 'رقم الواتساب الرسمي'),
  ('contact_email', NULL, 'إيميل التواصل الرسمي'),
  ('telegram_channel', NULL, 'رابط قناة تيليجرام'),
  ('subscriber_count_base', '0', 'الرقم الأساسي لعداد المشتركين'),
  ('telegram_bot_token', NULL, 'Token لـ Telegram Bot'),
  ('telegram_admin_chat_id', NULL, 'Chat ID للأدمن لاستقبال الإشعارات')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- activation_steps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type text NOT NULL,
  step_order integer NOT NULL,
  title_ar text NOT NULL,
  description_ar text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_type, step_order)
);

ALTER TABLE public.activation_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activation_steps_public_read_active" ON public.activation_steps;
CREATE POLICY "activation_steps_public_read_active"
  ON public.activation_steps FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "activation_steps_admin_read_all" ON public.activation_steps;
CREATE POLICY "activation_steps_admin_read_all"
  ON public.activation_steps FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "activation_steps_admin_insert" ON public.activation_steps;
CREATE POLICY "activation_steps_admin_insert"
  ON public.activation_steps FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "activation_steps_admin_update" ON public.activation_steps;
CREATE POLICY "activation_steps_admin_update"
  ON public.activation_steps FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "activation_steps_admin_delete" ON public.activation_steps;
CREATE POLICY "activation_steps_admin_delete"
  ON public.activation_steps FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS activation_steps_touch ON public.activation_steps;
CREATE TRIGGER activation_steps_touch
  BEFORE UPDATE ON public.activation_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed 24 steps (نقل حرفي من src/routes/activation-guide.tsx)
INSERT INTO public.activation_steps (device_type, step_order, title_ar, description_ar) VALUES
  ('ios', 1, 'الخطوة 1', 'افتح App Store وابحث عن التطبيق المتفق عليه مع الدعم.'),
  ('ios', 2, 'الخطوة 2', 'ثبّت التطبيق وافتحه.'),
  ('ios', 3, 'الخطوة 3', 'أدخل بيانات التفعيل التي ستصلك من فريق الدعم.'),
  ('ios', 4, 'الخطوة 4', 'اختر الباقة المفضلة وابدأ المشاهدة.'),
  ('android', 1, 'الخطوة 1', 'حمّل التطبيق من Google Play أو من الرابط الذي يرسله الدعم.'),
  ('android', 2, 'الخطوة 2', 'افتح التطبيق وامنحه الصلاحيات الأساسية.'),
  ('android', 3, 'الخطوة 3', 'أدخل بيانات التفعيل المرسلة لك.'),
  ('android', 4, 'الخطوة 4', 'اختر الباقة وابدأ التشغيل.'),
  ('samsung-tv', 1, 'الخطوة 1', 'افتح متجر Samsung Apps في تلفزيونك.'),
  ('samsung-tv', 2, 'الخطوة 2', 'ابحث عن تطبيق المشغّل المتوافق وثبّته.'),
  ('samsung-tv', 3, 'الخطوة 3', 'افتح التطبيق وأدخل بيانات التفعيل المرسلة من الدعم.'),
  ('samsung-tv', 4, 'الخطوة 4', 'اضبط جودة الفيديو حسب سرعة الإنترنت لديك.'),
  ('lg-tv', 1, 'الخطوة 1', 'افتح متجر LG Content Store في تلفزيون LG.'),
  ('lg-tv', 2, 'الخطوة 2', 'ابحث عن تطبيق المشغّل المتوافق وثبّته.'),
  ('lg-tv', 3, 'الخطوة 3', 'افتح التطبيق وأدخل بيانات التفعيل التي ستصلك.'),
  ('lg-tv', 4, 'الخطوة 4', 'اضبط جودة الفيديو حسب سرعة الإنترنت لديك.'),
  ('windows', 1, 'الخطوة 1', 'حمّل المشغّل من الرابط الذي يرسله الدعم.'),
  ('windows', 2, 'الخطوة 2', 'ثبّت البرنامج وشغّله بصلاحيات المستخدم.'),
  ('windows', 3, 'الخطوة 3', 'أدخل رابط التفعيل أو بيانات الدخول.'),
  ('windows', 4, 'الخطوة 4', 'ابدأ التشغيل من قائمة الباقات.'),
  ('mac', 1, 'الخطوة 1', 'حمّل المشغّل المتوافق مع نظام macOS.'),
  ('mac', 2, 'الخطوة 2', 'اسحب التطبيق إلى مجلد Applications وافتحه.'),
  ('mac', 3, 'الخطوة 3', 'أدخل بيانات التفعيل المرسلة لك.'),
  ('mac', 4, 'الخطوة 4', 'ابدأ المشاهدة واضبط الإعدادات حسب رغبتك.')
ON CONFLICT (device_type, step_order) DO NOTHING;

-- ============================================================
-- admin_users: read-all policy + last-super-admin trigger
-- ============================================================
DROP POLICY IF EXISTS "admin_users_admin_read_all" ON public.admin_users;
CREATE POLICY "admin_users_admin_read_all"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_super_count INTEGER;
BEGIN
  -- نسمح إذا لم يكن هناك تغيير في الحالة/الدور
  IF OLD.role = NEW.role AND OLD.is_active = NEW.is_active THEN
    RETURN NEW;
  END IF;

  -- إذا كان OLD super_admin نشط، و NEW لم يعد كذلك
  IF OLD.role = 'super_admin' AND OLD.is_active = true
     AND (NEW.role <> 'super_admin' OR NEW.is_active = false) THEN

    SELECT count(*) INTO active_super_count
    FROM public.admin_users
    WHERE role = 'super_admin' AND is_active = true AND id <> OLD.id;

    IF active_super_count = 0 THEN
      RAISE EXCEPTION 'لا يمكن تعطيل أو تنزيل آخر مشرف عام نشط في النظام'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_last_super_admin_trigger ON public.admin_users;
CREATE TRIGGER prevent_last_super_admin_trigger
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_super_admin_change();
