# تقرير فحص واختبار الحالة المرجعية للنظام الحالي (Baseline Audit Report)
**تاريخ الفحص:** 8 سبتمبر 2026  
**الملف المرجعي:** `docs/pre-cobra-test.md`  
**الهدف:** توثيق شامل للحالة التشغيلية والبرمجية وقاعدة البيانات لمتجر "شاهد ستور" (Shahid Store) والمنصة الأم قبل البدء بأي مرحلة من مراحل تطوير متجر Cobra، ليكون هذا التقرير نقطة ارتكاز (Baseline) للتحقق من عدم تأثر النظام الحالي.

---

## 1. اختبار الوصول والتشغيل (Access & Runtime Verification)

### 1.1 بيئة التشغيل وإصدارات النظام
| الأداة / الحزمة | الإصدار المسجل | الحالة |
| :--- | :--- | :--- |
| **Node.js** | `v24.16.0` | متطابق ومستقر |
| **npm** | `11.13.0` | متطابق ومستقر |
| **Git Branch** | `main` | محدث ونظيف بالكامل (`working tree clean`) |
| **آخر Commit مسجل** | `7b491e6` (`fix(storage): unify store media in STORE_ID folder...`) | مرفوع على `digitaneo/main` و `origin/main` |
| **محرك المتجر** | TanStack Start (SSR) + Vite + Tailwind CSS | متوافق مع Cloudflare Workers |
| **بيئة النشر** | Cloudflare Workers (`wrangler.jsonc`) | `name: shahid-store` |

