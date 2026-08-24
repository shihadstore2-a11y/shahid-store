import { useCallback, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Layers,
  Images,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGES_PER_PRODUCT,
  deleteProductImageFromStorage,
  fetchStoreMediaLibrary,
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
  const [activeTab, setActiveTab] = useState<"product" | "library">("product");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const urls = product.image_urls ?? [];
  const remainingSlots = Math.max(0, MAX_IMAGES_PER_PRODUCT - urls.length);

  // استعلام مكتبة صور المتجر السابقة
  const mediaLibraryQuery = useQuery({
    queryKey: ["admin", "store-media-library"],
    queryFn: fetchStoreMediaLibrary,
    enabled: activeTab === "library",
  });

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
      queryClient.invalidateQueries({ queryKey: ["admin", "store-media-library"] });
    },
  });

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

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
          toast.success(`تم رفع ${uploaded.length} صورة بنجاح`);
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
      deleteProductImageFromStorage(url).catch(() => {
        /* تجاهل لو كان خارجياً */
      });
      toast.success("تم حذف الصورة من المنتج");
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

  const toggleLibraryImage = async (mediaUrl: string) => {
    const isAdded = urls.includes(mediaUrl);
    if (isAdded) {
      const next = urls.filter((u) => u !== mediaUrl);
      await persist.mutateAsync(next);
      toast.success("تمت إزالة الصورة من المنتج");
    } else {
      if (urls.length >= MAX_IMAGES_PER_PRODUCT) {
        toast.error(`الحد الأقصى ${MAX_IMAGES_PER_PRODUCT} صور لكل منتج`);
        return;
      }
      const next = [...urls, mediaUrl];
      await persist.mutateAsync(next);
      toast.success("تمت إضافة الصورة للمنتج");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* الرأس */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black sm:text-lg">
            صور المنتج · {product.name_ar}
          </h2>
          <p className="mt-0.5 text-right text-xs text-muted-foreground">
            {urls.length} من {MAX_IMAGES_PER_PRODUCT} صور مستخدمة
          </p>
        </div>
      </div>

      {/* شريط التبويبات بين صور المنتج ومكتبة المتجر */}
      <div className="flex rounded-xl border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("product")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
            activeTab === "product"
              ? "bg-card text-accent shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          صور المنتج ورفع جديد ({urls.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
            activeTab === "library"
              ? "bg-card text-accent shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Images className="h-3.5 w-3.5" />
          مكتبة صور المتجر
        </button>
      </div>

      {/* التبويب الأول: صور المنتج الحالية + رفع ملفات جديدة */}
      {activeTab === "product" && (
        <div className="space-y-4">
          {/* منطقة الرفع */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
              isDragOver
                ? "border-accent bg-accent/5"
                : "border-border bg-muted/20 hover:border-accent/60"
            } ${remainingSlots === 0 ? "opacity-60 pointer-events-none" : ""}`}
          >
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Upload className="h-5 w-5" />
            </div>
            <p className="mb-1 text-xs font-bold">
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
            <p className="text-[10px] text-muted-foreground">
              JPG / PNG / WEBP — الحد الأقصى {Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB لكل صورة
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

          {/* قائمة الصور المرفقة للمنتج */}
          {urls.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs font-bold">لا توجد صور مخصصة لهذا المنتج بعد</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                يمكنك رفع صورة جديدة أو اختيار صورة من تبويب "مكتبة صور المتجر".
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-muted-foreground">
                الصور المرفقة ({urls.length}) — الأولى هي الصورة الرئيسية
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {urls.map((url, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <div
                      key={url}
                      className={`relative flex items-center gap-3 rounded-xl border p-2.5 bg-card transition-all ${
                        isPrimary ? "border-accent ring-1 ring-accent/30" : "border-border"
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover border border-border shrink-0 bg-background"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isPrimary ? (
                            <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-black text-accent">
                              <Star className="h-3 w-3 fill-accent" /> رئيسية
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-bold">
                              صورة #{idx + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {!isPrimary && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPrimary(idx)}
                              className="h-6 px-1.5 text-[10px] gap-1 font-bold"
                            >
                              <Star className="h-2.5 w-2.5" /> جعلها رئيسية
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* أزرار التحكم بالصورة */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeAt(idx)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="حذف من المنتج"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center">
                          {idx > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => move(idx, -1)}
                              className="h-6 w-6 text-muted-foreground hover:bg-muted"
                              title="تقديم"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                          {idx < urls.length - 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => move(idx, 1)}
                              className="h-6 w-6 text-muted-foreground hover:bg-muted"
                              title="تأخير"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* التبويب الثاني: مكتبة وسائط المتجر (إعادة استخدام صور سابقة) */}
      {activeTab === "library" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            اضغط على أي صورة لإضافتها أو إزالتها من هذا المنتج دون الحاجة لإعادة رفعها:
          </p>

          {mediaLibraryQuery.isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : !mediaLibraryQuery.data || mediaLibraryQuery.data.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-xl text-xs text-muted-foreground">
              لا توجد صور مرفوعة سابقاً في متجرك. ارفع صورة جديدة من التبويب الأول.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto p-1">
              {mediaLibraryQuery.data.map((item) => {
                const isSelected = urls.includes(item.url);
                return (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => toggleLibraryImage(item.url)}
                    className={`group relative flex flex-col items-center overflow-hidden rounded-xl border p-2 text-right transition-all hover:scale-[1.02] ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                        : "border-border bg-card hover:border-accent"
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-background">
                      <img
                        src={item.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 w-full">
                      <p className="text-[10px] font-bold truncate text-foreground/80">
                        {item.sourceProductName || "صورة من المتجر"}
                      </p>
                      <span
                        className={`text-[9px] font-black ${
                          isSelected ? "text-emerald-500" : "text-accent group-hover:underline"
                        }`}
                      >
                        {isSelected ? "مُضافة للمنتج ✓" : "+ إضافة للمنتج"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
