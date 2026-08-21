-- ════════════════════════════════════════════════════════════
-- H.1 — Profile Infrastructure Foundation
-- Date: 25 May 2026
-- Owner: PM Ahmed
-- ════════════════════════════════════════════════════════════

-- PART 1: Snapshot (audit)
DO $$
DECLARE
  v_users_count int;
  v_profiles_count int;
  v_missing int;
BEGIN
  SELECT COUNT(*) INTO v_users_count FROM auth.users;
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO v_missing
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE p.user_id IS NULL;
  RAISE NOTICE '[H.1 PRE] auth.users=%, profiles=%, missing=%',
    v_users_count, v_profiles_count, v_missing;
END $$;

-- PART 2: Backfill Existing Users
INSERT INTO public.profiles (user_id, full_name, phone, email)
SELECT
  u.id AS user_id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    ''
  ) AS full_name,
  COALESCE(u.raw_user_meta_data->>'phone', u.phone, '') AS phone,
  u.email AS email
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- PART 3: Attach Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PART 4: Admin SELECT Policy on profiles
DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
CREATE POLICY profiles_admin_select
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- PART 5: Verification + ASSERT
DO $$
DECLARE
  v_users_count int;
  v_profiles_count int;
  v_missing int;
  v_trigger_exists boolean;
  v_admin_policy_exists boolean;
BEGIN
  SELECT COUNT(*) INTO v_users_count FROM auth.users;
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO v_missing
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE p.user_id IS NULL;

  SELECT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
  ) INTO v_trigger_exists;

  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_admin_select'
  ) INTO v_admin_policy_exists;

  RAISE NOTICE '[H.1 POST] users=%, profiles=%, missing=%, trigger=%, admin_policy=%',
    v_users_count, v_profiles_count, v_missing,
    v_trigger_exists, v_admin_policy_exists;

  ASSERT v_missing = 0, 'BACKFILL FAILED: still missing profiles';
  ASSERT v_trigger_exists, 'TRIGGER NOT ATTACHED';
  ASSERT v_admin_policy_exists, 'ADMIN POLICY NOT CREATED';
  ASSERT v_users_count = v_profiles_count, 'COUNT MISMATCH: users != profiles';
END $$;