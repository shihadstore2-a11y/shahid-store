import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  updateAdminProduct,
  type AdminProductRow,
  type AdminProductUpdate,
} from "@/lib/admin-products";

const MAX_LEN = 600;
const SEO_LEN = 155;
// قائمة الكلمات الممنوعة في وصف المنتجات
// مُحدَّثة 20 May 2026 بقرار صريح من المالك:
// "أفضل" / "الأفضل" / "بدون تقطيع" مسموحة الآن.
const BANNED_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bأقوى\b|\bأحسن\b/u, label: "أقوى/أحسن" },
  { re: /\bفوري\b|\bفورية\b/u, label: "فوري (استخدم: سريع)" },
  { re: /\b100\s*%|\bمضمون\b|\bضمان\s*كامل\b/u, label: "100%/مضمون/ضمان كامل" },
  { re: /\bFIFA\b/i, label: "FIFA" },
];

function findBannedHits(text: string): string[] {
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

export function ProductDescriptionEditor({ product, onClose }: Props) {
  const queryClient = useQueryClient();
  const initial = product.description ?? "";
  const [value, setValue] = useState(initial);
  const [confirmBanned, setConfirmBanned] = useState(false);

  // إعادة المزامنة عند تبديل المنتج
  useEffect(() => {
    setValue(product.description ?? "");
    setConfirmBanned(false);
  }, [product.id, product.description]);

  const trimmed = value.trim();
  const len = value.length;
  const hasChanges = trimmed !== (initial ?? "").trim();
  const banned = useMemo(() => findBannedHits(value), [value]);

  const countColor =
    len > 500 ? "text-destructive" : len >= 400 ? "text-[var(--gold)]" : "text-emerald-500";

  const persist = useMutation({
    mutationFn: (next: string | null) =>
      updateAdminProduct(product.id, { description: next } as AdminProductUpdate),
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
            r.id === product.id ? { ...r, description: next } : r,
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
      toast.success("تم حفظ الوصف");
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSave = async () => {
    if (!hasChanges || persist.isPending) return;
    if (banned.length > 0 && !confirmBanned) {
      setConfirmBanned(true);
      toast.warning("نصوص محظورة مكتشَفة — راجعها أو اضغط حفظ مرة أخرى للتأكيد", {
        duration: 5000,
      });
      return;
    }
    const next = trimmed.length === 0 ? null : trimmed;
    await persist.mutateAsync(next);
  };

  const preview = trimmed.slice(0, SEO_LEN) + (trimmed.length > SEO_LEN ? "…" : "");

  return (
    <div className="flex h-full flex-col">
      {/* الرأس */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black sm:text-lg">
            وصف المنتج · {product.name_ar}
          </h2>
          <p dir="ltr" className="mt-0.5 text-right text-[11px] text-muted-foreground">
            {product.slug}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold tabular-nums ${countColor}`}
          aria-label="عدد الأحرف"
        >
          {len} / {MAX_LEN}
        </span>
      </div>

      {/* المحتوى القابل للتمرير */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {/* تلميح SEO */}
        <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span className="text-foreground/90">
            أوّل <b className="tabular-nums">{SEO_LEN}</b> حرفًا تظهر في نتائج Google وفي وسوم
            الـ meta. اجعلها واضحة وغنية بالكلمات المفتاحية.
          </span>
        </div>

        {/* Textarea */}
        <div>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            maxLength={MAX_LEN}
            dir="auto"
            rows={10}
            placeholder="اكتب وصفًا واضحًا للمنتج — ابدأ بالفائدة الأساسية، اذكر المزايا (الجودة، التغطية، التفعيل السريع)، ثم اختم بدعوة للاشتراك."
            className="min-h-[240px] resize-y rounded-xl bg-card text-sm leading-relaxed"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            اضغط <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">Ctrl/⌘ + Enter</kbd> لحفظ سريع
          </p>
        </div>

        {/* تحذير النصوص المحظورة */}
        {banned.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="font-bold text-destructive">نصوص محظورة مكتشَفة:</p>
              <ul className="list-inside list-disc text-foreground/80">
                {banned.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {confirmBanned && (
                <p className="text-[11px] text-muted-foreground">
                  اضغط حفظ مرة أخرى لتأكيد الإبقاء عليها.
                </p>
              )}
            </div>
          </div>
        )}

        {/* معاينة SERP */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            معاينة كما تظهر في Google
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div className="truncate text-[15px] font-bold text-accent">
              {product.name_ar} — شاهد ستور
            </div>
            <div dir="ltr" className="mt-0.5 truncate text-[11px] text-emerald-600/80">
              shahidstore.net › product › {product.slug}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80" dir="auto">
              {preview || (
                <span className="italic text-muted-foreground">
                  (سيظهر هنا أوّل {SEO_LEN} حرفًا من الوصف)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Footer ثابت */}
      <div className="flex items-center justify-between gap-2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={persist.isPending}
        >
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
          ) : banned.length > 0 && confirmBanned ? (
            "تأكيد الحفظ"
          ) : (
            "حفظ"
          )}
        </Button>
      </div>
    </div>
  );
}
