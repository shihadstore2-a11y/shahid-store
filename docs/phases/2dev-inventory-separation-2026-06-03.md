# فصل مخزون منتجات «جهازين» (2dev) — 2026-06-03

**المالك:** ثامر — **التنفيذ:** Lovable — **الخيار:** B (عمود `device_limit`).

## الجذر
`claim_subscription_for_order` و`check_stock_available` كانتا تطابقان `provider + duration`
فقط وتتجاهلان لاحقة `-2dev`. النتيجة: طلب منتج «جهازين» كان يسحب حساباً عادياً (جهاز واحد)
من نفس مجمّع `falcon/12` أو `hulk/12`. (الطلب الخاطئ `LG-260531-7964` عولج عبر واتساب.)

## الحل
عمود `device_limit smallint NOT NULL DEFAULT 1` على `subscription_inventory`.
- **حماية 1dev:** كل الـ45 صف القديم أصبح device_limit=1 تلقائياً عبر DEFAULT.
- التمييز يتم بالعمود الجديد، و`get_providers_from_slug` بقيت كما هي.

## التغييرات (DB)
1. `ALTER TABLE subscription_inventory ADD COLUMN device_limit smallint NOT NULL DEFAULT 1`.
2. فهرس جزئي: `idx_inventory_device_limit (provider, duration_months, device_limit, status) WHERE status='available'`.
3. `claim_subscription_for_order`:
   - `_required_devices := CASE WHEN _slug LIKE '%-2dev' THEN 2 ELSE 1 END`.
   - المسار المفرد: `AND device_limit = _required_devices`؛ سبب الفشل `no_stock_device` + `device_limit` في الرد.
   - مسار الباقة (bundle): `AND device_limit = 1` لكلا المزوّدَين (الباقة دائماً جهاز واحد، تحمي حسابات 2dev النادرة).
   - منطق UPDATE وسجل التدقيق (audit) لم يتغيّرا.
4. `check_stock_available`: نفس فلتر `device_limit` (مفرد = required، bundle = 1) لضمان تطابق التوفّر مع التسليم.
5. `bulk_insert_inventory`: يقرأ `device_limit` من كل عنصر (افتراضي 1).

## التغييرات (UI)
- `admin-inventory.ts`: `device_limit` في النوع/الإدخال/التحديث/Bulk + `SELECT_COLS` + دالة `deviceLimitLabel`.
- `InventoryFormDialog`: حقل «عدد الأجهزة» (جهاز واحد/جهازان، معطّل في التعديل).
- `BulkPasteForm`: خيار «عدد الأجهزة» للدفعة كلها.
- `InventoryTable`/`InventoryRow`/`InventoryCard`: عمود/شارة «الأجهزة».

## التحقق الفعلي (read-only)
| فحص | نتيجة |
|---|---|
| توزيع device_limit | 11 متاح + 34 مسلَّم = الكل device_limit=1 ✅ |
| falcon-1y (1dev) متاح | 2 ✅ |
| hulk-1y (1dev) متاح | 3 ✅ |
| falcon-1y-2dev متاح | 0 → no_stock_device (متوقّع، ثامر يضيف لاحقاً) ✅ |
| bundle | falcon(2)+hulk(3) device_limit=1 → متاح ✅ |

## خارج النطاق (لم يُمسّ)
EdfaPay، webhook، Phase H، منطق UPDATE/audit في claim، المخزون الحالي يدوياً.
