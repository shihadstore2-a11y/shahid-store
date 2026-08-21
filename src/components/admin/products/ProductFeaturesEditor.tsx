import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateAdminProduct,
  type AdminProductRow,
  type AdminProductUpdate,
} from "@/lib/admin-products";

const MAX_FEATURES = 12;
const MAX_LEN = 80;
const SUGGESTIONS = [
  "جودة 4K Ultra HD",
  "تفعيل سريع خلال دقائق",
  "دعم فني 24/7",
  "يعمل على جميع الأجهزة",
  "بدون إعلانات مزعجة",
  "تحديث محتوى يومي",
  "مكتبة قنوات ضخمة",
  "استبدال خلال 24 ساعة",
];

const BANNED_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bالأفضل\b|\bأفضل\b|\bأقوى\b|\bأحسن\b/u, label: "أفضل/الأفضل/أقوى/أحسن" },
  { re: /\bفوري\b|\bفورية\b/u, label: "فوري (استخدم: سريع)" },
  { re: /\b100\s*%|\bمضمون\b|\bضمان\s*كامل\b|\bبدون\s*تقطيع\b/u, label: "100%/مضمون/بدون تقطيع" },
  { re: /\bFIFA\b/i, label: "FIFA" },
];

function findBanned(text: string): string[] {
  const hits: string[] = [];
  for (const { re, label } of BANNED_PATTERNS) {
    if (re.test(text)) hits.push(label);
  }
  return hits;
}

type Props = {
  product: AdminProductRow;
  onClose: () => void;
};

