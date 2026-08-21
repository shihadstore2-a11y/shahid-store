import { useCallback, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Star,
  StarOff,
  Trash2,
  Upload,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGES_PER_PRODUCT,
  deleteProductImageFromStorage,
  updateProductImageUrls,
  uploadProductImage,
  validateImageFile,
} from "@/lib/admin-product-images";
import type { AdminProductRow } from "@/lib/admin-products";

type Props = {
  product: AdminProductRow;
};

export function ProductImagesManager({ product }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const urls = product.image_urls ?? [];
  const remainingSlots = Math.max(0, MAX_IMAGES_PER_PRODUCT - urls.length);

  const persist = useMutation({
    mutationFn: (next: string[]) => updateProductImageUrls(product.id, next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "products"] });
      const snapshots = queryClient.getQueriesData<{
        rows: AdminProductRow[];
        categories: unknown[];
      }>({ queryKey: ["admin", "products"] });
      snapshots.forEach(([key, prev]) => {
        if (!prev) return;
        queryClient.setQueryData(key, {
          ...prev,
          rows: prev.rows.map((r) =>
            r.id === product.id ? { ...r, image_urls: next } : r,
          ),
        });
      });
      return { snapshots };
    },
    onError: (err: any, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
      toast.error("تعذّر التحديث: " + (err?.message ?? "خطأ غير معروف"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      // فلترة الصلاحية
      const valid: File[] = [];
      for (const f of list) {
        const err = validateImageFile(f);
        if (err) {
          toast.error(err.message);
          continue;
        }
        valid.push(f);
      }
      if (valid.length === 0) return;

      // قطع عند الحد الأقصى
      const available = MAX_IMAGES_PER_PRODUCT - urls.length;
      if (available <= 0) {
        toast.error(`الحد الأقصى ${MAX_IMAGES_PER_PRODUCT} صور لكل منتج`);
        return;
      }
      const toUpload = valid.slice(0, available);
      if (valid.length > available) {
        toast.warning(`تم رفع ${available} فقط — الحد الأقصى ${MAX_IMAGES_PER_PRODUCT}`);
      }

      setIsUploading(true);
      setPendingCount(toUpload.length);
      const uploaded: string[] = [];
      try {
        for (const file of toUpload) {
          try {
            const url = await uploadProductImage(product.id, file);
            uploaded.push(url);
            setPendingCount((c) => Math.max(0, c - 1));
          } catch (err: any) {
            toast.error(`فشل رفع ${file.name}: ${err?.message ?? "خطأ"}`);
          }
        }
        if (uploaded.length > 0) {
          const next = [...urls, ...uploaded];
          await persist.mutateAsync(next);
          toast.success(`تم رفع ${uploaded.length} صورة`);
        }
      } finally {
        setIsUploading(false);
        setPendingCount(0);
      }
    },
    [persist, product.id, urls],
  );

  const onPickClick = () => fileInputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const removeAt = async (idx: number) => {
    const url = urls[idx];
    const next = urls.filter((_, i) => i !== idx);
    try {
      await persist.mutateAsync(next);
      // ثم احذف من Storage (لا نريد منع DB لو حذف Storage فشل)
      deleteProductImageFromStorage(url).catch(() => {
        /* تجاهل بصمت — قد يكون URL خارجياً قديماً */
      });
      toast.success("تم الحذف");
    } catch {
      /* الخطأ يُعالج في onError */
    }
  };

  const setPrimary = async (idx: number) => {
    if (idx === 0) return;
    const next = [urls[idx], ...urls.filter((_, i) => i !== idx)];
    await persist.mutateAsync(next);
    toast.success("تم تعيينها كصورة رئيسية");
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= urls.length) return;
    const next = [...urls];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    await persist.mutateAsync(next);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* الرأس */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black sm:text-lg">
            صور المنتج · {product.name_ar}
          </h2>
          <p dir="ltr" className="mt-0.5 text-right text-[11px] text-muted-foreground">
            {product.slug}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold tabular-nums">
          {urls.length} / {MAX_IMAGES_PER_PRODUCT}
        </span>
      </div>

      {/* منطقة الرفع */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
          isDragOver
            ? "border-accent bg-accent/5"
            : "border-border bg-muted/30 hover:border-accent/60"
        } ${remainingSlots === 0 ? "opacity-60" : ""}`}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Upload className="h-6 w-6" />
        </div>
        <p className="mb-1 text-sm font-bold">
          اسحب الصور هنا، أو
          <button
            type="button"
            onClick={onPickClick}
            disabled={isUploading || remainingSlots === 0}
            className="mx-1 text-accent underline-offset-2 hover:underline disabled:opacity-50"
          >
            اختر من جهازك
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          JPG / PNG / WEBP — الحد الأقصى {Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB لكل صورة
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          متبقّي: <span className="font-bold tabular-nums">{remainingSlots}</span> من{" "}
          {MAX_IMAGES_PER_PRODUCT}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(",")}
          multiple
          hidden
          onChange={onInputChange}
        />
      </div>

      {/* شريط الرفع الجاري */}
      {isUploading && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          جارٍ الرفع... متبقّي {pendingCount}
        </div>
      )}

      {/* المعرض */}
      {urls.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-10 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ImagePlus className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold">لا توجد صور بعد</p>
          <p className="mt-1 text-xs text-muted-foreground">
            ستظهر الصورة الافتراضية المرتبطة بالفئة في المتجر حتى تُضيف صورة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((url, idx) => (
            <ImageTile
              key={url}
              url={url}
              index={idx}
              isPrimary={idx === 0}
              isFirst={idx === 0}
              isLast={idx === urls.length - 1}
              onSetPrimary={() => setPrimary(idx)}
              onDelete={() => removeAt(idx)}
              onMoveLeft={() => move(idx, -1)}
              onMoveRight={() => move(idx, 1)}
              disabled={persist.isPending || isUploading}
            />
          ))}
        </div>
      )}

      {/* تنبيه آمن */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          الصورة الأولى هي الرئيسية المعروضة في المتجر. اضغط النجمة لتغيير الرئيسية،
          أو الأسهم لإعادة الترتيب.
        </span>
      </div>
    </div>
  );
}

function ImageTile({
  url,
  index,
  isPrimary,
  isFirst,
  isLast,
  onSetPrimary,
  onDelete,
  onMoveLeft,
  onMoveRight,
  disabled,
}: {
  url: string;
  index: number;
  isPrimary: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-muted ${
        isPrimary ? "border-accent ring-2 ring-accent/40" : "border-border"
      }`}
    >
      <div className="relative aspect-square">
        <img
          src={url}
          alt={`صورة ${index + 1}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {isPrimary && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-accent-foreground shadow">
            <Star className="h-3 w-3 fill-current" />
            رئيسية
          </span>
        )}
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-between gap-1 border-t border-border bg-card p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSetPrimary}
          disabled={disabled || isPrimary}
          aria-label="تعيين كرئيسية"
          title="تعيين كرئيسية"
        >
          {isPrimary ? (
            <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
          ) : (
            <StarOff className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-1">
          {/* RTL: ArrowRight = للسابق (أعلى)، ArrowLeft = للتالي (أسفل) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMoveLeft}
            disabled={disabled || isFirst}
            aria-label="تحريك للأمام"
            title="تحريك للأمام"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMoveRight}
            disabled={disabled || isLast}
            aria-label="تحريك للخلف"
            title="تحريك للخلف"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          disabled={disabled}
          aria-label="حذف"
          title="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
