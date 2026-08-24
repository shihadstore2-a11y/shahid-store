import { ExternalLink, FileText, ImageIcon, Sparkles, Star, Trash2, Tv } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InlineEditField } from "@/components/admin/InlineEditField";
import {
  calcDiscountPercent,
  type AdminProductRow,
  type AdminProductUpdate,
  type AdminCategory,
} from "@/lib/admin-products";
import { getProductImage } from "@/lib/productVisuals";
import { formatSAR } from "@/lib/format";

export function ProductCard({
  product,
  categories = [],
  onUpdate,
  onDelete,
  onOpenImages,
  onOpenDescription,
  onOpenFeatures,
  onOpenCompatibility,
}: {
  product: AdminProductRow;
  categories?: AdminCategory[];
  onUpdate: (id: string, updates: AdminProductUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenImages: (id: string) => void;
  onOpenDescription: (id: string) => void;
  onOpenFeatures: (id: string) => void;
  onOpenCompatibility: (id: string) => void;
}) {
  const img = getProductImage(product.slug, product.category?.slug, product.image_urls);
  const discount = calcDiscountPercent(product);
  const imageCount = product.image_urls?.length ?? 0;
  const hasDescription = (product.description ?? "").trim().length > 0;
  const featuresCount = product.features?.length ?? 0;
  const compatibilityCount = product.compatibility?.length ?? 0;

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 space-y-3.5 transition-opacity ${
        product.is_active ? "" : "opacity-60"
      }`}
    >
      {/* الرأس: الصورة، الاسم، والتصنيف */}
      <div className="flex items-start gap-3">
        {/* صورة المنتج */}
        <button
          type="button"
          onClick={() => onOpenImages(product.id)}
          className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background transition-transform hover:scale-105"
          aria-label="تعديل الصور"
        >
          {img ? (
            <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <ImageIcon className="h-4 w-4 text-white" />
          </span>
          {imageCount > 1 && (
            <span className="absolute bottom-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black/70 px-1 text-[8px] font-bold text-white">
              {imageCount}
            </span>
          )}
        </button>

        {/* اسم المنتج وتصنيفه */}
        <div className="min-w-0 flex-1 space-y-1.5 text-right">
          <InlineEditField
            value={product.name_ar}
            ariaLabel={`تعديل اسم ${product.name_ar}`}
            onSave={(val) => onUpdate(product.id, { name_ar: String(val) })}
            className="text-sm font-black leading-snug"
          />

          {/* اختيار التصنيف */}
          <div className="flex items-center gap-1.5">
            <select
              value={product.category_id ?? ""}
              onChange={(e) => {
                const nextCatId = e.target.value ? e.target.value : null;
                onUpdate(product.id, { category_id: nextCatId });
                const selectedCat = categories.find((c) => c.id === nextCatId);
                toast.success(
                  selectedCat
                    ? `تم تغيير التصنيف إلى: ${selectedCat.name_ar}`
                    : "تم إزالة التصنيف"
                );
              }}
              className="h-7 max-w-[160px] truncate rounded-md border border-border bg-muted/40 px-2 text-[11px] font-bold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              aria-label="تغيير تصنيف المنتج"
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

        {/* زر الأكثر طلباً */}
        <button
          type="button"
          onClick={() => onUpdate(product.id, { is_bestseller: !product.is_bestseller })}
          aria-label="الأكثر طلباً"
          className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 transition-colors hover:bg-accent/10"
        >
          <Star
            className={
              product.is_bestseller
                ? "h-4 w-4 fill-[var(--gold)] text-[var(--gold)]"
                : "h-4 w-4 text-muted-foreground"
            }
          />
        </button>
      </div>

      {/* قسم الأسعار */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-right">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground">السعر الأساسي</span>
          <InlineEditField
            value={product.base_price}
            type="number"
            min={0}
            ariaLabel="تعديل السعر الأساسي"
            onSave={(val) => onUpdate(product.id, { base_price: Number(val) })}
            formatDisplay={(v) => (v == null ? "—" : formatSAR(Number(v)))}
            className={`text-xs font-bold ${
              product.sale_price !== null ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
            <span>سعر البيع</span>
            {discount > 0 && (
              <span className="text-[9px] font-black text-[var(--sale-price)]">(-{discount}%)</span>
            )}
          </div>
          <InlineEditField
            value={product.sale_price}
            type="number"
            min={0}
            nullable
            placeholder="بدون عرض"
            ariaLabel="تعديل سعر البيع"
            onSave={(val) =>
              onUpdate(product.id, { sale_price: val == null ? null : Number(val) })
            }
            formatDisplay={(v) =>
              v == null || v === "" ? `${formatSAR(product.base_price)} (الأساسي)` : formatSAR(Number(v))
            }
            className="text-xs font-black text-accent"
          />
        </div>
      </div>

      {/* خيارات التبديل (نشط + نظام المخزون) */}
      <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs">
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 px-3 py-2">
          <span className="font-bold text-[11px]">نشط بالمتجر</span>
          <Switch
            checked={product.is_active}
            onCheckedChange={(v) => onUpdate(product.id, { is_active: v })}
            aria-label={`تفعيل ${product.name_ar}`}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 px-3 py-2">
          <div className="flex flex-col">
            <span className="font-bold text-[11px]">نظام المخزون</span>
            <span className="text-[9px] text-muted-foreground">
              {product.stock_management_enabled ? "تسليم تلقائي" : "يدوي"}
            </span>
          </div>
          <Switch
            checked={product.stock_management_enabled}
            onCheckedChange={(v) => {
              onUpdate(product.id, { stock_management_enabled: v });
              toast.success(v ? "تم تفعيل نظام المخزون" : "تم تعطيل نظام المخزون");
            }}
            aria-label={`نظام المخزون لـ ${product.name_ar}`}
          />
        </div>
      </div>

      {/* شريط الإجراءات الأفقي المنسق في الأسفل */}
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <div className="flex items-center gap-1">
          {/* صور المنتج */}
          <Button
            variant="ghost"
            size="sm"
            aria-label="إدارة الصور"
            title="إدارة الصور"
            onClick={() => onOpenImages(product.id)}
            className="h-8 px-2 text-xs relative gap-1 hover:bg-accent/10"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span className="text-[10px]">الصور</span>
            {imageCount > 0 && (
              <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[8px] font-black text-accent-foreground">
                {imageCount}
              </span>
            )}
          </Button>

          {/* الوصف والرابط */}
          <Button
            variant="ghost"
            size="sm"
            aria-label={hasDescription ? "تعديل الوصف والرابط" : "إضافة وصف"}
            title="تعديل الوصف والرابط"
            onClick={() => onOpenDescription(product.id)}
            className="h-8 px-2 text-xs relative gap-1 hover:bg-accent/10"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="text-[10px]">الوصف</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasDescription ? "bg-[var(--gold)]" : "bg-muted-foreground/50"
              }`}
            />
          </Button>

          {/* المزايا */}
          <Button
            variant="ghost"
            size="sm"
            aria-label="تعديل المزايا"
            title="تعديل المزايا"
            onClick={() => onOpenFeatures(product.id)}
            className="h-8 px-2 text-xs relative gap-1 hover:bg-accent/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[10px]">المزايا</span>
            {featuresCount > 0 && (
              <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[8px] font-black text-accent-foreground">
                {featuresCount}
              </span>
            )}
          </Button>

          {/* الأجهزة المتوافقة */}
          <Button
            variant="ghost"
            size="sm"
            aria-label="تعديل الأجهزة المتوافقة"
            title="تعديل الأجهزة المتوافقة"
            onClick={() => onOpenCompatibility(product.id)}
            className="h-8 px-2 text-xs relative gap-1 hover:bg-accent/10"
          >
            <Tv className="h-3.5 w-3.5" />
            <span className="text-[10px]">الأجهزة</span>
            {compatibilityCount > 0 && (
              <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[8px] font-black text-accent-foreground">
                {compatibilityCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* عرض بالمتجر */}
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="عرض في المتجر" title="عرض في المتجر">
            <Link to="/product/$slug" params={{ slug: product.slug }} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>

          {/* حذف المنتج */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="حذف المنتج"
                title="حذف المنتج"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="text-right">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-right font-black">تأكيد حذف المنتج</AlertDialogTitle>
                <AlertDialogDescription className="text-right text-sm">
                  هل أنت متأكد من رغبتك في حذف <strong className="text-foreground font-bold">"{product.name_ar}"</strong> نهائياً؟
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse justify-start gap-2 pt-2">
                <AlertDialogCancel>تراجع</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(product.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                >
                  نعم، احذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
