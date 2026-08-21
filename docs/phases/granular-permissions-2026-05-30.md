# ميزة الصلاحيات الإضافية (Granular Per-Account Permissions) — 30 May 2026

## الهدف
تمكين المشرف العام (ثامر) من منح صلاحيات **إضافية** لأي حساب إدارة فوق دوره الأساسي من `/admin/users` — إضافية فقط (OR)، بلا سحب، ومع منع التصعيد.

## ما نُفِّذ
1. **DB**: عمود `permission_overrides jsonb NOT NULL DEFAULT '{}'` في `admin_users`. لا تغيير RLS. snapshot في `docs/snapshots/pre-permissions-2026-05-30.csv`.
2. **admin-rbac.ts**: `PermissionOverrides`, `parseOverrides` (whitelist دفاعي)، `canAccessRoute/hasPermission` بدمج OR، `GRANTABLE_ROUTES` (عدا users+settings)، `GRANTABLE_ACTIONS` (عدا canManageUsers+canModifySettings)، `ACTION_RLS_ROLES` + `actionEffectiveForRole`، `routeFromPathname` (يدعم accounting/*)، تسميات عربية.
3. **useAdminUser.ts**: `overrides` + `can(perm)` + `canRoute(route)`.
4. **RequireAccess.tsx** (جديد): حارس مركزي في `_admin.tsx` يُغلق فجوة الوصول المباشر عبر URL. يعفي profile/login.
5. **مواقع الأفعال**: AdminSidebar + admin.coupons + admin.inventory + OrderDetailSheet → `can/canRoute`.
6. **ManagePermissionsDialog.tsx** (جديد) + `updateAdminPermissions` + زر ShieldCheck في UsersTable/UserCard. معطّل على الحساب الشخصي + super_admin. تنبيه عند منح فعل كتابة لدور يرفضه RLS.

## قرارات المالك (Senior)
- استثناء `settings` + `canModifySettings` من المنح (الأكثر أماناً).
- منح فعل كتابة لدور لا يسمح له RLS → checkbox يعمل لكن مع **تنبيه أصفر** «لن يعمل دون ترقية الدور».

## ضمانات السلامة
- additive فقط، الموروثة معطّلة وثابتة. الحسابات الحالية (`{}`) بلا تغيير سلوكي.
- RLS يبقى المرجع النهائي. لا مساس بالسلة/الدفع/EdfaPay/الواجهة/Phase H.
