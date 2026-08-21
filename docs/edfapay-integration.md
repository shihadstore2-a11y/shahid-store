# EdfaPay Integration — Shahid Store

> آخر تحديث: 21 مايو 2026 — Phase E closed

## 1. Architecture Overview

```
[Customer] → checkout.$slug → createEdfaPayCheckout (serverFn)
   ↓
[initiatePayment] → POST https://app-api.edfapay.com/api/v1/payment-gateway/initiate
   ↓
[redirectUrl] → EdfaPay Hosted Checkout (3DS + OTP)
   ↓
[Customer pays] → success_url / failure_url (browser redirect)
                ↘ callback_url (server-to-server webhook)
                  ↓
              [edfapay-webhook] → fetchPaymentStatus (server-to-server verify)
                  ↓
              [orders.status = paid]
```

**ملفات أساسية:**
| الملف | الدور |
|---|---|
| `src/lib/edfapay.server.ts` | REST client + helpers (server-only) |
| `src/lib/edfapay.functions.ts` | `createEdfaPayCheckout` server function |
| `src/routes/api/public/edfapay-webhook.ts` | Webhook handler |
| `src/routes/payment.success.tsx` / `payment.failed.tsx` | Return URLs |

## 2. Authentication

- **Mode**: `x-api-key` (header `X-API-KEY: <EDFAPAY_API_KEY>`)
- **Source of truth**: docs.edfapay.com + تأكيد Ashraf Emad (EdfaPay)
- **Secrets المطلوبة** (Cloud Secrets):
  - `EDFAPAY_API_KEY` — required
  - `EDFAPAY_AUTH_MODE` — يجب أن يساوي `x-api-key` (افتراضي إن غاب)
  - `EDFAPAY_BASE_URL` — optional override (default: `https://app-api.edfapay.com`)
  - `EDFAPAY_MODE` — `test` | `live`
  - `EDFAPAY_SDK_TOKEN` — غير مستخدم حالياً (احتياطي لو احتجنا Bearer)

## 3. Webhook Flow

- **URL المسجّل في Dashboard**: `https://shahidstore.net/api/public/edfapay-webhook`
- **استراتيجية الأمان**: لا نثق بالـ payload — نستعلم `fetchPaymentStatus(orderId)` server-to-server للتحقق.
- **Idempotency**: نتجاهل أي webhook بنفس `transactionId` لو سبق تسجيله بحالة `success`.
- **رد ثابت**: `200 OK` دائماً (حتى عند فشل التحقق) لمنع retries مفرطة من EdfaPay.

## 4. Status Mapping

| EdfaPay Status | داخلي (`payment_transactions.status`) | orders.status |
|---|---|---|
| Approved / success / settled / paid | `success` | `paid` |
| Declined / failed / rejected | `failed` | (لا تغيير — يسمح بإعادة المحاولة) |
| Pending / Redirect / processing | `initiated` | (لا تغيير) |
| Cancelled | `cancelled` | `cancelled` |

## 5. Common Issues + Solutions

| المشكلة | السبب | الحل |
|---|---|---|
| `HTTP 401 Unauthorized` | `EDFAPAY_API_KEY` خاطئ أو حساب test/live mismatch | تحقّق من Cloud Secrets + Dashboard EdfaPay |
| `استجابة بوابة الدفع غير متوقعة` | الـ response لا يحوي `redirectUrl` | راجع `extractRedirectUrl` logs (Top-level keys) |
| `unknown EDFAPAY_AUTH_MODE` warning | الـ Secret فيه قيمة غير `x-api-key` | حدّث الـ Secret إلى `x-api-key` lowercase |
| Webhook لا يصل | URL في Dashboard خاطئ، أو دومين غير مُصدَّق | تحقّق من `shahidstore.net/api/public/edfapay-webhook` يرد 200 على GET |
| 3DS OTP لا يصل | البطاقة test غير مفعّلة في Merchant | راسل EdfaPay support |

## 6. Test Cards Reference

| البطاقة | الرقم | النتيجة المتوقعة |
|---|---|---|
| Visa Test (نجاح) | `5123 4500 0000 0008` | Approved + OTP `123456` |
| Visa Test (فشل) | `5123 4500 0000 0016` | Declined |

> ⚠️ بطاقات الاختبار تعمل فقط في `EDFAPAY_MODE=test`.

## 7. Database Tables

- **`payment_transactions`**: سجل لكل محاولة دفع (initiated → success/failed/cancelled).
- **`orders`**: الطلب نفسه (status: pending → paid/cancelled).

## 8. Phase History

- **Phase A-D**: Discovery + REST migration + Patches 1-5 + Field expansion
- **Phase E (21 May 2026)**: ✅ End-to-end test ناجح (1 SAR + 3DS)
- **Phase F (next)**: Auto-delivery للاشتراكات بعد `orders.status = paid`
