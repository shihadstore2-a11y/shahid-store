# Definitive Contrast Fix — 2026-05-30

PM Ahmed (Senior 16y) — ألوان صريحة، لا opacity، لا muted-foreground للنصوص المهمة.

## السبب
المالك رأى التباين ضعيفاً على الموبايل (لوحة الإشعارات). النصوص الثانوية كانت
`text-muted-foreground` / `text-foreground/60` = خافتة على خلفية البطاقة الداكنة
`oklch(0.315 0 0)` ≈ sRGB(49,49,49).

## التغييرات (ألوان نص موضعية فقط — لا توكنات عالمية، لا layout)

### `AdminNotifications.tsx`
- العنوان الفرعي "آخر الطلبات والتنبيهات": `text-muted-foreground` → `text-zinc-300`
- اسم العميل + الحالة: `text-muted-foreground` → `text-zinc-200`
- الوقت: `text-muted-foreground` → `text-zinc-400`
- الحالة الفارغة: `text-muted-foreground` → `text-zinc-300`
- شارة "جديد": `text-[9px] text-destructive` → `text-[10px] text-red-300`
- شارة "بانتظار": `text-amber-200` (كما هي — مطابقة)

### `KpiCard.tsx`
- العنوان: `text-foreground/70` → `text-zinc-300`
- التلميح: `text-foreground/60` → `text-zinc-400`
- شارة % صاعد: `text-success` → `text-emerald-300`
- شارة % هابط: `text-destructive` → `text-red-300`

### `RecentOrdersTable.tsx`
- رؤوس الأعمدة: `text-muted-foreground` → `text-zinc-300`
- شارة delivered: `text-success` → `text-emerald-300`
- شارة cancelled: `text-destructive` → `text-red-300`
- الحالة الفارغة: → `text-zinc-400`

### `TopProductsList.tsx`
- عدد المبيعات: `text-muted-foreground` → `text-zinc-400`
- السعر: `text-muted-foreground` → `text-zinc-300`
- الحالة الفارغة: → `text-zinc-400`

## نسب التباين الجديدة (على البطاقة sRGB 49,49,49)

| اللون | النسبة | المعيار |
|------|--------|---------|
| zinc-200 | 10.25 | AAA |
| zinc-300 | 8.80 | AAA |
| zinc-400 | 5.08 | AA ✓ |
| emerald-300 | 8.53 | AAA |
| red-300 | 6.85 | AA+ |
| amber-200 | 10.45 | AAA |

## لم يُمَس
- التوكنات العالمية `--success` / `--destructive` (مستخدمة كخلفيات أزرار).
- القيم الكبيرة لـ KPI والمبالغ (`gold-foreground`) — واضحة أصلاً.
- المنطق، التخطيط، EdfaPay/Phase H/المخزون.

## التحقق البصري
تعذّر التقاط لقطات اللوحة في المعاينة (حارس `/admin` يتطلب جلسة أدمن — الجلسة
عالقة على "جارٍ استعادة جلسة الإدارة"). الاعتماد على مراجعة الكود + حساب التباين
الرقمي أعلاه.
