# Snapshot — product_costs قبل تصحيح COGS التاريخي (2026-06-03)

السبب: التكاليف الحقيقية بدأت السريان 2026-05-31 ~22:43، بينما يوجد صف تكلفة = 0.00
ساري من 2026-05-26. النتيجة: طلبات 29–30 مايو + جزء من 31 مايو تُحتسب بتكلفة صفر →
ربح مُضخَّم. الإصلاح: حذف صفوف الصفر + إرجاع effective_from للصفوف الحقيقية إلى
2026-05-26 14:06:23.63005+00 (تاريخ بدء التشغيل).

## الحالة قبل التعديل (الصفوف الـ26: زوج لكل منتج)

كل منتج له صفّان:
- صف "Initial seed" بقيمة 0.00، effective_from = 2026-05-26 14:06:23.63005+00،
  effective_to = وقت تعيين التكلفة الحقيقية (2026-05-31 ~22:43–22:45).
- صف حقيقي بقيمة > 0، effective_from = 2026-05-31 ~22:43–22:45، effective_to = NULL.

| product_slug | zero_row_id | real_row_id | real_cost |
|---|---|---|---|
| bundle-falcon-hulk-1y | 2839843e-009f-4759-b390-0090f51482c4 | 1c42943b-8fa7-4101-86d2-26656eff4c47 | 80.00 |
| falcon-1m | df8ad3de-f541-446f-8b55-21fff2185cae | b23b4c8b-7015-4040-9665-b2e2d4becfb9 | 10.00 |
| falcon-1y | 7a143560-d8eb-4686-a8be-e4a7876b67d5 | 84349622-6f69-4a96-9dd4-3ff3bd9f8d75 | 50.00 |
| falcon-1y-2dev | 0f54a221-b167-4ef6-875e-9813fafe52da | 98e858ac-43cf-4d69-bea7-bba5a34d4af1 | 90.00 |
| falcon-3m | f7eddc7d-bc41-4fff-b817-2b68c41e04ab | 96711949-8468-464f-b071-7a889a5e4576 | 20.00 |
| falcon-6m | 4e849b46-9c0d-43ae-a941-d259d8c10404 | 91e8eff3-5595-4d2d-86db-992c149ced59 | 30.00 |
| hulk-1y | a5343245-5c11-41bb-a715-9fc72525b4ab | 786b7545-6cda-46c5-9a6b-2effa3390fba | 30.00 |
| hulk-1y-2dev | d53540bf-d839-461a-919b-3dd13c37d387 | (real) | 60.00 |
| hulk-3m | (zero) | (real) | 7.00 |
| hulk-6m | (zero) | (real) | 14.00 |
| smarters-1y-plus-3 | (zero) | (real) | 36.00 |
| smarters-1y-plus-3-solo | (zero) | (real) | 23.00 |

> ملاحظة: القيم الحقيقية كاملة موجودة في DB. الاستعادة عند الحاجة:
> إعادة إدراج صفوف seed بقيمة 0 (effective_from=2026-05-26, effective_to=وقت التعيين)
> وإرجاع effective_from للصفوف الحقيقية لقيمها الأصلية (2026-05-31).

## التعديل المطبّق
1. DELETE من product_costs حيث unit_cost = 0.
2. UPDATE للصفوف المتبقية (الحقيقية): effective_from = '2026-05-26 14:06:23.63005+00',
   effective_to = NULL.
