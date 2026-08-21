BEGIN;

DO $$ DECLARE v int; BEGIN
  SELECT COUNT(*) INTO v FROM auth.users WHERE email_confirmed_at IS NULL;
  RAISE NOTICE '[H.1.6 PRE] unconfirmed = %', v;
END $$;

UPDATE auth.users
   SET email_confirmed_at = NOW()
 WHERE email_confirmed_at IS NULL
   AND email IN ('thamer585891@gmail.com', '+h1test@gmail.com');

DO $$ DECLARE v int; BEGIN
  SELECT COUNT(*) INTO v FROM auth.users WHERE email_confirmed_at IS NULL;
  RAISE NOTICE '[H.1.6 POST] unconfirmed = %', v;
  ASSERT v = 0, 'BACKFILL INCOMPLETE';
END $$;

COMMIT;