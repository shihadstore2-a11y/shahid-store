# إصلاح الصلاحيات + تصحيح COGS — 2026-06-03

PM Ahmed (Senior 16y). تنفيذ النقطتين 1 و3 (النقطة 2 مؤجّلة بانتظار المالك).

## النقطة 1 — تصحيح ربط التكاليف بالتقارير (بيانات فقط)
**الجذر:** `get_product_cost_at(slug, order.created_at)` يُرجِّع التكلفة السارية وقت الطلب.
كانت التكاليف الحقيقية تبدأ السريان 31 مايو ~22:43 بينما يوجد صف seed = 0.00 ساري من
26 مايو → طلبات 29–30 مايو + جزء من 31 مايو تُحتسب بتكلفة صفر → ربح مُضخَّم.

**الإصلاح (عبر تعديل بيانات، لا migration):**
- حذف صفوف `unit_cost = 0` (seed) من `product_costs`.
- إرجاع `effective_from` للصفوف الحقيقية إلى `2026-05-26 14:06:23.63005+00` مع `effective_to = NULL`.
- snapshot: `docs/snapshots/pre-cogs-backdate-2026-06-03.md`.

**التحقّق:** التكلفة عند 29 مايو تُرجِّع القيمة الحقيقية لكل منتج مُباع (falcon/hulk/smarters/bundle).
- `hulk-1m` و`edfa-test` بلا تكلفة لكن **بلا مبيعات** → لا أثر (موثّق في tech-debt).

## النقطة 3 — سدّ فجوة RequireRole (واجهة فقط)
**الجذر:** صفحات المخزون والمحاسبة كانت تُغلَّف بـ `RequireRole` (role-only، لا يقرأ
`permission_overrides`). الموظف الممنوح المسار عبر override يَعبُر الحارس المركزي
`RequireAccess` (المدرك للـoverrides) و RLS يسمح له (`can_modify_data`/`is_admin`)، لكن
`RequireRole` يحجبه — تعارض داخلي يناقض ميزة الصلاحيات الإضافية.

**PHASE A (تأكيد قبل الإزالة):** الـ5 مسارات مربوطة صحيحاً في `routeFromPathname`
(inventory, accounting-costs/expenses/reports/periods)، و`canRoute` يرجع false للموظف
غير الممنوح → `RequireAccess` يحجبه. لا حاجة لإصلاح ربط.

**PHASE B (الإزالة):** أُزيل `RequireRole` + استيراده غير المستخدم من 5 ملفات:
- `admin.inventory.tsx`, `admin.accounting.costs.tsx`, `admin.accounting.expenses.tsx`,
  `admin.accounting.reports.tsx`, `admin.accounting.periods.tsx`.
- الوصول صار محكوماً مركزياً بـ `RequireAccess` (الدور OR overrides) + أزرار الإجراءات تستخدم
  `can()` المدرك للـoverrides + RLS كمرجع نهائي.

**ضمانات السلامة (لا انحدار):**
- الأدوار الأساسية محفوظة: admin يصل costs/expenses/reports/inventory (موجودة في base)، لا يصل
  periods (غير موجودة في base) — مطابق للسلوك السابق لأن `RequireAccess` كان يحكمه أصلاً.
- developer لا يصل costs/expenses/periods (غير موجودة في base) — مطابق.
- periods: الإقفال يبقى محصوراً بالمشرف العام عبر RLS `is_super_admin` حتى لو رأى غيرُه الصفحة.
- users/settings تبقى محمية بـ `RequireRole` (خارج النطاق، غير قابلة للمنح).

**ملاحظة follow-up (خارج نطاق هذا الطلب):** صفحات `articles`/`reviews`/`activation-guide`
ما زالت تستخدم `RequireRole` وهي مسارات قابلة للمنح — نفس نمط الفجوة. لم تُلمس التزاماً بالنطاق
المعتمد (المخزون + المحاسبة فقط).

## النقطة 2 — مؤجّلة
موثّقة في `docs/tech-debt/inventory-2dev-pool.md` بانتظار قرار المالك (تمسّ التسليم التلقائي).

## غير ممسوس
RLS، التسليم التلقائي، EdfaPay، webhook، Phase H، السلة.
