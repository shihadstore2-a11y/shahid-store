# EdfaPay Go-Live Checklist

> الهدف: التحويل من Test mode إلى Live mode بدون انقطاع.

## Phase 1 — Pre-flight Checks (قبل الإيميل)

- [ ] اختبار End-to-End ناجح بـ 1 SAR في Test mode (✅ تم 21 May)
- [ ] Webhook URL مُسجَّل صحيح في Dashboard: `https://shahidstore.net/api/public/edfapay-webhook`
- [ ] `EDFAPAY_API_KEY` موجود في Cloud Secrets
- [ ] `EDFAPAY_AUTH_MODE = x-api-key` (lowercase، بدون warnings في logs)
- [ ] DNS + SSL على `shahidstore.net` يعمل (HTTPS صالح)
- [ ] صفحة `/payment/success` + `/payment/failed` تعمل
- [ ] جدول `payment_transactions` يستقبل الـ inserts بنجاح
- [ ] `orders.status` يتحدّث إلى `paid` بعد دفع ناجح
- [ ] لا `null` values مُرسَلة في `initiatePayment` payload (راجع audit أدناه)

## Phase 2 — Email to EdfaPay

**To**: support@edfapay.com (CC: Ashraf Emad)
**Subject**: Request to Activate Live Mode — Shahid Store (Merchant ID: ___)

**Body** (template):
```
Hello EdfaPay Team,

We have successfully completed end-to-end testing on Test mode
with a 1 SAR transaction (3DS flow + OTP + webhook received).

Please activate Live mode for our merchant account.

Merchant ID: ___
Domain: https://shahidstore.net
Webhook URL: https://shahidstore.net/api/public/edfapay-webhook

We confirm:
- All required parameters are sent (no null values)
- HTTPS endpoint with valid SSL
- Production-ready error handling

Thank you,
Ahmed — Shahid Store
```

## Phase 3 — Switch to Live (بعد تأكيد EdfaPay)

- [ ] حدّث Cloud Secret `EDFAPAY_MODE` من `test` إلى `live`
- [ ] (لو زوّدونا بـ Live API Key مختلف) حدّث `EDFAPAY_API_KEY`
- [ ] أعد deploy للموقع
- [ ] تحقّق من logs: `[EdfaPay] base URL default: https://app-api.edfapay.com`

## Phase 4 — Post-Live Verification (أول 24 ساعة)

- [ ] اختبار بطاقة حقيقية بأصغر مبلغ (5 SAR على منتج رخيص)
- [ ] تأكّد من وصول webhook + `orders.status = paid`
- [ ] راقب `payment_transactions` بـ `status = failed` (اطلب reason من EdfaPay)
- [ ] راقب Cloudflare logs لأي 5xx من webhook
- [ ] أكّد التحويل المالي بعد T+2 days (settlement window)

## Phase 5 — Rollback Plan

لو حصل خلل حرج خلال أول 24 ساعة:

1. **خطوة فورية**: حدّث Cloud Secret `EDFAPAY_MODE` من `live` إلى `test` — كل المعاملات الجديدة ستفشل بأمان.
2. **بديل**: اخفِ خيار "بطاقة" من Checkout مؤقتاً (اعرض WhatsApp فقط).
3. **اتصل بـ EdfaPay**: support@edfapay.com — اطلب logs للمعاملات الفاشلة.
4. **DB cleanup**: لا تحذف `payment_transactions` — استخدمها للتحقيق.
5. **للعملاء المتأثرين**: استرجاع يدوي عبر Dashboard EdfaPay (لو خُصِم بدون تفعيل).

## ⚠️ Known Risks

1. **3DS قد يفشل لبعض البنوك السعودية** — احتفظ بـ WhatsApp كـ fallback.
2. **Webhook retries** — EdfaPay يعيد المحاولة عدة مرات؛ idempotency check يحمينا.
3. **Settlement delay** — المبلغ يصل بعد 1-2 يوم عمل (طبيعي).