export function ProductFeaturesEditor({ product, onClose }: Props) {
  const queryClient = useQueryClient();
  const initial = product.features ?? [];
  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setItems(product.features ?? []);
    setDraft("");
  }, [product.id, product.features]);

  const trimmedDraft = draft.trim();
  const canAdd =
    trimmedDraft.length > 0 &&
    trimmedDraft.length <= MAX_LEN &&
    items.length < MAX_FEATURES &&
    !items.some((i) => i.trim().toLowerCase() === trimmedDraft.toLowerCase());

  const cleanItems = useMemo(
    () => items.map((s) => s.trim()).filter(Boolean),
    [items],
  );
  const initialClean = useMemo(
    () => initial.map((s) => s.trim()).filter(Boolean),
    [initial],
  );
  const hasChanges =
    cleanItems.length !== initialClean.length ||
    cleanItems.some((v, idx) => v !== initialClean[idx]);

  const bannedAll = useMemo(
    () => Array.from(new Set(cleanItems.flatMap((s) => findBanned(s)))),
    [cleanItems],
  );

  const persist = useMutation({
    mutationFn: (next: string[]) =>
      updateAdminProduct(product.id, { features: next } as AdminProductUpdate),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "products"] });
      const snapshots = queryClient.getQueriesData<{ rows: AdminProductRow[] }>({
        queryKey: ["admin", "products"],
      });
      snapshots.forEach(([key, prev]) => {
        if (!prev) return;
        queryClient.setQueryData(key, {
          ...prev,
          rows: prev.rows.map((r) =>
            r.id === product.id ? { ...r, features: next } : r,
          ),
        });
      });
      return { snapshots };
    },
    onError: (err: any, _v, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
      toast.error("تعذّر الحفظ: " + (err?.message ?? "خطأ غير معروف"));
    },
    onSuccess: () => {
      toast.success("تم حفظ المزايا");
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const addItem = (value?: string) => {
    const v = (value ?? trimmedDraft).trim().slice(0, MAX_LEN);
    if (!v) return;
    if (items.length >= MAX_FEATURES) {
      toast.warning(`الحد الأقصى ${MAX_FEATURES} ميزة`);
      return;
    }
    if (items.some((i) => i.trim().toLowerCase() === v.toLowerCase())) {
      toast.warning("هذه الميزة موجودة بالفعل");
      return;
    }
    setItems([...items, v]);
    setDraft("");
  };

  const updateItem = (idx: number, value: string) => {
    const next = [...items];
    next[idx] = value.slice(0, MAX_LEN);
    setItems(next);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
  };

  const handleSave = async () => {
    if (!hasChanges || persist.isPending) return;
    await persist.mutateAsync(cleanItems);
  };

  return (
    <div className="flex h-full flex-col">
      {/* الرأس */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black sm:text-lg">
            مزايا الباقة · {product.name_ar}
          </h2>
          <p dir="ltr" className="mt-0.5 text-right text-[11px] text-muted-foreground">
            {product.slug}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold tabular-nums"
          aria-label="عدد المزايا"
        >
          {items.length} / {MAX_FEATURES}
        </span>
      </div>

      {/* المحتوى */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* تلميح */}
        <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span className="text-foreground/90">
            هذه المزايا تظهر داخل صفحة المنتج كقائمة مرئية. اجعل كل ميزة قصيرة وواضحة
            وابدأ بالأهم. الحد الأقصى <b>{MAX_LEN}</b> حرفًا لكل سطر.
          </span>
        </div>

        {/* قائمة المزايا */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              لا توجد مزايا بعد — أضف أوّل ميزة من الأسفل أو اختر من المقترحات.
            </div>
          ) : (
            items.map((value, idx) => {
              const bannedHits = findBanned(value);
              return (
                <div
                  key={idx}
                  className={`group flex items-center gap-2 rounded-xl border bg-card p-2 transition-colors ${
                    bannedHits.length > 0
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-[11px] font-black text-accent">
                    {idx + 1}
                  </span>
                  <Input
                    value={value}
                    onChange={(e) => updateItem(idx, e.target.value)}
                    maxLength={MAX_LEN}
                    dir="auto"
                    className="h-9 flex-1 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-1"
                    placeholder="اكتب الميزة هنا"
                  />
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      aria-label="تحريك للأعلى"
                      title="تحريك للأعلى"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      aria-label="تحريك للأسفل"
                      title="تحريك للأسفل"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(idx)}
                      aria-label="حذف الميزة"
                      title="حذف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* تحذير النصوص المحظورة */}
        {bannedAll.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="font-bold text-destructive">نصوص محظورة مكتشَفة:</p>
              <ul className="list-inside list-disc text-foreground/80">
                {bannedAll.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* إدخال جديد */}
        <div className="rounded-xl border border-border bg-card p-3">
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
            إضافة ميزة جديدة
          </label>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) {
                  e.preventDefault();
                  addItem();
                }
              }}
              maxLength={MAX_LEN}
              dir="auto"
              placeholder="مثال: تفعيل سريع خلال دقائق"
              className="h-9 flex-1"
              disabled={items.length >= MAX_FEATURES}
            />
            <Button
              type="button"
              onClick={() => addItem()}
              disabled={!canAdd}
              className="h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            اضغط <kbd className="rounded border border-border bg-muted px-1 font-mono">Enter</kbd> للإضافة السريعة · {draft.length}/{MAX_LEN}
          </p>
        </div>

        {/* مقترحات سريعة */}
        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">مقترحات سريعة</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.filter(
              (s) => !items.some((i) => i.trim().toLowerCase() === s.toLowerCase()),
            ).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addItem(s)}
                disabled={items.length >= MAX_FEATURES}
                className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-foreground disabled:opacity-40"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* معاينة */}
        {cleanItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold text-muted-foreground">
              المعاينة (كما ستظهر في صفحة المنتج)
            </p>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <ul className="space-y-2">
                {cleanItems.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={persist.isPending}
          className="gap-1.5"
        >
          <X className="h-4 w-4" />
          إلغاء
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || persist.isPending}
          className="min-w-28 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {persist.isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" /> جارٍ الحفظ
            </>
          ) : (
            "حفظ المزايا"
          )}
        </Button>
      </div>
    </div>
  );
}
