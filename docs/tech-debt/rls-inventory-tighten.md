# Tech Debt — Tighten RLS on `subscription_inventory`

**Created:** 2026-05-27 (D.1 Admin Inventory CRUD)  
**Priority:** Post-launch (Low — trusted admins only)  
**Owner:** Senior backend

## Issue

UI layer (`canManageInventory` RBAC flag) hides Create/Edit/Delete buttons for
roles `staff` and `developer`. However the database-level RLS policies on
`subscription_inventory` currently use `can_modify_data(auth.uid())`, which
returns `true` for these roles:

```sql
-- current policy
USING (can_modify_data(auth.uid()))
WITH CHECK (can_modify_data(auth.uid()))
-- can_modify_data allows: super_admin, admin, developer, staff
```

## Impact

A motivated `staff` or `developer` account could bypass the UI and call the
table directly via the Supabase JS client, performing CRUD on inventory.
Risk surface is small because:

- All admin accounts are manually provisioned by `super_admin`.
- No public exposure (RLS still blocks anon/authenticated non-admins).
- D.2 auto-claim logic runs server-side regardless.

## Fix (post-launch)

Replace the two `subscription_inventory` policies with role-specific checks:

```sql
DROP POLICY IF EXISTS subscription_inventory_admin_modify ON public.subscription_inventory;

CREATE POLICY subscription_inventory_super_modify
ON public.subscription_inventory
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('super_admin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('super_admin', 'admin')
  )
);
```

Keep `subscription_inventory_admin_read` as-is (all admins can view).

## Verification after fix

- `staff` user → direct insert via JS client → expect `42501` permission denied.
- `developer` user → direct update → expect `42501`.
- `admin` user → full CRUD works.
