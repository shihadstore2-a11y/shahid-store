ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS permission_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.admin_users.permission_overrides IS
  'Additive-only per-account permission grants on top of the role baseline. Shape: { "routes": string[], "actions": string[] }. Never used to revoke. users/canManageUsers/settings/canModifySettings are never grantable here (anti-escalation). RLS remains the final authority.';