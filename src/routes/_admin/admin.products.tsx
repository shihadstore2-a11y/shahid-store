import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Package, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductFiltersBar } from "@/components/admin/products/ProductFiltersBar";
import { ProductStatsStrip } from "@/components/admin/products/ProductStatsStrip";
import { ProductsTable } from "@/components/admin/products/ProductsTable";
import { ProductCard } from "@/components/admin/products/ProductCard";
import { ProductImagesManager } from "@/components/admin/products/ProductImagesManager";
import { ProductDescriptionEditor } from "@/components/admin/products/ProductDescriptionEditor";
import { ProductFeaturesEditor } from "@/components/admin/products/ProductFeaturesEditor";
import { ProductCompatibilityEditor } from "@/components/admin/products/ProductCompatibilityEditor";
import { AddProductDialog } from "@/components/admin/products/AddProductDialog";
import { ManageCategoriesDialog } from "@/components/admin/products/ManageCategoriesDialog";
import {
  adminProductsQueryOptions,
  updateAdminProduct,
  deleteAdminProduct,
  type AdminProductRow,
  type AdminProductUpdate,
  type ProductFilters,
} from "@/lib/admin-products";

export const Route = createFileRoute("/_admin/admin/products")({
  head: () => ({
    meta: [
      { title: "المنتجات — إدارة شاهد" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductsAdminPage,
});

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  categorySlug: "all",
  sortBy: "default",
};

function ProductsAdminPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [imagesProductId, setImagesProductId] = useState<string | null>(null);
  const [descProductId, setDescProductId] = useState<string | null>(null);
  const [featuresProductId, setFeaturesProductId] = useState<string | null>(null);
  const [compatProductId, setCompatProductId] = useState<string | null>(null);

  const queryOpts = adminProductsQueryOptions(filters);
  const { data, isLoading, isFetching, error } = useQuery(queryOpts);

  const rows = data?.rows ?? [];
  const categories = data?.categories ?? [];

  const selectedProduct = useMemo(
    () => rows.find((r) => r.id === imagesProductId) ?? null,
    [rows, imagesProductId],
  );
  const descProduct = useMemo(
    () => rows.find((r) => r.id === descProductId) ?? null,
    [rows, descProductId],
  );
  const featuresProduct = useMemo(
    () => rows.find((r) => r.id === featuresProductId) ?? null,
    [rows, featuresProductId],
  );
  const compatProduct = useMemo(
    () => rows.find((r) => r.id === compatProductId) ?? null,
    [rows, compatProductId],
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AdminProductUpdate }) =>
      updateAdminProduct(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "products"] });
      const snapshot = queryClient.getQueriesData<{
        rows: AdminProductRow[];
        categories: typeof categories;
      }>({ queryKey: ["admin", "products"] });
      snapshot.forEach(([key, prev]) => {
        if (!prev) return;
        queryClient.setQueryData(key, {
          ...prev,
          rows: prev.rows.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        });
      });
      return { snapshot };
    },
    onError: (err: any, _vars, context) => {
      context?.snapshot.forEach(([key, prev]) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
      toast.error("تعذّر التحديث: " + (err?.message ?? "خطأ غير معروف"));
    },
    onSuccess: () => {
      toast.success("تم التحديث");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleUpdate = async (id: string, updates: AdminProductUpdate) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      toast.success("تم حذف المنتج بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error("تعذر حذف المنتج: " + (err?.message || "خطأ غير معروف"));
    },
  });

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleOpenImages = (id: string) => setImagesProductId(id);
  const handleOpenDescription = (id: string) => setDescProductId(id);
  const handleOpenFeatures = (id: string) => setFeaturesProductId(id);
  const handleOpenCompatibility = (id: string) => setCompatProductId(id);

  const hasActiveFilters =
    filters.search || filters.categorySlug !== "all" || filters.sortBy !== "default";

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">إدارة المنتجات</h1>
          <p className="text-sm text-muted-foreground">
            تعديل سريع للأسعار والحالة والصور — اضغط على أي حقل للتعديل المباشر.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <ManageCategoriesDialog
            categories={categories}
            onChanged={() => {
              queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
              queryClient.invalidateQueries({ queryKey: ["products"] });
              queryClient.invalidateQueries({ queryKey: ["categories"] });
            }}
          />
          <AddProductDialog
            categories={categories}
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
              queryClient.invalidateQueries({ queryKey: ["products"] });
            }}
          />
        </div>
      </header>

      {!isLoading && <ProductStatsStrip rows={rows} />}

      <ProductFiltersBar
        value={filters}
        categories={categories}
        onChange={setFilters}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
        }
        isRefreshing={isFetching}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          فشل تحميل المنتجات: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyFiltered onReset={() => setFilters(DEFAULT_FILTERS)} />
        ) : (
          <EmptyNoProducts />
        )
      ) : (
        <>
          <div className="hidden md:block">
            <ProductsTable
              rows={rows}
              categories={categories}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onOpenImages={handleOpenImages}
              onOpenDescription={handleOpenDescription}
              onOpenFeatures={handleOpenFeatures}
              onOpenCompatibility={handleOpenCompatibility}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onOpenImages={handleOpenImages}
                onOpenDescription={handleOpenDescription}
                onOpenFeatures={handleOpenFeatures}
                onOpenCompatibility={handleOpenCompatibility}
              />
            ))}
          </div>
        </>
      )}

      <Sheet
        open={imagesProductId !== null}
        onOpenChange={(open) => {
          if (!open) setImagesProductId(null);
        }}
      >
        <SheetContent
          side="left"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>إدارة صور المنتج</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            {selectedProduct ? (
              <ProductImagesManager
                product={selectedProduct}
                onClose={() => setImagesProductId(null)}
              />
            ) : (
              <p className="p-5 text-sm text-muted-foreground">جارٍ التحميل...</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={descProductId !== null}
        onOpenChange={(open) => {
          if (!open) setDescProductId(null);
        }}
      >
        <SheetContent
          side="left"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>تعديل وصف المنتج</SheetTitle>
          </SheetHeader>
          {descProduct ? (
            <ProductDescriptionEditor
              product={descProduct}
              onClose={() => setDescProductId(null)}
            />
          ) : (
            <p className="p-5 text-sm text-muted-foreground">جارٍ التحميل...</p>
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={featuresProductId !== null}
        onOpenChange={(open) => {
          if (!open) setFeaturesProductId(null);
        }}
      >
        <SheetContent
          side="left"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>تعديل مزايا الباقة</SheetTitle>
          </SheetHeader>
          {featuresProduct ? (
            <ProductFeaturesEditor
              product={featuresProduct}
              onClose={() => setFeaturesProductId(null)}
            />
          ) : (
            <p className="p-5 text-sm text-muted-foreground">جارٍ التحميل...</p>
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={compatProductId !== null}
        onOpenChange={(open) => {
          if (!open) setCompatProductId(null);
        }}
      >
        <SheetContent
          side="left"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>تعديل الأجهزة المتوافقة</SheetTitle>
          </SheetHeader>
          {compatProduct ? (
            <ProductCompatibilityEditor
              product={compatProduct}
              onClose={() => setCompatProductId(null)}
            />
          ) : (
            <p className="p-5 text-sm text-muted-foreground">جارٍ التحميل...</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EmptyNoProducts() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-black">لا توجد منتجات</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        تُضاف المنتجات من قاعدة البيانات مباشرة.
      </p>
    </div>
  );
}

function EmptyFiltered({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-black">لا توجد نتائج مطابقة</h3>
      <p className="mt-1 text-sm text-muted-foreground">جرّب تعديل الفلاتر أو مسحها</p>
      <Button variant="outline" size="sm" onClick={onReset} className="mt-4">
        مسح الفلاتر
      </Button>
    </div>
  );
}
