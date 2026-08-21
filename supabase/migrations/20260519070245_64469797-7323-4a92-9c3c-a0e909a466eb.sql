
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ar text NOT NULL,
  excerpt text,
  content_md text NOT NULL,
  cover_image_url text,
  author text NOT NULL DEFAULT 'فريق شاهد ستور',
  category text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_published 
  ON public.articles(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles_public_read_published"
ON public.articles FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE POLICY "articles_admin_all"
ON public.articles FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS articles_updated_at ON public.articles;
CREATE TRIGGER articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.increment_article_views(article_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles
  SET view_count = view_count + 1
  WHERE slug = article_slug AND is_published = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_views(text) TO anon, authenticated;

INSERT INTO public.articles (slug, title_ar, excerpt, content_md, category, is_published, published_at) VALUES
(
  'how-to-activate-iptv',
  'كيف تفعّل اشتراك IPTV على جهازك في 3 خطوات',
  'دليل سريع لتفعيل اشتراكك على أي جهاز — Android، iOS، Smart TV.',
  E'## مقدمة\n\nبعد شراء اشتراكك من شاهد ستور، التفعيل لا يتعدى 3 خطوات بسيطة.\n\n## الخطوة 1: تحميل التطبيق\n\nحمّل التطبيق الموصى به لجهازك:\n\n- **Android:** IPTV Smarters Pro من Play Store\n- **iOS:** GSE Smart IPTV\n- **Smart TV (Samsung/LG):** SmartOne IPTV\n\n## الخطوة 2: استلام البيانات\n\nسنرسل لك بياناتك عبر WhatsApp بعد إكمال الدفع:\n\n- URL الخادم\n- اسم المستخدم\n- كلمة المرور\n\n## الخطوة 3: إدخال البيانات\n\nافتح التطبيق، اضغط Add User، الصق البيانات، وابدأ المشاهدة.\n\n---\n\nأي مشكلة؟ تواصل معنا واتساب على مدار الساعة.',
  'دروس',
  true,
  now() - interval '2 days'
),
(
  'world-cup-2026-channels',
  'كل قنوات كأس العالم على شاهد ستور',
  'قائمة شاملة بقنوات البث المباشر لمباريات كأس العالم للمنتخبات.',
  E'## كأس العالم على شاهد ستور\n\nاستمتع بمتابعة كل المباريات بجودة عالية على باقات شاهد ستور.\n\n## القنوات المتاحة\n\n- **beIN Sports** القنوات الرياضية الكاملة\n- **Saudi Sports** البث المحلي\n- **Sky Sports** للتعليق الإنجليزي\n- **ESPN** تحليلات احترافية\n\n## الباقات الموصى بها\n\nلتجربة كأس العالم الكاملة:\n\n- فالكون سنة كاملة\n- سمارترز سنة + 3 شاشات للعائلة\n- هولك 6 شهور للمدى القصير\n\nاطلب الآن واستمتع بكأس العالم بأفضل تجربة.',
  'أخبار',
  true,
  now() - interval '5 days'
)
ON CONFLICT (slug) DO NOTHING;
