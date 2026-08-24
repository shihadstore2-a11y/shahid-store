import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

interface AddProductDialogProps {
  categories: AdminCategory[];
  onCreated: () => void;
}

export function AddProductDialog({ categories, onCreated }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
  const [imageUrl, setImageUrl] = useState("/logo.webp");
  const [stockEnabled, setStockEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const handleNameChange = (val: string) => {
    setNameAr(val);
    if (!slug || slug === nameAr.toLowerCase().replace(/\s+/g, "-")) {
      // Auto-generate basic slug
      setSlug(
        val
          .trim()
          .toLowerCase()
          .replace(/[^\w\u0621-\u064A0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
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
        image_urls: [imageUrl.trim() || "/logo.webp"],
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
      setImageUrl("/logo.webp");
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
        <Button className="bg-[var(--gold)] text-black font-bold hover:bg-[var(--gold)]/90 gap-2">
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
                className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm"
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

          {/* رابط الصورة */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">رابط صورة المنتج</label>
            <Input
              placeholder="/logo.webp أو رابط صورة"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              dir="ltr"
            />
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
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ وإضافة المنتج"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
