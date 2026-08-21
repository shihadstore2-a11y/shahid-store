CREATE TABLE IF NOT EXISTS public.store_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_city text,
  product_label text,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  review_text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_reviews_active_order
  ON public.store_reviews(is_active, display_order) WHERE is_active = true;

ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_reviews_public_read_active"
ON public.store_reviews FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "store_reviews_admin_all"
ON public.store_reviews FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS store_reviews_touch_updated_at ON public.store_reviews;
CREATE TRIGGER store_reviews_touch_updated_at
BEFORE UPDATE ON public.store_reviews
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.store_reviews (customer_name, customer_city, product_label, rating, review_text, display_order) VALUES
  ('أحمد ع.', 'الرياض', 'فالكون سنة', 5, 'تجربة ممتازة، التفعيل كان سريع جداً والقنوات شغّالة بدون أي مشاكل.', 10),
  ('محمد ف.', 'جدة', 'سمارترز سنة + 3', 5, 'أسعار منافسة ودعم متجاوب في نفس اللحظة، أنصح فيه.', 20),
  ('فهد ن.', 'الدمام', 'هولك 6 شهور', 5, 'جودة عالية واستقرار ممتاز حتى في أوقات المباريات الكبيرة.', 30),
  ('عبدالله', 'مكة', 'فالكون سنة جهازين', 5, 'العرض ممتاز وفّر علي شراء اشتراكين منفصلين، التجديد سهل وسريع.', 40);