### 1.2 فحص الأخطاء السابقة (Existing Issues Check)
1. **خطأ RLS السابق (`new row violates row-level security policy`):**
   - تم حله بالكامل وتأكيده عبر إضافة `DEFAULT store_id` وتريجر `trg_ensure_store_id` في [09_fix_product_rls_policy.sql](file:///c:/Users/Digitaneo/Desktop/dev/shahid/supabase_sql_snippets/09_fix_product_rls_policy.sql).
2. **خطأ المجلدات العشوائية في Storage (`crypto.randomUUID()`):**
   - تم تنظيف التخزين بالكامل وحذف كافة المجلدات العشوائية.
   - تم توحيد مسار رفع الصور ليكون دائماً داخل `product-images/7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01/`.
3. **أخطاء بيئية حالية معروفة:**
   - مفاتيح بوابة الدفع (Edfapay API Keys) في وضع تجريبي غير مفعلة للإنتاج الفعلي (Sandbox/Test mode).

---

## 2. اختبار قاعدة البيانات (Database State & Schemas Audit)

### 2.1 اختبار الاتصال والصلاحيات
* **مزود قاعدة البيانات:** Supabase PostgreSQL (`zvowztkpigjauvyavapl.supabase.co`).
* **حالة الاتصال:** ✅ ناجح 100% عبر REST API و Service Role Key.
* **إصدار التخزين:** PostgREST متصل ومتزامن.

### 2.2 إحصائيات الجداول الحالية (Live Records Count)
تم استخراج عدد السجلات الفعلي لجميع الجداول عبر فحص مباشر:

| الجدول (Table) | عدد السجلات الحالي (Baseline Count) | حالة الفحص | الوصف المعماري |
| :--- | :---: | :---: | :--- |
| `public.stores` | **1** | ✅ سليم | متجر شاهد ستور (`7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01`) |
| `public.store_members` | **2** | ✅ سليم | ربط المالك والمدير العام بالمتجر |
| `public.products` | **13** | ✅ سليم | باقات واشتراكات متجر شاهد النشطة |
| `public.categories` | **5** | ✅ سليم | تصنيفات الباقات (فالكون، هالك، سمارت، إلخ) |
| `public.coupons` | **2** | ✅ سليم | كوبونات الخصم الفعالة للمتجر |
| `public.inventory_accounts` | **0** | ✅ سليم | جدول المخزون الآلي (فارغ حالياً) |
| `public.orders` | **1** | ✅ سليم | طلب تجريبي مسجل بالمتجر |
| `public.store_settings` | **4** | ✅ سليم | إعدادات الهوية والبوابات لمتجر شاهد |
| `public.profiles` | **5** | ✅ سليم | ملفات المستخدمين والعملاء المسجلين |
| `public.admin_users` | **10** (2 فريدين) | ✅ سليم | سجلات الإدارة للمالك والمدير العام |
| `public.user_roles` | **3** | ✅ سليم | تعيين الأدوار (`super_admin` و `admin`) |
| `public.subscription_requests` | **0** | ✅ سليم | طلبات اشتراكات المنصة الأم |
| `public.generations` | **0** | ✅ سليم | سجلات استوديو الذكاء الاصطناعي للمنصة |
| `public.campaign_packs` | **0** | ✅ سليم | حزم حملات المنصة الأم |
| `public.contact_submissions` | **0** | ✅ سليم | رسائل نموذج الاتصال |

### 2.3 فحص المفاتيح والعلاقات (Foreign Keys & Relations)
* جدول `products` مرتبط مع `categories(id)` بـ `ON DELETE SET NULL`.
* جدول `products`، `categories`، `coupons`، `orders`، `inventory_accounts` مرتبطة بـ `stores(id)` عبر `store_id` بـ `ON DELETE CASCADE`.
* جميع الحقول تحتوي على القيمة الافتراضية: `'7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01'`.

### 2.4 فحص سلال التخزين (Storage Buckets Status)
يوجد حالياً **9 باكتات** رسمية مسجلة في Supabase Storage:
1. `product-images`: يحتوي على مجلد المتجر الموحد `7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01/` ويضم **14 صورة معتمدة** بدون أي مجلدات عشوائية.
2. `products`: يحتوي على 10 صور أساسية قديمة (محفوظة كأصول أولية).
3. `receipts`: باكت إيصالات المتجر (0 ملفات حالياً).
4. `payment-receipts`: باكت إيصالات المنصة الأم (Private).
5. `campaign-product-images`: باكت استوديو حملات المنصة الأم (Public).
6. `generated-videos`: باكت فيديوهات الذكاء الاصطناعي للمنصة الأم (Private).
7. `generated-images`: باكت صور الذكاء الاصطناعي للمنصة الأم (Private).
8. `generated-assets`: باكت وسائط إضافية.
9. `activation-step-images`: باكت شروحات التفعيل.

---

## 3. اختبار المصادقة والصلاحيات (Authentication & RBAC Audit)

### 3.1 آليات المصادقة (Auth Flows)
* **تسجيل الدخول (Customer Login):** عبر [login.tsx](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/src/routes/login.tsx) باستخدام Supabase Email & Password.
* **تسجيل حساب جديد (Customer Register):** عبر [register.tsx](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/src/routes/register.tsx).
* **استعادة كلمة المرور:** عبر [forgot-password.tsx](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/src/routes/forgot-password.tsx) ورابط الاسترجاع [reset-password.tsx](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/src/routes/reset-password.tsx).
* **تسجيل دخول الإدارة (Admin Login):** معزول عبر [admin.login.tsx](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/src/routes/admin.login.tsx).

### 3.2 حماية الصفحات والـ Guards (Protected Routes)
* **مسار الإدارة `/_admin`:** محمي بحاجز برمجي في [_admin.tsx](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/src/routes/_admin.tsx):
  * يتحقق من وجود جلسة فعالة `supabase.auth.getSession()`.
  * يستعلم جدول `admin_users` للتأكد من أن `is_active = true`.
  * في حال عدم وجود صلاحية إدارية يتم التحويل فوراً لصفحة الخطأ أو تسجيل الدخول.
* **مصفوفة الصلاحيات (RBAC Matrix):** موثقة في [admin-rbac.ts](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/src/lib/admin-rbac.ts) وتحدد بدقة صلاحيات الأدوار:
  * `super_admin`: وصول كامل لجميع المسارات والإعدادات والتعديل.
  * `admin`: وصول كامل للمنتجات والطلبات والمخزون دون صلاحية إدارة مستخدمي النظام.
  * `staff`: اطلاع فقط على الطلبات والعملاء والتقارير.
  * `developer`: إدارة المنتجات والمراجعات والأكواد.

---

## 4. اختبار لوحة التحكم الحالية (Current Admin Features)

تم حصر واختبار جميع مسارات ووظائف لوحة تحكم متجر شاهد ستور القائمة:

| الوظيفة في لوحة التحكم | المسار الفعلي في الكود | الحالة التشغيلية الحالية |
| :--- | :--- | :---: |
| **الرئيسية والمؤشرات** | `_admin/admin.dashboard.tsx` | ✅ شغالة وتستعرض مؤشرات المبيعات |
| **إدارة المنتجات** | `_admin/admin.products.tsx` | ✅ شغالة (عرض 13 منتج، فلاتر التصنيف، البحث) |
| **إضافة منتج جديد** | `AddProductDialog.tsx` | ✅ شغالة (مع ميزة مكتبة المتجر والرفع المباشر) |
| **تعديل صور المنتج** | `ProductImagesManager.tsx` | ✅ شغالة (ترتيب الصور، تعيين الرئيسية، الحذف) |
| **إدارة التصنيفات** | `ManageCategoriesDialog.tsx` | ✅ شغالة (إضافة وتعديل وترتيب 5 تصنيفات) |
| **إدارة المخزون** | `_admin/admin.inventory.tsx` | ✅ جاهزة لاستقبال أكواد الاشتراكات والتسليم الآلي |
| **إدارة الطلبات** | `_admin/admin.orders.tsx` | ✅ شغالة وتعرض الطلب المسجل مع الفلاتر |
| **السلات المتروكة** | `_admin/admin.abandoned-orders.tsx` | ✅ شغالة وتتتبع المحاولات غير المكتملة |
| **سجل العملاء** | `_admin/admin.customers.tsx` | ✅ شغالة وتستعرض العملاء ومشترياتهم |
| **الكوبونات والتخفيضات**| `_admin/admin.coupons.tsx` | ✅ شغالة وتعرض الكوبونين النشطين |
| **دليل التفعيل للعملاء**| `_admin/admin.activation-guide.tsx` | ✅ شغالة لإنشاء خطوات تفعيل الأجهزة |
| **التقارير المحاسبية** | `_admin/admin.accounting.*` | ✅ شغالة لتتبع التكاليف والمصاريف والأرباح |
| **إعدادات المتجر** | `_admin/admin.settings.tsx` | ✅ شغالة للتحكم في بوابات الدفع والمعلومات |

---

## 5. اختبار المتجر الحالي (Storefront Client Journey Audit)

### 5.1 مسار تجربة العميل (Customer Journey Flow)
1. **الصفحة الرئيسية (`/`):**
   - تعرض البانر الترويجي، شريط الثقة، وقائمة أفضل الباقات مأخوذة مباشرة من Supabase.
2. **تصفح الكتالوج (`/products`):**
   - تعمل الفلاتر حسب التصنيف (Falcon, Hulk, Smarters) وترتيب الأسعار وتستجيب فورياً.
3. **صفحة تفاصيل المنتج (`/product/$slug`):**
   - تعرض مواصفات الاشتراك، الأجهزة المتوافقة، الصور، واختيار مدة الاشتراك (سنة، 6 شهور).
4. **سلة الشراء (Cart Store):**
   - إدارة محلية متقدمة عبر التخزين المحلي (LocalStorage) مع إمكانية زيادة الكمية أو الحذف الفوري.
5. **صفحة إتمام الطلب (`/checkout/$slug`):**
   - تحتوي على نموذج إدخال الاسم، البريد، ورقم الجوال الدولي المعتمد بالصيغة الدولية (`E.164`).
   - خيار تطبيق كوبون الخصم مع التحقق اللحظي من صلاحيته.
6. **بوابة الدفع (Payment Status):**
   - مبرمجة على بطاقات الائتمان عبر `Edfapay`.
   - كما لوحظ، مفاتيح الدفع في وضع التجربة والتطوير ولا تخصم أموالاً حقيقية.

---

## 6. اختبار الـ APIs والتكاملات (APIs & Integrations)

* **Supabase Client:**
  - يعمل بكفاءة مع التخزين المؤقت `TanStack Query` و `queryOptions`.
  - سياسات RLS مفعلة ومحدثة بـ `store_id`.
* **Webhook بوابة الدفع (`/api/public/edfapay-webhook`):**
  - مسار مستقل ومحمي يتحقق من توقيع الطلب (Signature Verification) ويعالج إشعار نجاح الدفع وتفعيل الطلب في قاعدة البيانات.
* **إشعارات الواتساب (`admin-whatsapp.functions.ts`):**
  - مدمجة لتوليد رسائل التسليم وتنبيهات العميل بصيغة جاهزة للإرسال.

---

## 7. النسخة الاحتياطية وتأمين البيانات (Baseline Snapshot Backup)

قبل إجراء أي تعديل مستقبلي، تم أخذ وتوثيق نسخة احتياطية كاملة لكافة جداول المتجر بصيغة JSON:

* **مسار ملف النسخة الاحتياطية:**  
  [pre-cobra-baseline-backup.json](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/docs/snapshots/pre-cobra-baseline-backup.json)
* **الحجم المسجل:** `31.73 KB`.
* **محتوى النسخة الاحتياطية:**
  * جدول `stores`: بيانات متجر شاهد ستور الرسمية.
  * جدول `products`: جميع الـ 13 منتجاً مع مواصفاتها وأسعارها وصورها.
  * جدول `categories`: كافة التصنيفات الـ 5.
  * جدول `coupons`: الكوبونات النشطة.
  * جدول `orders`: سجلات الطلبات.
  * جدول `store_settings`: إعدادات المتجر الكاملة.
  * جدول `store_members`: ربط الإدارة والملكية.

---

## 8. الخلاصة ومعيار الجاهزية (Readiness Decision)

✅ **النظام الحالي يعمل بصورة طبيعية ومستقرة تماماً.**  
✅ **تم توثيق كافة الوظائف، الجداول، والـ APIs القائمة.**  
✅ **تم أخذ نسخة احتياطية كاملة ومحفوظة بنجاح.**  
✅ **تمت تصفية وضبط التخزين السحابي لمتجر شاهد ستور ليكون معزولاً داخل `7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01/`.**  
✅ **لا توجد أي أخطاء حرجة مجهولة تعيق البدء في متجر Cobra.**

**القرار:** النظام جاهز الآن بنسبة 100% للانتقال إلى المرحلة التالية لتجهيز متجر Cobra دون أي قلق أو مساس بمتجر شاهد ستور القائم.
