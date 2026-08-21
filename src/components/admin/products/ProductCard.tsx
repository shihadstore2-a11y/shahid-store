import { ExternalLink, FileText, ImageIcon, Sparkles, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { InlineEditField } from "@/components/admin/InlineEditField";
import {
  calcDiscountPercent,
  type AdminProductRow,
  type AdminProductUpdate,
} from "@/lib/admin-products";
import { getProductImage } from "@/lib/productVisuals";
import { formatSAR } from "@/lib/format";

export function ProductCard({
  product,
  onUpdate,
  onOpenImages,
  onOpenDescription,
  onOpenFeatures,
}: {
  product: AdminProductRow;
  onUpdate: (id: string, updates: AdminProductUpdate) => Promise<void>;
  onOpenImages: (id: string) => void;
  onOpenDescription: (id: string) => void;
  onOpenFeatures: (id: string) => void;
}) {
  const img = getProductImage(product.slug, product.category?.slug, product.image_urls);
  const discount = calcDiscountPercent(product);
  const imageCount = product.image_urls?.length ?? 0;
  const hasDescription = (product.description ?? "").trim().length > 0;
  const featuresCount = product.features?.length ?? 0;

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 ${
        product.is_active ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <InlineEditField
            value={product.name_ar}
            ariaLabel={`تعديل اسم ${product.name_ar}`}
            onSave={(val) => onUpdate(product.id, { name_ar: String(val) })}
            className="text-sm font-bold"
            inputClassName="w-full"
          />
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-[11px]">
              {product.category?.name_ar ?? "—"}
            </span>
            <span dir="ltr" className="text-[11px] text-muted-foreground">
              {product.slug}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="إدارة الصور"
            onClick={() => onOpenImages(product.id)}
            className="relative"
          >
            <ImageIcon className="h-4 w-4" />
            {imageCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-black text-accent-foreground">
                {imageCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={hasDescription ? "تعديل الوصف" : "إضافة وصف"}
            onClick={() => onOpenDescription(product.id)}
            className="relative"
          >
            <FileText className="h-4 w-4" />
            <span
              className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-1 ring-card ${
                hasDescription ? "bg-[var(--gold)]" : "bg-muted-foreground/50"
              }`}
              aria-hidden
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="تعديل المزايا"
            onClick={() => onOpenFeatures(product.id)}
            className="relative"
          >
            <Sparkles className="h-4 w-4" />
            {featuresCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-black text-accent-foreground">
                {featuresCount}
              </span>
            )}
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="عرض في المتجر">
            <Link to="/product/$slug" params={{ slug: product.slug }} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">السعر الأصلي</span>
          <InlineEditField
            value={product.base_price}
            type="number"
            min={0}
            ariaLabel="تعديل السعر الأصلي"
            onSave={(val) => onUpdate(product.id, { base_price: Number(val) })}
            formatDisplay={(v) => (v == null ? "—" : formatSAR(Number(v)))}
            className="-mr-2 text-sm font-bold"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">
            سعر العرض {discount > 0 && <span className="text-[var(--sale-price)]">(-{discount}%)</span>}
          </span>
          <InlineEditField
            value={product.sale_price}
            type="number"
            min={0}
            nullable
            placeholder="بدون عرض"
            ariaLabel="تعديل سعر العرض"
            onSave={(val) =>
              onUpdate(product.id, { sale_price: val == null ? null : Number(val) })
            }
            formatDisplay={(v) =>
              v == null || v === "" ? "بدون عرض" : formatSAR(Number(v))
            }
            className="-mr-2 text-sm font-bold text-[var(--sale-price)]"
          />
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={product.is_active}
              onCheckedChange={(v) => onUpdate(product.id, { is_active: v })}
              aria-label={`تفعيل ${product.name_ar}`}
            />
            نشط
          </label>
          <button
            type="button"
            onClick={() => onUpdate(product.id, { is_bestseller: !product.is_bestseller })}
            aria-label="الأكثر طلباً"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent/10"
          >
            <Star
              className={
                product.is_bestseller
                  ? "h-4 w-4 fill-[var(--gold)] text-[var(--gold)]"
                  : "h-4 w-4 text-muted-foreground"
              }
            />
            الأكثر طلباً
          </button>
        </div>
        <label className="flex items-center justify-between gap-2 text-xs">
          <div className="flex flex-col">
            <span className="font-bold">نظام المخزون</span>
            <span className="text-[10px] text-muted-foreground">
              {product.stock_management_enabled
                ? "تسليم تلقائي من المخزون"
                : "تسليم يدوي عبر الواتساب"}
            </span>
          </div>
          <Switch
            checked={product.stock_management_enabled}
            onCheckedChange={(v) => {
              onUpdate(product.id, { stock_management_enabled: v });
              toast.success(
                v ? "تم تفعيل نظام المخزون" : "تم تعطيل نظام المخزون"
              );
            }}
            aria-label={`نظام المخزون لـ ${product.name_ar}`}
          />
        </label>
      </div>
    </div>
  );
}
