# D.2 Tech Debt (Post-Launch)

تاريخ الإنشاء: 27 May 2026 — بعد إطلاق D.2 Auto-Claim.

## Priority Items

### 1. `subscription_inventory.status` → enum
- **Current:** `text` (free string)
- **Target:** `ENUM('available', 'reserved', 'claimed', 'expired')`
- **Risk:** typos مسموحة اليوم (مثل `'avilable'` ستمر بصمت)
- **الحل:** migration لتحويل العمود لـ enum مع backfill آمن

### 2. تنظيف منتج `edfa-test`
- منتج تجريبي أُنشئ أثناء إعداد EdfaPay
- يجب حذفه أو ضبط `is_active = false`
- ليس blocking لكن مشوّش في لوحة الإدارة

### 3. زر "إعادة محاولة" يدوي للأدمن
- زر "إعادة محاولة التسليم" للطلبات بحالة `paid` وغير `fulfilled`
- مفيد عندما يضيف ثامر مخزوناً **بعد** أن دفع العميل
- الحالة الحالية: إعادة التشغيل عبر محاكاة webhook فقط

### 4. لوحة مراقبة D.2 (Observability)
- نسبة نجاح Auto-Claim
- تحليل أسباب الفشل (`no_stock`, `disabled`, ...)
- مقاييس time-to-fulfill
- تنبيهات عند انخفاض المخزون

## Notes
- D.2 يعمل **non-blocking** — أي فشل في الـ RPC لا يكسر webhook
- جميع المحاولات مُسجَّلة في `admin_audit_logs` بـ `action = 'auto_claim_subscription'`
- `claimed_role` يُتتبع (primary/backup) لكل اشتراك مسحوب
