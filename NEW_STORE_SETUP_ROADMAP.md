# 🗺️ خريطة طريق ودليل إطلاق أي متجر جديد من الصفر
## (Complete Setup Blueprint for New Stores)

هذا الدليل يقدم لك الخريطة الكاملة والخطوات الواضحة والمباشرة عند إنشاء أي متجر جديد أو ربطه بقاعدة بيانات جديدة ومستقلة، دون تداخل مع المنصات الأخرى ودون حدوث أخطاء نقص الأعمدة أو الصلاحيات.

---

## 📁 الملفات الموحدة في المشروع

تم تقسيم قاعدة البيانات إلى ملفات مستقلة ومرتبة بالترتيب المنطقي للتنفيذ:

| الترتيب | اسم الملف | الوظيفة والمحتوى |
| :--- | :--- | :--- |
| **01** | [`01_DATABASE_SCHEMA.sql`](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/01_DATABASE_SCHEMA.sql) | **جداول وهيكل المتجر كاملاً**: ينشئ جميع الجداول (المنتجات، الإعدادات، الطلبات، المخزون، المقالات، التقييمات، السلات المتروكة) مع كافة الأعمدة دون أي نقص. |
| **02** | [`02_SECURITY_PERMISSIONS_RLS.sql`](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/02_SECURITY_PERMISSIONS_RLS.sql) | **الصلاحيات وسياسات الأمان RLS**: يحدد بدقة من يمكنه القراءة، التعديل، والحذف بناءً على الرتبة (مدير عام، مدير، موظف، عميل). |
| **03** | [`03_INITIAL_DATA_AND_SETTINGS.sql`](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/03_INITIAL_DATA_AND_SETTINGS.sql) | **البيانات الأولية والإعدادات**: يزرع إعدادات المتجر الافتراضية، الأقسام، الباقات الجاهزة، خطوات التفعيل والكوبونات. |
| **04** | [`04_ADMIN_USERS_ROLES.sql`](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/04_ADMIN_USERS_ROLES.sql) | **فريق الإدارة والمشرفين**: يربط الحسابات المسجلة بالرتب الإدارية المناسبة في المتجر. |

---

## 🚀 خطوات تجهيز وإطلاق المتجر الجديد خطوة بخطوة

