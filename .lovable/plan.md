
## تقرير المرحلة 1 — Pre-Implementation (Read-only)

### Q1 — Unconfirmed users (مفاجأة: 2 فقط لا 4)

| # | Email | Full name | Created | id |
|---|---|---|---|---|
| 1 | `thamer585891@gmail.com` | Saalla | 2026-05-25 03:52 | `e2d72abd-…d5d7` |
| 2 | `+h1test@gmail.com` | اختبار | 2026-05-25 09:39 | `0592abef-…4874` |

⚠️ **تباين مع توقّع الأمر**: الأمر يفترض 3 thamer accounts + test. الواقع: المستخدمَين `thamer585899@gmail.com` و `thamer@shahidstore.net` **مؤكَّدان بالفعل** (غالباً مرّا عبر مسار سابق). أوصي بقصر الـ backfill على الموجود فعلياً (`WHERE email_confirmed_at IS NULL`) بدل قائمة إيميلات صريحة قد تُفشل الـ ASSERT.

### Q2 — لا banned / لا deleted
صفر صفوف. آمن.

### Q3 — `src/routes/login.tsx`
- `onSubmit` يستدعي `supabase.auth.signInWithPassword(v)` ثم على أي `error` يعرض toast واحد: `"بيانات الدخول غير صحيحة"` (يطمس `email_not_confirmed`).
- لا state إضافي، لا Resend.
- Google button + `validateSearch` + `beforeLoad` + `search.redirect` — **لن تُلمس** (F.8 محفوظ).

### Q4 — `src/routes/register.tsx`
- بعد `signUp` ناجح: `toast.success("تم إنشاء الحساب! تحقق من بريدك لتفعيله.")` ثم `navigate({ to: "/login" })` فوراً → المستخدم يفقد الرسالة ويحاول الدخول → يدخل في حلقة "بيانات غير صحيحة".
- `beforeLoad` + Zod schema — **لن تُلمس**.

### Q5 — Supabase resend API
مدعوم في `supabase-js v2`:
```ts
supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } })
```
وكشف الخطأ: `AuthApiError` يحمل `code: 'email_not_confirmed'` (أو `message` يحوي `Email not confirmed`). سنفحص الاثنين للأمان.

### Q6 — مكوّن القائمة
**الملف**: `src/components/Header.tsx` (Sheet من shadcn، side="right", `w-[300px] sm:w-[340px]`).

البنية الحالية داخل `<nav>`:
1. عنوان "التصنيفات" + 3 روابط فالكون/هولك/سمارترز
2. فاصل `<div className="my-2 border-t border-border" />`
3. `mainNav` (من نحن / التقييمات / طريقة التفعيل)
4. فاصل
5. `helpLinks` (تواصل معنا)

`closeMenu` غير دالة منفصلة — يستخدم `onClick={() => setMenuOpen(false)}` على كل Link. لا يستورد `useAuth` حالياً. كل العناصر تشترك في pattern:
```
className="rounded-md px-2 py-2.5 text-sm font-bold text-foreground hover:bg-secondary"
```
الأيقونات الموجودة (في التصنيفات فقط) مقاس 22px داخل `h-6 w-6`. لقسم "حسابي" سأستخدم أيقونات lucide بمقاس `h-4 w-4` متّسقاً مع نية الأمر الأصلي.

### Q7 — `useAuth.signOut`
موجود ومُصدَّر:
```ts
signOut: async () => { await supabase.auth.signOut(); }
```
لا redirect ضمنه (يحدث في صفحة الحساب بـ `window.location.href = "/"`). سنُجري redirect بسيطاً بعد signOut من القائمة عبر `window.location.href = "/"` (نفس النمط القائم) لضمان مسح جميع caches.

---

## خطّة التنفيذ (4 خطوات + verify)

### Step 1 — Migration ذرّية (idempotent)
ملف: `supabase/migrations/<ts>_h1_6_confirm_pre_launch_users.sql`

```sql
BEGIN;

DO $$ DECLARE v int; BEGIN
  SELECT COUNT(*) INTO v FROM auth.users WHERE email_confirmed_at IS NULL;
  RAISE NOTICE '[H.1.6 PRE] unconfirmed = %', v;
END $$;

UPDATE auth.users
   SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
       confirmed_at       = COALESCE(confirmed_at, NOW())
 WHERE email_confirmed_at IS NULL
   AND email IN ('thamer585891@gmail.com', '+h1test@gmail.com');

DO $$ DECLARE v int; BEGIN
  SELECT COUNT(*) INTO v FROM auth.users WHERE email_confirmed_at IS NULL;
  RAISE NOTICE '[H.1.6 POST] unconfirmed = %', v;
  ASSERT v = 0, 'BACKFILL INCOMPLETE: % users still unconfirmed', v;
END $$;

COMMIT;
```
**ملاحظة senior**: قصرتُ القائمة على الإيميلَين الفعليَّين بدلاً من قائمة الأمر (3 thamer + test). البديل أكثر أماناً لأن ASSERT v=0 سيمر، ولا نلمس أي صف مؤكَّد بالفعل.

