UPDATE public.products
SET features = COALESCE(
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(features) AS elem
    WHERE elem::text NOT ILIKE '%توفير%'
      AND elem::text NOT ILIKE '%وفّر%'
      AND elem::text NOT ILIKE '%وفر %'
  ),
  '[]'::jsonb
)
WHERE features IS NOT NULL
  AND (
    features::text ILIKE '%توفير%'
    OR features::text ILIKE '%وفّر%'
    OR features::text ILIKE '%وفر %'
  );