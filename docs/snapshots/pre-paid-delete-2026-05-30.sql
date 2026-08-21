-- Snapshot احترازي قبل حذف 3 طلبات paid اختبارية — 2026-05-30
-- للاسترجاع اليدوي عند الحاجة.

-- ORDER 1: LG-260529-6391 (مخمد علي / +97450149978 / 300.00)
-- ORDER 2: LG-260529-7662 (Ahmed / +966512345699 / 10.00)
-- ORDER 3: LG-260529-5581 (ثامر اليزيدي / +966566478157 / 10.00)
-- IDs:
--   d4fccc8b-a202-4d74-8318-880f609f93e9
--   1979a447-6ca9-4cf2-bd32-840a6ff09b18
--   1e61a361-25e1-452f-af2a-aef4ef0cc9ef

-- payment_transactions المرتبطة (status=success, edfapay):
--   order d4fccc8b... -> trans 838a9bf4-7dfe-4119-aa44-8f75b09d7e45, amount 300
--   order 1979a447... -> trans cc1c4486-bb4e-4a3d-b0cf-8f138f408632, amount 10
--   order 1e61a361... -> trans 7f61c5e4-579c-4e68-81a5-e4125a35b9e1, amount 10

-- لا مخزون claimed مرتبط (0). لا payment_fees مرتبطة (0).
-- ترتيب الحذف: payment_transactions أولاً ثم orders.
