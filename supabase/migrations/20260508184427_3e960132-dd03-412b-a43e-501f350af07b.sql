
-- Enum للأدوار
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin', 'staff', 'developer');

-- جدول admin_users
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL DEFAULT 'staff',
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_role ON public.admin_users(role);

-- جدول admin_audit_logs
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin_user ON public.admin_audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);

-- Helper functions (SECURITY DEFINER لتجنّب RLS recursion)
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.admin_users
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id AND is_active = true AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _changes jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (admin_user_id, action, entity_type, entity_id, changes)
  SELECT id, _action, _entity_type, _entity_id, _changes
  FROM public.admin_users
  WHERE user_id = auth.uid() AND is_active = true;
END;
$$;

-- Trigger updated_at
CREATE TRIGGER trg_admin_users_touch
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- admin_users policies
CREATE POLICY "admin_users_self_read"
ON public.admin_users FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "admin_users_super_read_all"
ON public.admin_users FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "admin_users_super_insert"
ON public.admin_users FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "admin_users_super_update"
ON public.admin_users FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "admin_users_super_delete"
ON public.admin_users FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- admin_audit_logs policies
CREATE POLICY "audit_logs_admin_read"
ON public.admin_audit_logs FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- لا policies للـ INSERT/UPDATE/DELETE — يتم فقط عبر log_admin_action() (SECURITY DEFINER)
