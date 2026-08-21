# Dashboard Accuracy Fix + UI Contrast — 2026-05-30

Plan v10.0 — PM Ahmed (Senior 16y)

## المشكلة الجذرية
`admin.dashboard.tsx` كان يستخدم `fetchDashboardKpis` (استعلامات client مباشرة بلا فلتر)
بدل منطق `get_kpi_dashboard` الصحيح المستخدم في المحاسبة. النتيجة: احتساب طلبات
`cancelled` / `payment_failed` / `pending` و `is_test=true` ضمن المبيعات وAOV، وعدّ
"العملاء" من `profiles` (تسجيلات) لا من أصحاب طلبات مكتملة.

## التغييرات (READ-ONLY على البيانات — فلترة عرض فقط، لا حذف)

### 1. `src/lib/admin-queries.ts` — `fetchDashboardKpis`
- "مبيعة حقيقية" = `is_test = false AND status IN ('paid','fulfilled')`.
- طُبّق على: todayOrders / yesterdayOrders / monthOrders / prevMonthOrders.
- AOV = متوسط الطلبات الحقيقية فقط.
- **العملاء**: تحوّل من عدّ `profiles` إلى عدّ distinct (`user_id` أو `customer_email`)
  من الطلبات المكتملة. العنوان أصبح "عملاء بطلبات مكتملة اليوم".

### 2. `src/lib/admin-queries.ts` — `fetchSalesLast30Days`
- أُضيف نفس الفلتر (`is_test=false` + `paid/fulfilled`) ليعرض الرسم البياني مبيعات حقيقية.

### 3. `src/components/admin/AdminNotifications.tsx`
- فلترة الطلبات المعروضة إلى `status IN ('pending','paid')` + `is_test=false`.
- إخفاء ضجيج `payment_failed` / `cancelled` / `fulfilled`.
- عدّاد "بانتظار" وشارة "جديد" (localStorage) كما هما.

### 4. التباين (Accessibility)
- الإشعارات: `text-[10px]`/`text-[11px]` → `text-xs` (12px).
- شارة "بانتظار": `text-amber-300` → `text-amber-200`.
- `KpiCard`: عنوان `text-muted-foreground` → `text-foreground/70`، والتلميح → `text-foreground/60`.
- لا تغيير في الـ layout ولا ألوان البراند.

## لم يُمَس (حسب التعليمات)
- `get_kpi_dashboard` (المحاسبة) — صحيح.
- `fetchOrderStatusBreakdown` / `fetchPendingCount`.
- المخزون، EdfaPay/webhook، Phase H.
- لا حذف لأي طلب.
