# H.1.6 — Arabic Email Templates + Sender Branding

> **Owner Tasks (أحمد):** هذه المهام تُنفَّذ يدوياً عبر Lovable Cloud / Supabase Dashboard.
> Lovable Agent لا يملك صلاحية تعديل sender name أو email templates عبر API في هذه المرحلة.

---

## Step A — تغيير اسم المُرسِل (Sender Name)

**المسار في الـ Dashboard:**

1. افتح Lovable Cloud من شريط الأدوات الجانبي → **Connectors → Lovable Cloud → View Backend**.
2. من القائمة الجانبية للـ backend: **Authentication → Emails → SMTP Settings** (أو **Email Settings**).
3. ابحث عن حقل **Sender Name** (قد يظهر كـ "From Name" أو "Display Name").

**القيم:**

| الحقل | القيمة الحالية | القيمة الجديدة |
|---|---|---|
| Sender Name | `shahd` | `Shahid Store` |
| Sender Email | `no-reply@auth.lovable.cloud` | اتركه كما هو (سيتغيّر في Phase G مع custom domain) |

> **لماذا الإنجليزية؟** اسم المُرسِل يظهر في header الـ inbox عبر كل email clients (Gmail, Outlook, Apple Mail, Yahoo). النص الإنجليزي `Shahid Store` مضمون الظهور بدون مشاكل encoding على كل العملاء. أمّا محتوى الرسالة فيكون عربي RTL كامل (Step B).

4. احفظ التغييرات (**Save**).
5. اختبر بإنشاء حساب جديد — يجب أن يظهر المُرسِل: **Shahid Store \<no-reply@auth.lovable.cloud\>**.

---

## Step B — Arabic Email Templates (3 templates)

**المسار:**

Lovable Cloud Backend → **Authentication → Email Templates**

لكل قالب من الثلاثة: انسخ الـ **Subject** والـ **HTML Body** كما هو، ثم احفظ.

---

### Template 1 — Confirm Signup (تأكيد التسجيل)

**Subject:**

```
تأكيد إنشاء حسابك في شاهد ستور
```

**HTML Body:**

```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Tajawal', Arial, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; direction: rtl; text-align: right; }
  .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2); }
  .header { background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); padding: 32px; text-align: center; }
  .header h1 { color: #000000; margin: 0; font-size: 24px; font-weight: bold; }
  .content { padding: 32px; }
  .content h2 { color: #D4AF37; font-size: 20px; margin-bottom: 16px; }
  .content p { line-height: 1.8; color: #cccccc; margin-bottom: 16px; }
  .button { display: inline-block; background: #D4AF37; color: #000000 !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 24px 0; }
  .footer { background: #0a0a0a; padding: 24px; text-align: center; font-size: 12px; color: #666666; }
  .link { color: #D4AF37; word-break: break-all; font-size: 12px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🛡️ شاهد ستور</h1></div>
    <div class="content">
      <h2>مرحباً بك في شاهد ستور</h2>
      <p>شكراً لإنشاء حسابك معنا. لتفعيل حسابك والاستفادة من جميع خدمات شاهد ستور، يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">تأكيد البريد الإلكتروني</a>
      </div>
      <p style="font-size: 13px; color: #999;">أو انسخ الرابط التالي وافتحه في متصفّحك:</p>
      <p class="link">{{ .ConfirmationURL }}</p>
      <p style="margin-top: 32px; font-size: 13px; color: #999;">إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.</p>
    </div>
    <div class="footer">
      <p>شاهد ستور | shahidstore.net</p>
      <p>© 2026 جميع الحقوق محفوظة</p>
    </div>
  </div>
</body>
</html>
```

---

### Template 2 — Magic Link (رابط الدخول)

**Subject:**

```
رابط الدخول إلى حسابك في شاهد ستور
```

**HTML Body:** نفس Template 1 مع التعديلات التالية:

- `<h2>مرحباً بك في شاهد ستور</h2>` → `<h2>رابط الدخول السريع</h2>`
- الفقرة الأولى → `<p>اضغط الزر التالي لتسجيل الدخول إلى حسابك مباشرة:</p>`
- نص الزر → `تسجيل الدخول`
- الفقرة الأخيرة → `<p style="margin-top: 32px; font-size: 13px; color: #999;">صلاحية هذا الرابط ساعة واحدة فقط. إذا لم تطلبه، تجاهل الرسالة.</p>`

---

### Template 3 — Reset Password (إعادة تعيين كلمة المرور)

**Subject:**

```
إعادة تعيين كلمة المرور — شاهد ستور
```

**HTML Body:** نفس Template 1 مع التعديلات التالية:

- `<h2>مرحباً بك في شاهد ستور</h2>` → `<h2>إعادة تعيين كلمة المرور</h2>`
- الفقرة الأولى → `<p>تم طلب إعادة تعيين كلمة مرور حسابك. اضغط الزر التالي لتعيين كلمة مرور جديدة:</p>`
- نص الزر → `إعادة تعيين كلمة المرور`
- الفقرة الأخيرة → `<p style="margin-top: 32px; font-size: 13px; color: #999;">إذا لم تطلب هذا، تجاهل الرسالة وحسابك بأمان.</p>`

---

## Step C — اختبار نهائي

1. أنشئ حساب اختبار جديد (مثلاً `test-h16@mailinator.com`).
2. افتح inbox على https://www.mailinator.com/v4/public/inboxes.jsp?to=test-h16
3. تحقّق من:
   - ✅ Sender Name = **Shahid Store** (لا "shahd")
   - ✅ Subject = **تأكيد إنشاء حسابك في شاهد ستور**
   - ✅ Body = RTL عربي بالكامل
   - ✅ ألوان ذهبية (#D4AF37) + خلفية داكنة
   - ✅ زر "تأكيد البريد الإلكتروني" يعمل ويوجّه لـ `/account`
4. كرّر الاختبار لـ Reset Password (من صفحة "نسيت كلمة المرور").

---

## ملاحظات

- **Phase G (post-launch):** نقل المُرسِل لـ custom domain `notify.shahidstore.net` للحصول على `Shahid Store <no-reply@shahidstore.net>` بدلاً من `@auth.lovable.cloud`.
- **Tajawal font:** قد لا تكون مُحمَّلة في كل email clients. الـ `font-family` يتضمّن `Arial` كـ fallback آمن للعربية.
- لا تُعدّل auth flags الأخرى (auto_confirm_email, password_min_length, HIBP) — هذه مُغلقة في Phase F.0.
