# إصلاح فلتر صفحة العملاء — 3 يونيو 2026

## المشكلة
صفحة `/admin/customers` كانت تتضمن طلبات غير مدفوعة (`pending` / `initiated` / `payment_failed`) في:
- قائمة العملاء وإحصائياتها (`loadOrdersForAggregation`)
- تفاصيل العميل (`fetchCustomerOrders`)

→ 261 عميل ظاهر / 207 حقيقي (54 وهمي).

## الجذر
- `loadOrdersForAggregation`: `.neq("status", "cancelled")` يشمل كل الحالات ما عدا cancelled.
- `fetchCustomerOrders`: بلا أي فلتر حالة.

## الإصلاح
استيراد `ADMIN_VISIBLE_STATUSES` من `admin-orders.ts` (مصدر حقيقة واحد) وتطبيقه في كلا المسارين:

| المسار | قبل | بعد |
|--------|-----|-----|
| `loadOrdersForAggregation` | `.neq("status", "cancelled")` | `.in("status", ADMIN_VISIBLE_STATUSES)` |
| `fetchCustomerOrders` | — | `.in("status", ADMIN_VISIBLE_STATUSES)` |

`ADMIN_VISIBLE_STATUSES = ["paid", "fulfilled", "refunded"]`

## الملفات المُعدَّلة
- `src/lib/admin-customers.ts` — استيراد الثابت + فلترين

## التحقق
- `tsc --noEmit` = 0 errors
- اتساق تام مع صفحة الطلبات (`fetchAdminOrders` تستخدم نفس الثابت)
- `account.orders` (عميل) لم يُمسّ — لا يزال يرى كل طلباته

## التأثير المتوقّع
- قائمة العملاء: 207 (بدلاً من 261)
- الإحصائيات (CustomerStatsStrip): دقيقة بدون أرقام pending
- تفاصيل العميل: لا أرقام طلبات وهمية
