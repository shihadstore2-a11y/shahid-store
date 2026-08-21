ALTER TABLE public.activation_steps ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE public.activation_steps SET image_url = '/activation/android/step-1.jpg' WHERE id = 'cfd89d9b-fa94-49d7-96e1-76b1f861db6c';
UPDATE public.activation_steps SET image_url = '/activation/android/step-2.png' WHERE id = '1914ce04-407b-4d2f-9dc2-ffc23ef41e91';
UPDATE public.activation_steps SET image_url = '/activation/android/step-4.jpg' WHERE id = '8c2809c8-7723-4602-8722-f2d590d763dd';
UPDATE public.activation_steps SET image_url = '/activation/android/step-5.jpg' WHERE device_type = 'android' AND step_order = 5;