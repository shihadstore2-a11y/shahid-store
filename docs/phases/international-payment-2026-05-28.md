# International Payment Enablement — EdfaPay (28 May 2026)

> القيد "Saudi only" كان قراراً في كودنا، لا قيداً من EdfaPay. هذه المرحلة فتحت الدفع بالبطاقة عالمياً.

## التغييرات المنفّذة (4)

### L2 — Server Schema (`src/lib/edfapay.functions.ts`)
- `SaudiPhoneE164` (`/^\+9665[0-9]{8}$/`) → `E164Phone` دولي (`/^\+[1-9][0-9]{6,14}$/`).
- إضافة `customerCountry` (ISO alpha-2, اختياري) إلى `CreateCheckoutInput` وتمريره لـ `initiatePayment`.

### L3 — Dynamic Address (`src/lib/edfapay.server.ts`) 🔴 الأهم
- إضافة `customerCountry` إلى `EdfaPayInitiateInput`.
- دالة `resolveBillingAddress(country)` + خريطة `BILLING_DEFAULTS` (21 دولة) → `payer_country`/`billing_country`/city/zip/address ديناميكية.
- Fallback إلى `SA` عند غياب الدولة. **لم يعد العنوان مثبّتاً على "SA"** — يمنع رفض fraud/AVS للبطاقات الدولية.

### L1 — UI Guards (`src/routes/checkout.$slug.tsx`)
- استيراد `detectCountry` وتمرير `customerCountry: detectCountry(phone)` عند الدفع.
- إزالة `disabled`/`opacity-50` عن زر البطاقة.
- زر الدفع EdfaPay متاح للجميع (لا ternary لواتساب) — أزيل شرط `(!!phoneRaw && !isSaudi)` من `disabled`.

### L4 — Texts + WhatsApp Secondary + FX
- بانر دولي جديد: "الدفع بالبطاقة متاح من السعودية وجميع أنحاء العالم 🌍" + إفصاح FX "💱 المبلغ بالريال السعودي، يُحوَّل بسعر صرف بنكك".
- الفوتر: "دفع آمن عبر بوابة معتمدة — تحقّق 3D Secure".
- واتساب صار **رابطاً ثانوياً صغيراً** أسفل زر الدفع: "تفضّل الإكمال يدوياً عبر واتساب؟" (insurance، غير إجباري).

## ما لم يُمَسّ (EdfaPay binding سليم)
- المفاتيح/التوكنات/الأسرار، webhook URL + منطقه، `fetchPaymentStatus`، idempotency، D.2 auto-claim، `EDFAPAY_MODE`/`AUTH_MODE`، العملة `SAR`.
- مسار السعودي: الأرقام السعودية تطابق E.164 + `detectCountry` يرجع "SA" → `payer_country: SA` كما كان.

## التحقق
- `tsc --noEmit` → 0 أخطاء.

## معلّق (خارج الكود)
- ⏳ تأكيد cross-border acquiring من أشرف (EdfaPay) — هل الحساب مفعّل لاستقبال بطاقات صادرة خارج السعودية. التفعيل التقني جاهز؛ ينتظر تأكيد الـ merchant.