**Confidence: 99%**

### Step 2 — `src/routes/login.tsx` (تعديل onSubmit + UI صغيرة)
- إضافة `const [unconfirmedEmail, setUnconfirmedEmail] = useState<string|null>(null)` و `const [resending, setResending] = useState(false)`.
- في `onSubmit`: عند `error` افحص:
  - `error.code === 'email_not_confirmed'` أو `/email not confirmed/i.test(error.message)` → `setUnconfirmedEmail(v.email)` + toast إعلامي ("بريدك لم يُؤكَّد بعد").
  - وإلا → toast الحالي.
  - عند نجاح: `setUnconfirmedEmail(null)` ثم navigate.
- `handleResend`: يستدعي `supabase.auth.resend({ type: 'signup', email: unconfirmedEmail!, options: { emailRedirectTo: window.location.origin + '/account' } })` مع toast نجاح/فشل.
- UI: بطاقة شرطية `{unconfirmedEmail && (…)}` أسفل الفورم وفوق قسم "أو"، بنفس tokens (`border-border bg-card`).
- **بدون لمس**: Google button، validateSearch، beforeLoad، search.redirect، Zod schema.

**Confidence: 95%**

### Step 3 — `src/routes/register.tsx` (استبدال redirect بـ success state)
- `const [sentTo, setSentTo] = useState<string|null>(null)`.
- في `onSubmit` بعد نجاح: `setSentTo(v.email)` (بدون `navigate`).
- Conditional render: إذا `sentTo` اعرض بطاقة نجاح: عنوان "تحقّق من بريدك ✉️" + الإيميل + تعليمات + رابطان: `<Link to="/login">انتقل لتسجيل الدخول</Link>` و زر "إعادة الإرسال" يستدعي `supabase.auth.resend({ type: 'signup', email: sentTo, options: { emailRedirectTo: window.location.origin + '/account' } })`.
- **بدون لمس**: beforeLoad، schema، cross-link.

**Confidence: 95%**

### Step 4 — `src/components/Header.tsx` (إضافة قسم "حسابي" داخل Sheet)
- imports جديدة: `useAuth` + `toast` من sonner + أيقونات `User, LogIn, UserPlus, Package, Settings, LogOut`.
- بعد قسم `mainNav` وقبل الفاصل الذي يسبق `helpLinks`، أُدخل:
  ```tsx
  <div className="my-2 border-t border-border" />
  <p className="px-1 py-1 text-[11px] font-bold uppercase text-muted-foreground">حسابي</p>
  {user ? (
    <>
      <Link to="/account/orders" onClick={() => setMenuOpen(false)} className={navItemCls}>
        <Package className="h-4 w-4" /> طلباتي
      </Link>
      <Link to="/account" onClick={() => setMenuOpen(false)} className={navItemCls}>
        <Settings className="h-4 w-4" /> بياناتي
      </Link>
      <button
        onClick={async () => {
          await signOut();
          setMenuOpen(false);
          toast.success("تم تسجيل الخروج");
          window.location.href = "/";
        }}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </button>
    </>
  ) : (
    <>
      <Link to="/login" onClick={() => setMenuOpen(false)} className={navItemCls}>
        <LogIn className="h-4 w-4" /> تسجيل الدخول
      </Link>
      <Link to="/register" onClick={() => setMenuOpen(false)} className={navItemCls}>
        <UserPlus className="h-4 w-4" /> إنشاء حساب جديد
      </Link>
    </>
  )}
  ```
  حيث `navItemCls = "flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-bold text-foreground hover:bg-secondary"`.
- **بدون لمس**: logo، categories، mainNav, helpLinks، CategoriesBar، scrolled logic، WhatsAppFloat (خارج الملف أصلاً).

**Confidence: 92%** (الـ -8% احتياط لأي type strict على `<Link to="...">` لمسارات `_authenticated/*` — مُجرَّبة في `account.tsx` وتعمل، إذاً 95% فعلياً).

### Step 5 — Verify
- migration RAISE NOTICE PRE=2, POST=0, ASSERT ✅.
- إعادة فحص: `SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL` = 0.
- typecheck + build (تلقائي).
- 8 mental tests كما في الأمر.

### Side-effects (مضمونة عدم المساس)
F.0 auto_confirm=false ✅ | F.3 webhook ✅ | F.4 CheckoutAuthSection ✅ | F.5 useAuth (read-only) ✅ | F.8 login Google + redirect ✅ | H.1 trigger + RLS ✅ | brand/logo/colors ✅ | categories ✅ | existing menu items ✅ | WhatsAppFloat ✅ | drawer animation ✅.

### Confidence إجمالي: **96%**
جاهز للتنفيذ فور `✅ نفّذ المرحلة 2`.
