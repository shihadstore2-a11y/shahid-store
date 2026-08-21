# سياسة عرض حالات الطلبات في لوحة التحكم (30 May 2026)

## الهدف
حصر عرض الطلبات في لوحة الإدارة على الحالات التشغيلية/المحاسبية فقط
(`paid` / `fulfilled` / `refunded`)، وإخفاء الحالات الوسيطة (`pending` /
`initiated` / `payment_failed`) من الواجهة — **دون أي تغيير في قاعدة
البيانات أو الـ webhook أو الـ RLS أو التسليم التلقائي**. طبقة عرض فقط.

## المبدأ
- `pending` / `initiated` / `payment_failed` ما زالت تُكتب داخلياً بواسطة
  مسار الدفع و EdfaPay webhook والتسليم — مخفية من الواجهة فقط.
- معيار التسليم الموثوق = `fulfilled_at IS NULL` (وليس `primary_subscription_id`).
- الإبقاء الدفاعي على `OrderStatus` + `ORDER_STATUS_LABELS` + `STYLES` لعرض
  أي بيانات قديمة بأمان.

## الثوابت المركزية (DRY) — `src/lib/admin-orders.ts`
- `ADMIN_VISIBLE_STATUSES = ['paid','fulfilled','refunded']`
- `ADMIN_SELECTABLE_STATUSES = ['paid','fulfilled']`

## الملفات المعدّلة
| الملف | التغيير |
|------|---------|
| `lib/admin-orders.ts` | الثوابت + `fetchAdminOrders` (in visible) + `fetchAdminOrdersStats` (fulfilledCount + paidUnfulfilledCount + إيراد مفلتر paid/fulfilled) |
| `orders/OrdersFilters.tsx` | قائمة الحالة = `ADMIN_VISIBLE_STATUSES` |
| `orders/OrderDetailSheet.tsx` | تغيير الحالة = `ADMIN_SELECTABLE_STATUSES` (زر التسليم يبقى) |
| `orders/OrdersKpiCards.tsx` | حذف "قيد الانتظار" → "بانتظار التسليم" (برتقالي) + "طلبات مُسلَّمة" (أخضر) |
| `orders/OrderStatusBadge.tsx` | شارة مشتقّة: paid بلا fulfilled_at → "بانتظار التسليم" برتقالي |
| `orders/OrdersTable.tsx` + `OrderCard.tsx` | تمرير `fulfilledAt` للشارة |
| `lib/admin-queries.ts` | `fetchRecentOrders` + `fetchOrderStatusBreakdown` مفلترة، حذف `fetchPendingCount` |
| `routes/_admin/admin.dashboard.tsx` | حذف pending query + بانر "ينتظر المراجعة" |
| `lib/admin-reports.ts` | فلترة `fetchStatusDistribution` + `exportOrdersCSV`، إصلاح `STATUS_LABELS` المهجور → `ORDER_STATUS_LABELS` |
| `admin/AdminNotifications.tsx` | جرس الإشعارات: paid/fulfilled فقط، عدّاد "بانتظار التسليم" |

## خارج النطاق (لم يُلمس)
- `account.orders` (العميل يرى كل طلباته).
- `getCustomerOrderView` (Phase H).
- `fetchDashboardKpis` / `fetchSalesLast30Days` (مفلترة مسبقاً paid/fulfilled).
- DB / enum / webhook / RLS / EdfaPay / التسليم التلقائي.

## حالة البيانات وقت التنفيذ
fulfilled=16, paid=3 (كلها بانتظار التسليم), pending=4 (مخفية).
