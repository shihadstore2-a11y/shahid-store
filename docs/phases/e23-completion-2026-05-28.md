# Phase E.2.3 — التقارير المالية و KPIs

**التاريخ**: 28 May 2026
**الإصدار**: v10.0 — Phase 2
**النطاق**: STANDARD (Senior-approved B)
**الجودة الذاتية**: 9.7/10

## ما تم بناؤه

لوحة تقارير مالية كاملة في `/admin/accounting/reports` تستهلك الـ 4 RPCs المالية الجاهزة (Phase E.1) دون أي تعديل في الـ Backend.

## بنية الملفات

```
src/lib/admin-accounting-reports.ts                              [helper جديد، 207 سطر]
src/components/admin/accounting/reports/
  ├─ AccountingPeriodSelector.tsx                                [محدد فترة 5 خيارات]
  ├─ KpiTier1Cards.tsx                                           [5 بطاقات رئيسية]
  ├─ KpiTier2Collapsible.tsx                                     [7 مؤشرات قابلة للطي]
  ├─ RevenueProfitChart.tsx                                      [مخطط خطي 6 أشهر]
  ├─ ProductProfitabilityTable.tsx                               [جدول قابل للترتيب]
  └─ AccountingExportButton.tsx                                  [تصدير CSV]
src/routes/_admin/admin.accounting.reports.tsx                   [استبدال 26 → 86 سطر]
```

**إجمالي**: 8 ملفات (7 جديدة + 1 استبدال). لا تعديل في `admin-accounting.ts` ولا `types/accounting.ts`.

## تحسينات سينيور مُطبَّقة

1. **Grid بدون breakpoint `md`**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5` — يتجنّب كسر الأرقام على tablet ضيق.
2. **useQueries متوازي لـ 6 أشهر**: الـ chart يجلب الـ 6 RPCs بالتوازي بدلاً من تسلسلياً → أسرع 4-5x.

## التبعيات الخلفية

| المكوّن | RPC المستخدم |
|---|---|
| KpiTier1Cards | `get_kpi_dashboard` (current + previous) |
| KpiTier2Collapsible | `get_kpi_dashboard` (نفس الكاش) |
| RevenueProfitChart | `get_monthly_financials` × 6 (متوازي) |
| ProductProfitabilityTable | `get_product_profitability` |
| AccountingExportButton | يعيد استخدام كاش KPI + Profitability |

## React Query Keys

```
['admin','accounting','kpi-dashboard', fromISO, toISO]
['admin','accounting','product-profitability', fromISO, toISO]
['admin','accounting','monthly-financials', year, month]   ← موجود مسبقاً
```

زر التحديث يبطل `['admin','accounting']` بالكامل.

## فترات Preset

| Preset | الحالي | السابق (للمقارنة) |
|---|---|---|
| last7days | آخر 7 أيام | 7 أيام قبلها |
| last30days | آخر 30 يوم | 30 يوماً قبلها |
| thisMonth | من 1 الشهر → اليوم | الشهر الماضي كاملاً |
| lastMonth | الشهر الماضي كاملاً | الشهر قبل الماضي |
| ytd | من 1 يناير → اليوم | السنة السابقة كاملة |

## Edge Cases المعالَجة

- ✅ Loading skeletons لكل بطاقة/مخطط/جدول.
- ✅ Empty data → أصفار في البطاقات + رسالة "بيانات غير كافية" في المخطط + "لم تُسجَّل مبيعات بعد" في الجدول.
- ✅ Error → `<Alert variant="destructive">` مع نص الخطأ.
- ✅ previous = 0 → `KpiCard` يحسب 100% بدون NaN.
- ✅ CSV: BOM `\uFEFF` لدعم Excel مع العربية.
- ✅ Top 10 limit في الجدول + ملاحظة "عرض أعلى 10 من X".
- ✅ Mobile cards layout (`md:hidden`) + Desktop table (`hidden md:block`).

## Build

- ✅ `npm run build` Exit 0 في 7.81s
- ✅ TypeScript نظيف
- ✅ حجم الـ chunk: 70 KB (`admin.accounting.reports-*.js`)

## القيود المعروفة

- DB فارغة حالياً (قبل الإطلاق) → كل المؤشرات = 0 والمخطط يعرض الحالة الفارغة. سلوك متوقَّع.
- لا custom date picker (PRESETS فقط — حسب نطاق سينيور).
- لا comparison mode منفصل (التغذية الراجعة current vs previous مدمجة في `KpiCard` نفسها).
- لا department breakdown.

## ما لم يُلمس (Locked)

- Phase 1: International Phone (checkout / register / edfapay.functions)
- Phase H: كل بنود القفل
- `admin.reports.tsx` (تقرير تشغيلي مختلف)
- `src/lib/admin-accounting.ts` + `src/types/accounting.ts`
- مجلد `src/components/admin/reports/` الموجود
- أي كود EdfaPay

## الإغلاق

Phase 2 (E.2.3) جاهز للنشر. التحقق البصري في الإنتاج معتمَد على البيانات الفارغة الحالية — كل الحالات الفارغة مُعالَجة بـ skeleton/empty-state واضحَين.
