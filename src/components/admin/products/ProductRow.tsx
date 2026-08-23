import { ExternalLink, FileText, ImageIcon, Info, Sparkles, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InlineEditField } from "@/components/admin/InlineEditField";
import { cn } from "@/lib/utils";
import {
  calcDiscountPercent,
  type AdminProductRow,
  type AdminProductUpdate,
} from "@/lib/admin-products";
import { getProductImage } from "@/lib/productVisuals";
import { formatSAR } from "@/lib/format";

export function ProductRow({
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
    <TableRow className={product.is_active ? "" : "opacity-60"}>
      {/* صورة */}
      <TableCell>
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      </TableCell>

      {/* الاسم + slug */}
      <TableCell className="min-w-[220px]">
        <InlineEditField
          value={product.name_ar}
          ariaLabel={`تعديل اسم ${product.name_ar}`}
          onSave={(val) => onUpdate(product.id, { name_ar: String(val) })}
          className="text-sm font-bold"
          inputClassName="w-56"
        />
        <p dir="ltr" className="mt-0.5 px-2 text-right text-[11px] text-muted-foreground">
          {product.slug}
        </p>
      </TableCell>

      {/* الفئة */}
      <TableCell>
        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
          {product.category?.name_ar ?? "—"}
        </span>
      </TableCell>

      {/* base_price */}
      <TableCell>
        <InlineEditField
          value={product.base_price}
          type="number"
          min={0}
          suffix="ر.س"
          ariaLabel="تعديل السعر الأصلي"
          onSave={(val) => onUpdate(product.id, { base_price: Number(val) })}
          formatDisplay={(v) => (v == null ? "—" : formatSAR(Number(v)))}
        />
      </TableCell>

      {/* sale_price */}
      <TableCell>
        <InlineEditField
          value={product.sale_price}
          type="number"
          min={0}
          nullable
          suffix="ر.س"
          placeholder="بدون عرض"
          ariaLabel="تعديل سعر العرض"
          onSave={(val) => onUpdate(product.id, { sale_price: val == null ? null : Number(val) })}
          formatDisplay={(v) =>
            v == null || v === "" ? "بدون عرض" : formatSAR(Number(v))
          }
          className="text-[var(--sale-price)] font-bold"
        />
      </TableCell>

      {/* خصم */}
      <TableCell>
        {discount > 0 ? (
          <span className="inline-flex rounded-md bg-[var(--sale-price)]/15 px-2 py-0.5 text-xs font-black text-[var(--sale-price)]">
            -{discount}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* is_active */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={product.is_active}
            onCheckedChange={(v) => {
              onUpdate(product.id, { is_active: v });
              toast.success(v ? `تم تفعيل ${product.name_ar}` : `تم تعطيل ${product.name_ar}`);
            }}
            aria-label={`تفعيل ${product.name_ar}`}
          />
          <span
            className={cn(
              "text-[11px] font-bold px-1.5 py-0.5 rounded transition-colors",
              product.is_active
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
            )}
          >
            {product.is_active ? "نشط" : "معطل"}
          </span>
        </div>
      </TableCell>

      {/* stock_management_enabled */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={product.stock_management_enabled}
            onCheckedChange={(v) => {
              onUpdate(product.id, { stock_management_enabled: v });
              toast.success(
                v
                  ? `تم تفعيل نظام المخزون لـ ${product.name_ar}`
                  : `تم تعطيل نظام المخزون لـ ${product.name_ar}`
              );
            }}
            aria-label={`نظام المخزون لـ ${product.name_ar}`}
          />
          <span
            className={cn(
              "text-[11px] font-bold px-1.5 py-0.5 rounded transition-colors",
              product.stock_management_enabled
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
            )}
          >
            {product.stock_management_enabled ? "تلقائي" : "يدوي"}
          </span>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="شرح نظام المخزون"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-right">
                <p className="font-bold">تلقائي: تسليم فوري للأكواد من المخزون</p>
                <p className="mt-0.5 opacity-80">يدوي: تسليم الطلبات يدوياً عبر الواتساب</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>

      {/* is_bestseller */}
      <TableCell>
        <button
          type="button"
          onClick={() => onUpdate(product.id, { is_bestseller: !product.is_bestseller })}
          aria-label="الأكثر طلباً"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent/10"
        >
          <Star
            className={
              product.is_bestseller
                ? "h-4 w-4 fill-[var(--gold)] text-[var(--gold)]"
                : "h-4 w-4 text-muted-foreground"
            }
          />
        </button>
      </TableCell>

      {/* إجراءات */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="إدارة الصور"
            title="إدارة الصور"
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
            aria-label="تعديل الوصف"
            title={hasDescription ? "تعديل الوصف" : "إضافة وصف"}
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
            aria-label="تعديل مزايا الباقة"
            title={featuresCount > 0 ? `تعديل المزايا (${featuresCount})` : "إضافة مزايا"}
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
      </TableCell>
    </TableRow>
  );
}
