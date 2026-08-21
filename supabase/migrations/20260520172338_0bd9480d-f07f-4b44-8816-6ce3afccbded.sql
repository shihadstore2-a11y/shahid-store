INSERT INTO storage.buckets (id, name, public)
VALUES ('activation-step-images', 'activation-step-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "activation_images_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'activation-step-images');

CREATE POLICY "activation_images_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activation-step-images'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "activation_images_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'activation-step-images'
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'activation-step-images'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "activation_images_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'activation-step-images'
  AND public.is_admin(auth.uid())
);