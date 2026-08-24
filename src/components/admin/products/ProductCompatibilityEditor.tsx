import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Monitor,
  Plus,
  Tv,
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

const PRESET_DEVICES = [
  "Smart TV",
  "Android TV",
  "iOS / Apple TV",
  "Windows / Mac",
  "MAG / Formuler",
  "Fire TV Stick",
  "Xiaomi Stick / Box",
  "شاشات أندرويد الذكية",
  "أجهزة أبل (iPhone / iPad)",
  "هواتف وأجهزة أندرويد",
];

const MAX_DEVICES = 15;
const MAX_LEN = 50;

type Props = {
  product: AdminProductRow;
  onClose: () => void;
};

export function ProductCompatibilityEditor({ product, onClose }: Props) {
  const queryClient = useQueryClient();
  const initial = product.compatibility ?? [];
  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setItems(product.compatibility ?? []);
    setDraft("");
  }, [product.id, product.compatibility]);

  const trimmedDraft = draft.trim();
  const canAdd =
    trimmedDraft.length > 0 &&
    trimmedDraft.length <= MAX_LEN &&
    items.length < MAX_DEVICES &&
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

  const persist = useMutation({
    mutationFn: (next: string[]) =>
      updateAdminProduct(product.id, { compatibility: next } as AdminProductUpdate),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "products"] });
      const snapshots = queryClient.getQueriesData<{ rows: AdminProductRow[] }>({
        queryKey: ["admin", "products"],
      });
      snapshots.forEach(([key, prev]) => {
        if (!prev) return;
        queryClient.setQueryData(key, {
          ...prev,
          rows: prev.rows.map((p) =>
            p.id === product.id ? { ...p, compatibility: next } : p,
          ),
        });
      });
      return { snapshots };
    },
    onError: (err: any, _vars, context) => {
      context?.snapshots.forEach(([key, prev]) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
      toast.error("تعذّر حفظ الأجهزة المتوافقة: " + (err?.message ?? "خطأ غير معروف"));
    },
    onSuccess: () => {
      toast.success("تم تحديث الأجهزة المتوافقة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
  });

  const handleAdd = (valueToAdd?: string) => {
    const target = (valueToAdd ?? draft).trim();
    if (!target || target.length > MAX_LEN) return;
    if (items.some((i) => i.trim().toLowerCase() === target.toLowerCase())) {
      toast.info("هذا الجهاز مضاف بالفعل");
      return;
    }
    if (items.length >= MAX_DEVICES) {
      toast.error(`الحد الأقصى هو ${MAX_DEVICES} جهاز`);
      return;
    }
    setItems((prev) => [...prev, target]);
    if (!valueToAdd) setDraft("");
  };

  const handleRemove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    await persist.mutateAsync(cleanItems);
  };

  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-black">الأجهزة المتوافقة (التوافق)</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            تخصيص الأجهزة والأنظمة التي تظهر في قسم <strong>"التوافق"</strong> بصفحة المنتج{" "}
            <span className="font-bold text-foreground">"{product.name_ar}"</span>.
          </p>
        </div>

        {/* إضافة جهاز جديد */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground">إضافة جهاز أو نظام جديد</label>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="مثال: Apple TV, Smart TV, Firestick..."
              maxLength={MAX_LEN}
              className="text-sm"
            />
            <Button
              type="button"
              onClick={() => handleAdd()}
              disabled={!canAdd}
              className="shrink-0 font-bold"
            >
              <Plus className="ml-1 h-4 w-4" /> إضافة
            </Button>
          </div>
        </div>

        {/* اقتراحات سريعة بنقرة واحدة */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground">اقتراحات شائعة (اضغط للإضافة):</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_DEVICES.map((preset) => {
              const alreadyAdded = items.some(
                (i) => i.trim().toLowerCase() === preset.toLowerCase(),
              );
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => !alreadyAdded && handleAdd(preset)}
                  disabled={alreadyAdded}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-all ${
                    alreadyAdded
                      ? "border-accent/30 bg-accent/10 text-accent opacity-60 cursor-default"
                      : "border-border bg-card hover:bg-accent/10 hover:border-accent"
                  }`}
                >
                  {alreadyAdded ? (
                    <CheckCircle2 className="h-3 w-3 text-accent" />
                  ) : (
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  )}
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* قائمة الأجهزة الحالية المضافة */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              الأجهزة المعتمدة الحالية ({items.length} / {MAX_DEVICES}):
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-[11px] text-destructive hover:underline"
              >
                مسح الكل
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              لا توجد أجهزة متوافقة مضافة حتى الآن. اختر من الاقتراحات أعلاه أو أضف جهازاً مخصصاً.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/20 p-3">
              {items.map((item, idx) => (
                <span
                  key={idx}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold shadow-sm"
                >
                  <Monitor className="h-3.5 w-3.5 text-accent" />
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="mr-1 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`حذف ${item}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* أزرار الحفظ والإلغاء */}
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={persist.isPending}>
          إلغاء
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || persist.isPending}
          className="font-bold bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {persist.isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الحفظ...
            </>
          ) : (
            "حفظ التغييرات"
          )}
        </Button>
      </div>
    </div>
  );
}
