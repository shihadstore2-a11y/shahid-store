# Phase 2.5 — UX Gaps Closure (28 May 2026)

**Status**: ✅ Complete  
**Authority**: PM Ahmed (Senior 16y) — PATH B+ approved  
**Quality target**: 9.5+/10

## Scope

PATH B+: ثغرات حقيقية قبل الإطلاق فقط. Polish والاستراتيجيات مؤجَّلة.

| Sub-phase | البند | الحالة |
|-----------|------|--------|
| 2.5.A | Forgot/Reset Password flow | ✅ |
| 2.5.B | Reviews limits (homepage 5 / public 100) | ✅ |
| 2.5.C | Credentials URL fallback (WhatsApp) | ✅ |
| — | Checkout password (Option B) | 🚫 رُفض |
| — | Login UX polish | ⏳ مؤجَّل |

## Files Created
- `src/routes/forgot-password.tsx` — طلب رابط الاستعادة
- `src/routes/reset-password.tsx` — تعيين كلمة مرور جديدة

## Files Modified
- `src/routes/login.tsx` — إضافة رابط "نسيت كلمة المرور؟"
- `src/lib/admin-reviews.ts` — انقسام إلى `publicReviewsHomepageQueryOptions` (limit 5) و `publicReviewsFullQueryOptions` (limit 100). `publicReviewsQueryOptions` يبقى alias للتوافق العكسي.
- `src/components/home/StoreReviewsSection.tsx` — قبول `variant?: "homepage" | "full"`، default = homepage (5)
- `src/routes/reviews.tsx` — استخدام `variant="full"`
- `src/components/orders/CredentialsCard.tsx` — `UrlFallback` component يعرض رسالة + زر واتساب عند غياب `subscription_url`

## Auth Recovery Flow

```
/login → "نسيت كلمة المرور؟" → /forgot-password
                                      ↓
                          resetPasswordForEmail(email, redirectTo=/reset-password)
                                      ↓
                          Supabase recovery email → click link
                                      ↓
                          /reset-password (hash parsed by SDK)
                                      ↓
                          onAuthStateChange: PASSWORD_RECOVERY
                                      ↓
                          updateUser({ password }) → /account
```

### قالب البريد (Supabase Recovery)
يُستخدم القالب الافتراضي من Supabase Auth — يحتوي على `{{ .ConfirmationURL }}` التي تعيد توجيه المستخدم إلى `${origin}/reset-password` مع `access_token` و `type=recovery` في URL hash. SDK في `@supabase/supabase-js` يستهلك الـ hash تلقائياً ويُطلق حدث `PASSWORD_RECOVERY` الذي تستمع له الصفحة.

## Edge Cases Handled
- Rate limiting في `resetPasswordForEmail` (رسالة عربية واضحة)
- صلاحية الرابط منتهية → redirect إلى `/forgot-password`
- لا توجد recovery session → بعد 2s → عرض صفحة خطأ + زر "طلب رابط جديد"
- كلمة المرور = القديمة → toast.error
- Validation: min 8 chars + match confirm

## Verification
- Build: production npm run build → سيُتحقق
- Routes file-naming: `/forgot-password` و `/reset-password` كملفات flat
- TanStack auto-generates routeTree.gen.ts

## Phases Locked (لم تُلمس)
- ✅ Phase 1 (International Phone)
- ✅ Phase 2 (E.2.3 Financial Reports)
- ✅ Phase H locked items
- ✅ EdfaPay code
- ✅ CheckoutAuthSection (تم رفض إعادته)
