# 📋 Phase F.0 — Owner Manual Checklist

**Date:** 23 May 2026
**Owner:** أحمد (PM/CTO)
**Time:** 15-20 min في Supabase Dashboard
**Scope:** تهيئة Auth foundations للـ Smart Hybrid Pro flow

---

## 🎯 الهدف

تهيئة Supabase Auth للـ Smart Hybrid Pro checkout. **Setup أوّل مرة فقط — لن يُعاد**.

ما أنجزته Lovable تلقائياً (لا تكرّره):
- ✅ `password_hibp_enabled = true` — حظر كلمات السر المسرَّبة
- ✅ `auto_confirm_email = false` — التحقق من البريد مطلوب
- ✅ `external_anonymous_users_enabled = false` — لا حسابات مجهولة
- ✅ `disable_signup = false` — التسجيل مفتوح

---

## ✅ Pre-Flight Check

افتح Lovable Cloud Dashboard من الـ sidebar في Lovable → **Connectors → Lovable Cloud → View Backend** → Authentication.

> ملاحظة: الـ URL المباشر داخلي ويُعرَض في الـ "View Backend" button. لا تشاركه.

---

## Task 1: Site URL Verification (2 min)

**المسار**: Authentication → URL Configuration → Site URL

| Field | القيمة المطلوبة |
|-------|----------------|
| Site URL | `https://shahidstore.net` |

إن مختلف، عدّله ثم Save.

- [ ] تأكيد: Site URL = `https://shahidstore.net`

---

## Task 2: Redirect URLs Allowlist (3 min)

**المسار**: Authentication → URL Configuration → Redirect URLs

تأكّد من وجود **كل** الـ entries التالية. إن مفقود واحد، اضغط **Add URL**:

```
https://shahidstore.net/**
https://www.shahidstore.net/**
https://*.lovable.app/**
http://localhost:5173/**
```

- [ ] `https://shahidstore.net/**` موجود
- [ ] `https://www.shahidstore.net/**` موجود
- [ ] `https://*.lovable.app/**` موجود (للـ preview)
- [ ] `http://localhost:5173/**` موجود (اختياري للـ dev)

---

## Task 3: Email Templates Arabic Translation (10 min)

**المسار**: Authentication → Email Templates

⚠️ **مهم**: 
- استخدم **HTML mode** (ليس plain text)
- احتفظ بمتغيّر `{{ .ConfirmationURL }}` كما هو حرفياً
- بعد كل template: اضغط **Save changes**

---

### Template 1: Confirm Signup

**Subject:**
```
تأكيد بريدك الإلكتروني — شاهد ستور
```

**Message body (HTML):**
```html
<div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1f2937;">
  <h2 style="color: #D4AF37; margin: 0 0 16px;">أهلاً بك في شاهد ستور</h2>
  <p style="margin: 0 0 12px;">السلام عليكم،</p>
  <p style="margin: 0 0 12px;">شكراً لتسجيلك في شاهد ستور — متجرك للاشتراكات الرقمية.</p>
  <p style="margin: 0 0 12px;">اضغط الزر أدناه لتأكيد بريدك الإلكتروني:</p>
  <p style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}"
       style="background: #D4AF37; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
      تأكيد البريد الإلكتروني
    </a>
  </p>
  <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">
    الرابط صالح لـ 24 ساعة. لو لم تطلبه، تجاهل الرسالة.
  </p>
  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
    فريق شاهد ستور — <a href="https://shahidstore.net" style="color: #D4AF37; text-decoration: none;">shahidstore.net</a>
  </p>
</div>
```

- [ ] محفوظ

---

### Template 2: Magic Link

**Subject:**
```
رابط الدخول — شاهد ستور
```

