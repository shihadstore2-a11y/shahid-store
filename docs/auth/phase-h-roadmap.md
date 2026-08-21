# Phase H — Post-Launch Auth UX Roadmap

**Status:** Deferred from F.8 per Senior R3 discipline
**Date:** 25 May 2026

## Deferred Items (require user feedback validation)

### 1. Unified Auth Page (`/auth.tsx`)
- صفحة واحدة بتبويبات Login/Signup
- تقدير: 2–3 ساعات

### 2. Profile ↔ Checkout Binding
- تعبئة بيانات الـ Checkout تلقائياً من `profiles`
- حفظ التحديثات في `profiles` بعد الطلب
- تقدير: 2–3 ساعات

### 3. "احفظ بياناتي" Button (post-checkout للزائر)
- Signup prompt مع بيانات معبأة مسبقاً
- تقدير: ساعة

### 4. signInWithOAuth Provider Migration
- توحيد كامل عبر `lovable.auth.signInWithOAuth` (الكود الحالي يستخدمه فعلاً في login.tsx)
- تقدير: 1–2 ساعة
- ملاحظة: يُعاد فحصه بعد بيانات حقيقية

## متى نبني هذه المرحلة؟
بعد 30–50 طلباً حقيقياً — feedback المستخدمين يحدد الأولوية.

## النطاق الحالي (Day 2–4)
- Phase D: Inventory (12–14h)
- Phase E: Accounting (8–10h)
- Phase C: Launch
