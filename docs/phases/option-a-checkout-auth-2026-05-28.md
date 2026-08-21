# Option A — Checkout-Time Account Creation (28 May 2026)

قرار المالك (ثامر): مصادقة كاملة أثناء الدفع قبل الإطلاق.

## الجوهر

- **مستخدم مسجّل**: بانر أخضر + يُكمل مباشرة (لا كلمة مرور).
- **زائر جديد**: حقل كلمة مرور (8+ أحرف) يظهر بعد إدخال بريد صالح → `signUp` ينشئ
  حساباً + session فوري (auto-confirm ON) → الدفع سلس.
- **زائر عائد**: كشف ضمني (النهج B) — `signUp` يُرجع `user_already_exists` →
  تبديل تلقائي لوضع الدخول → `signInWithPassword` + رابط "نسيت كلمة المرور؟".

## الملفات

| الملف | التغيير |
|------|---------|
| `src/components/checkout/CheckoutAuthGate.tsx` | مكوّن جديد — 3 حالات (مسجّل/جديد/عائد) |
| `src/routes/checkout.$slug.tsx` | schema شرطي (`superRefine` + `authRef`) + تسلسل Auth→Session→Order→EdfaPay + كشف ضمني |
| `src/routes/register.tsx` | حذف شاشة "تحقّق من بريدك" الميتة → redirect مباشر إلى `/account` بعد `signUp` |

## التسلسل (checkout onSubmit)

1. تحقّق النموذج (schema شرطي حسب الوضع).
2. مصادقة: `signUp` (جديد) أو `signInWithPassword` (عائد) — مسجّل يتخطّى.
3. تأكيد `session.user.id` موجود قبل إنشاء الطلب.
4. إدراج الطلب مع `user_id` مباشرة (لا حاجة auto-claim لاحقاً).
5. `createEdfaPayCheckout`.

## التحقق

- **Build**: نظيف (Exit 0)، صفر unused imports، صفر TS errors.
- **State 1 (مسجّل)**: تحقق بصري ✅ — بانر أخضر + بريد الحساب على 375px RTL.
- **States 2/3 (جديد/عائد)**: تحقق بالكود — schema superRefine + كشف ضمني.
- **register**: beforeLoad redirect عند وجود session (لا شاشة ميتة) ✅.

## غير ملموس (محفوظ)

- `edfapay.functions.ts` + webhook بدون تغيير.
- Phase 1 (E164Phone) سليم.
- مسار الواتساب الدولي سليم.
- auto-confirm كما هو (لم يُغيَّر).
