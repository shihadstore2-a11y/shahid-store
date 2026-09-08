import { useRef, useState } from "react";
import { Plus, Loader2, Upload, ImageIcon, X, Images, Check } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  createAdminProduct,
  type AdminCategory,
  type AdminProductInsert,
} from "@/lib/admin-products";
import {
  uploadProductImage,
  validateImageFile,
  fetchStoreMediaLibrary,
} from "@/lib/admin-product-images";

interface AddProductDialogProps {
  categories: AdminCategory[];
  onCreated: () => void;
}

export function AddProductDialog({ categories, onCreated }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || "");
  const [basePrice, setBasePrice] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [compatText, setCompatText] = useState(
    "Smart TV\nAndroid TV\niOS / Apple TV\nWindows / Mac\nMAG / Formuler"
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedLibraryUrl, setSelectedLibraryUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<"upload" | "library">("upload");
  const [stockEnabled, setStockEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // جلب مكتبة وسائط المتجر الحالية
  const { data: libraryImages = [] } = useQuery({
    queryKey: ["admin", "store-media-library"],
    queryFn: fetchStoreMediaLibrary,
    enabled: open,
  });

  const handleNameChange = (val: string) => {
    setNameAr(val);
    if (!slug || slug === nameAr.toLowerCase().replace(/\s+/g, "-")) {
      setSlug(
        val
          .trim()
          .toLowerCase()
          .replace(/[^\w\u0621-\u064A0-9-]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleFileSelect = (file: File) => {
    const err = validateImageFile(file);
    if (err) {
      toast.error(err.message);
      return;
    }
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      toast.error("يرجى إدخال اسم المنتج");
      return;
    }
    const bPrice = parseFloat(basePrice);
    if (isNaN(bPrice) || bPrice <= 0) {
      toast.error("يرجى إدخال سعر أصلي صالح");
      return;
    }
    const sPrice = salePrice.trim() ? parseFloat(salePrice) : null;
    if (sPrice !== null && (isNaN(sPrice) || sPrice <= 0)) {
      toast.error("يرجى إدخال سعر عرض صالح");
      return;
    }

    const finalSlug = slug.trim() || `product-${Date.now()}`;
    const featuresList = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const compatList = compatText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      let finalImageUrl = "/logo.webp";

      // إذا اختار المدير صورة من مكتبة المتجر الحالية
      if (imageSource === "library" && selectedLibraryUrl) {
        finalImageUrl = selectedLibraryUrl;
      } else if (imageFile) {
        // إذا تم اختيار صورة من الجهاز، يتم رفعها مباشرة إلى مجلد المتجر الموحد STORE_ID
        toast.loading("جارٍ حفظ صورة المنتج...", { id: "upload-img" });
        finalImageUrl = await uploadProductImage(finalSlug, imageFile, { customSlug: finalSlug });
        toast.dismiss("upload-img");
      }

      const payload: AdminProductInsert = {
        name_ar: nameAr.trim(),
        slug: finalSlug,
        category_id: categoryId || null,
        base_price: bPrice,
        sale_price: sPrice,
        description: description.trim() || null,
        features: featuresList.length ? featuresList : ["اشتراك رسمي عالي الجودة", "تفعيل سريع وسهل"],
        compatibility: compatList.length
          ? compatList
          : ["Smart TV", "Android TV", "iOS / Apple TV", "Windows / Mac", "MAG / Formuler"],
        image_urls: [finalImageUrl],
        stock_management_enabled: stockEnabled,
        is_active: isActive,
        is_bestseller: false,
        is_featured: false,
        sort_order: 1,
      };

      await createAdminProduct(payload);
      toast.success("تمت إضافة المنتج بنجاح!");
      setOpen(false);

      // Reset form
      setNameAr("");
      setSlug("");
      setBasePrice("");
      setSalePrice("");
      setDescription("");
      setFeaturesText("");
      setCompatText("Smart TV\nAndroid TV\niOS / Apple TV\nWindows / Mac\nMAG / Formuler");
      handleRemoveImage();
      onCreated();
    } catch (err: any) {
      toast.error("تعذرت إضافة المنتج: " + (err?.message || "خطأ غير متوقع"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--gold)] text-black font-bold hover:bg-[var(--gold)]/90 gap-2 text-xs sm:text-sm">
          <Plus className="h-4 w-4" />
          إضافة منتج جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-right">إضافة منتج جديد للمتجر</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-right pt-2">
          {/* اسم المنتج */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">اسم المنتج *</label>
            <Input
              placeholder="مثال: اشتراك فالكون 12 شهر VIP"
              value={nameAr}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          {/* الرابط التعريفي Slug والتصنيف */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">الرابط التعريفي (Slug)</label>
              <Input
                placeholder="falcon-12m-vip"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">التصنيف</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm cursor-pointer"
              >
                <option value="">بدون تصنيف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* الأسعار */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">السعر الأصلي (ر.س) *</label>
              <Input
                type="number"
                step="any"
                placeholder="250"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">سعر العرض/الخصم (اختياري)</label>
              <Input
                type="number"
                step="any"
                placeholder="199"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          {/* اختيار أو رفع صورة المنتج */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-muted-foreground">صورة المنتج</label>
              <div className="flex items-center gap-1 rounded-lg bg-zinc-900/90 p-1 border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageSource("upload")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    imageSource === "upload"
                      ? "bg-zinc-800 text-white font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  رفع من الجهاز
                </button>
                <button
                  type="button"
                  onClick={() => setImageSource("library")}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                    imageSource === "library"
                      ? "bg-zinc-800 text-[var(--gold)] font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Images className="h-3.5 w-3.5" />
                  <span>مكتبة المتجر</span>
                  {libraryImages.length > 0 && (
                    <span className="text-[10px] bg-zinc-700/60 px-1.5 py-0.2 rounded-full text-zinc-300">
                      {libraryImages.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {imageSource === "upload" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />

                {imagePreview ? (
                  <div className="relative flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <img
                      src={imagePreview}
                      alt="معاينة الصورة"
                      className="h-16 w-16 rounded-lg object-cover border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-foreground">
                        {imageFile?.name || "صورة مختارة"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ""}
                      </p>
                      <span className="inline-block mt-1 text-[10px] text-emerald-500 font-bold">
                        جاهزة للحفظ مباشرة في مجلد المتجر الموحد ✓
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveImage}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="إلغاء الصورة"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-5 text-center transition-colors hover:border-accent hover:bg-accent/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground">
                      <Upload className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        اضغط لاختيار صورة من جهازك
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        JPG, PNG, WEBP (الحد الأقصى 2MB) — تحفظ تلقائياً في مجلد المتجر بدون تكرار
                      </p>
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-zinc-950/50 p-2.5">
                  {libraryImages.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground">
                      لا توجد صور مخزنة حالياً في المتجر. يمكنك الرفع من جهازك أولاً.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {libraryImages.map((img) => {
                        const isSelected = selectedLibraryUrl === img.url;
                        return (
                          <button
                            type="button"
                            key={img.url}
                            onClick={() => setSelectedLibraryUrl(img.url)}
                            className={`group relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                              isSelected
                                ? "border-amber-400 ring-2 ring-amber-400/30 scale-[1.02]"
                                : "border-border/60 hover:border-muted-foreground/60"
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.sourceProductName || "صورة المتجر"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                <div className="bg-amber-400 text-black rounded-full p-0.5 shadow">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedLibraryUrl && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                    <span className="truncate">✓ تم اختيار صورة من مكتبة المتجر (تمنع تكرار التخزين)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedLibraryUrl(null)}
                      className="text-zinc-400 hover:text-white shrink-0 ml-2"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* الوصف */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">وصف المنتج</label>
            <Textarea
              placeholder="وصف مختصر ومميز للمنتج..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* المميزات */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              المميزات (اكتب كل ميزة في سطر منفصل)
            </label>
            <Textarea
              placeholder="+25,000 قناة عالمية&#10;جودة 4K UHD فائقة&#10;تفعيل سريع ودعم 24/7"
              rows={3}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
            />
          </div>

          {/* التوافق والأجهزة */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              الأجهزة المتوافقة (اكتب كل جهاز في سطر منفصل)
            </label>
            <Textarea
              placeholder="Smart TV&#10;Android TV&#10;iOS / Apple TV&#10;Windows / Mac&#10;MAG / Formuler"
              rows={3}
              value={compatText}
              onChange={(e) => setCompatText(e.target.value)}
            />
          </div>

          {/* التبديلات السريعة */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="flex flex-col">
              <span className="text-sm font-bold">الحالة (نشط في المتجر)</span>
              <span className="text-[11px] text-muted-foreground">يظهر للزبائن ويتاح شراؤه فوراً</span>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="flex flex-col">
              <span className="text-sm font-bold">نظام المخزون (تسليم تلقائي)</span>
              <span className="text-[11px] text-muted-foreground">تسليم الأكواد تلقائياً للعميل عند الشراء</span>
            </div>
            <Switch checked={stockEnabled} onCheckedChange={setStockEnabled} />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--gold)] text-black font-bold hover:bg-[var(--gold)]/90"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الإضافة...
                </>
              ) : (
                "إضافة المنتج"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