**Message body (HTML):**
```html
<div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1f2937;">
  <h2 style="color: #D4AF37; margin: 0 0 16px;">رابط دخولك جاهز</h2>
  <p style="margin: 0 0 12px;">السلام عليكم،</p>
  <p style="margin: 0 0 12px;">اضغط الزر أدناه للدخول إلى حسابك في شاهد ستور:</p>
  <p style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}"
       style="background: #D4AF37; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
      الدخول الآن
    </a>
  </p>
  <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">
    الرابط صالح لـ ساعة واحدة. لو لم تطلبه، تجاهل الرسالة.
  </p>
  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
    فريق شاهد ستور — <a href="https://shahidstore.net" style="color: #D4AF37; text-decoration: none;">shahidstore.net</a>
  </p>
</div>
```

- [ ] محفوظ

---

### Template 3: Reset Password

**Subject:**
```
إعادة تعيين كلمة السر — شاهد ستور
```

**Message body (HTML):**
```html
<div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1f2937;">
  <h2 style="color: #D4AF37; margin: 0 0 16px;">إعادة تعيين كلمة السر</h2>
  <p style="margin: 0 0 12px;">السلام عليكم،</p>
  <p style="margin: 0 0 12px;">طلبت إعادة تعيين كلمة سرّ حسابك. اضغط الزر أدناه:</p>
  <p style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}"
       style="background: #D4AF37; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
      إعادة تعيين كلمة السر
    </a>
  </p>
  <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">
    الرابط صالح لـ ساعة واحدة. لو لم تطلبه، تجاهل الرسالة.
  </p>
  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
    فريق شاهد ستور — <a href="https://shahidstore.net" style="color: #D4AF37; text-decoration: none;">shahidstore.net</a>
  </p>
</div>
```

- [ ] محفوظ

---

## Task 4: Email Provider Verification (1 min)

**المسار**: Authentication → Providers → Email

| Setting | المطلوب |
|---------|---------|
| Enable Email provider | ✅ ON |
| Confirm email | ✅ ON |
| Secure email change | ✅ ON (recommended) |
| Secure password change | ✅ ON (recommended) |

> Magic Link لا يحتاج toggle منفصل — هو مُتاح تلقائياً طالما Email provider مُفعَّل و templates معدّة.

- [ ] Email provider مُفعَّل
- [ ] Confirm email مُفعَّل

---

## Task 5: Google OAuth Verification (1 min)

**المسار**: Authentication → Providers → Google

تأكّد:
- [ ] Google provider مُفعَّل (يستخدم Lovable Managed credentials — لا حاجة لإعداد يدوي)

> الكود الحالي في `src/routes/login.tsx` يستخدم Google sign-in بنجاح، أي أنه مُفعَّل أصلاً.

---

## 🎉 Completion

عند الانتهاء من كل المهام، أرسل في الـ chat:

```
F.0 Owner tasks COMPLETED ✅
```

---

## 🔬 Test Scenarios (تُجرى لاحقاً في F.8 — لا الآن)

| Scenario | المتوقَّع |
|----------|-----------|
| New user signup | Email عربي يصل بـ "أهلاً بك في شاهد ستور" |
| Magic Link request | Email عربي يصل بـ "رابط دخولك جاهز" |
| Reset password | Email عربي يصل بـ "إعادة تعيين كلمة السر" |
| Google OAuth | redirect نظيف إلى `/account` بعد القبول |

---

## ⚠️ Known Limitations (Phase G territory)

| Limitation | الأثر | Mitigation Phase |
|------------|--------|------------------|
| Email من `noreply@mail.app.supabase.io` (ليس shahidstore.net) | احتمال spam folder | Phase G — Email Domain setup |
| Rate limit ~4 emails/hour (free tier) | كافٍ لـ Soft Launch 5-10 طلبات | Phase G — Resend/SendGrid |
| لا SPF/DKIM/DMARC للدومين | Email deliverability محدودة | Phase G |

**القرار**: مقبول لـ Soft Launch. سيُعاد التقييم بعد أول 10-20 طلب حقيقي.

---

**Lovable portion**: ✅ COMPLETED (configure_auth + this doc)
**Owner portion**: ⏳ PENDING (5 tasks أعلاه)
**Next phase**: F.1 — Email Required in Checkout (يبدأ parallel)