### الخطوة 1️⃣: تجهيز مشروع Supabase ورفع الصور
1. أنشئ مشروعاً جديداً على [Supabase Dashboard](https://supabase.com/dashboard).
2. اذهب إلى **Storage** وأنشئ وعائين (Buckets) كلاهما **Public**:
   - `products`
   - `product-images`
3. ارفع صور البطاقات والشعارات الخاصة بمنتجاتك إلى وعاء `products`.

---

### الخطوة 2️⃣: تنفيذ ملفات قاعدة البيانات في الـ SQL Editor
اذهب إلى **SQL Editor** داخل لوحة تحكم Supabase وافتح نافذة جديدة لكل ملف ونفذه بالترتيب:

#### 1. تنفيذ ملف الهيكل:
* انسخ محتوى [`01_DATABASE_SCHEMA.sql`](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/01_DATABASE_SCHEMA.sql) والصقه واضغط **Run**.
* *النتيجة:* يتم إنشاء جميع الـ 20 جدولاً وجميع الفهارس والأعمدة بما فيها (`duration_months`, `store_settings`, `whatsapp_messages_sent`, `customer_city`, `full_name`).

#### 2. تنفيذ ملف الصلاحيات والأمان:
* انسخ محتوى [`02_SECURITY_PERMISSIONS_RLS.sql`](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/02_SECURITY_PERMISSIONS_RLS.sql) والصقه واضغط **Run**.
* *النتيجة:* تفعيل حماية RLS لجميع الجداول وضبط صلاحيات الموظفين والمدراء وحماية بيانات العملاء.

#### 3. تنفيذ ملف البيانات الأولية:
* انسخ محتوى [`03_INITIAL_DATA_AND_SETTINGS.sql`](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/03_INITIAL_DATA_AND_SETTINGS.sql) والصقه واضغط **Run**.
* *النتيجة:* ملء المتجر بالباقات، الأقسام، الكوبونات، وإعدادات الواتساب واسم المتجر.

---

### الخطوة 3️⃣: إنشاء حسابات فريق الإدارة وتعيين الرتب
1. اذهب في Supabase إلى **Authentication** ➔ **Users** ➔ اضغط **Add User** (Create User):
   - أنشئ حساب المدير العام: `iiithamer17@gmail.com`
   - أنشئ حساب مدير المتجر: `digitaneo@gmail.com`
   - أنشئ حسابات الموظفين: `belcaid@inbox.ru`, `meramustafa126@gmail.com`, `shihadstore2@gmail.com`
2. ارجع إلى **SQL Editor** ونفّذ ملف:
   - [`04_ADMIN_USERS_ROLES.sql`](file:///c:/Users/Digitaneo/Desktop/dev/shahid/shahid-store-main/04_ADMIN_USERS_ROLES.sql)
   - *النتيجة:* يتم ربط المستخدمين تلقائياً ومنح كل مستخدم صلاحياته ورتبته فوراً.

---

### الخطوة 4️⃣: إعداد متغيرات استضافة Cloudflare Worker
في لوحة تحكم Cloudflare تحت **Compute (Workers & Pages)** ➔ المتجر ➔ **Settings** ➔ **Variables and Secrets**:

#### المتغيرات النصية (Variables):
- `SUPABASE_URL` = `https://<PROJECT_REF>.supabase.co`
- `VITE_SUPABASE_URL` = `https://<PROJECT_REF>.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...` (أو anon key)
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...` (أو anon key)

#### السر المشفّر (Secrets):
- `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_...` (أو service_role secret)

ثم اضغط **Save and deploy**.

---

## 🛡️ جدول توزيع الصلاحيات والرتب في المتجر

| الرتبة (Role) | الأشخاص | الصلاحيات الممنوحة | القيود |
| :--- | :--- | :--- | :--- |
| **👑 المدير العام (`super_admin`)** | ثامر (`iiithamer17@gmail.com`) | **صلاحيات مطلقة كاملة**: إضافة وعزل المدراء والمشرفين، حذف المنتجات نهائياً، حذف الطلبات، إدارة المالية والإعدادات، وتعديل كل شيء. | لا توجد أي قيود. |
| **⭐ مدير المتجر (`admin`)** | `digitaneo@gmail.com` | **إدارة تشغيلية عليا**: تعديل إعدادات المتجر (`/settings`)، تعديل المنتجات والأقسام، إدارة الكوبونات، استعراض المالية، إدارة المخزون والطلبات. | لا يمكنه حذف المشرفين الآخرين أو حذف المنتجات نهائياً (الحذف للمدير العام فقط لحماية المتجر). |
| **👔 الموظفون (`staff`)** | بلقايد، ميرا، شيهاد | **تنفيذ وتشغيل الطلبات**: استعراض الطلبات، إرسال رسائل الواتساب للسلات المتروكة، إدخال وتوزيع الأكواد، إضافة مقالات وتقييمات، تعديل المنتجات. | لا يمكنهم الدخول إلى أرباح المتجر المالية، ولا يمكنهم تغيير إعدادات المتجر العامة أو إضافة مشرفين. |
| **🛒 الزوار والعملاء (`public / user`)** | عموم الزوار والعملاء | تصفح المنتجات والأقسام، إتمام الشراء، قراءة المقالات والتقييمات، وتعديل ملفاتهم الشخصية فقط. | محجوب عنهم تماماً أي وصول لبيانات الإدارة أو الطلبات الخاصة بالآخرين. |

---

## ✅ التحقق النهائي بعد التثبيت

بعد تنفيذ الخطوات، تأكد من تجربة الروابط التالية في لوحة التحكم للتأكد من عدم وجود أي خطأ:
1. **المنتجات (`/admin/products`)**: تعرض الباقات وتتيح التعديل دون أي خطأ في عمود `duration_months`.
2. **إعدادات المتجر (`/admin/settings`)**: يعرض قسم المتجر اسم المتجر ورقم الواتساب والعملة ويتيح حفظها.
3. **الملف الشخصي (`/admin/profile`)**: يتيح تعديل الاسم الكامل ورقم الهاتف بنجاح.
4. **السلات المتروكة (`/admin/abandoned-orders`)**: يرسل رسائل الواتساب ويسجل حالة الإرسال بدون خطأ.
5. **المقالات (`/admin/articles`)**: يتيح كتابة وحفظ ونشر المقالات.
6. **التقييمات (`/admin/reviews`)**: يتيح إضافة ومراجعة آراء العملاء مع مدينة العميل بسلاسة.
