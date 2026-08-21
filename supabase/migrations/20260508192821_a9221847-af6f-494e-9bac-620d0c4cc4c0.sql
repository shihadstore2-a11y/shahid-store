
UPDATE auth.users SET email_confirmed_at = now()
WHERE email = 'thamer585899@gmail.com' AND email_confirmed_at IS NULL;

INSERT INTO public.admin_users (user_id, role, full_name, email, is_active)
SELECT id, 'super_admin'::admin_role, COALESCE(raw_user_meta_data->>'full_name','ثامر'), email, true
FROM auth.users WHERE email = 'thamer585899@gmail.com'
ON CONFLICT DO NOTHING;
