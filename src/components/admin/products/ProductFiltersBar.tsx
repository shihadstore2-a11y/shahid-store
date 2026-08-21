import { RefreshCw, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminCategory, ProductFilters, ProductSort } from "@/lib/admin-products";

export function ProductFiltersBar({
  value,
  categories,
  onChange,
  onRefresh,
  isRefreshing,
}: {
  value: ProductFilters;
  categories: AdminCategory[];
  onChange: (next: ProductFilters) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  const [searchInput, setSearchInput] = useState(value.search);

  useEffect(() => {
    setSearchInput(value.search);
  }, [value.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== value.search) onChange({ ...value, search: searchInput });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasFilters =
    value.search || value.categorySlug !== "all" || value.sortBy !== "default";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث باسم المنتج أو الـ slug"
          className="pr-9"
        />
      </div>

      <Select
        value={value.categorySlug}
        onValueChange={(v) => onChange({ ...value, categorySlug: v })}
      >
        <SelectTrigger className="lg:w-[180px]">
          <SelectValue placeholder="الفئة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الفئات</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.name_ar}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.sortBy}
        onValueChange={(v) => onChange({ ...value, sortBy: v as ProductSort })}
      >
        <SelectTrigger className="lg:w-[180px]">
          <SelectValue placeholder="الترتيب" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">الترتيب الافتراضي</SelectItem>
          <SelectItem value="price_asc">السعر: من الأقل</SelectItem>
          <SelectItem value="price_desc">السعر: من الأعلى</SelectItem>
          <SelectItem value="name">الاسم (أ-ي)</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          aria-label="تحديث"
          disabled={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ search: "", categorySlug: "all", sortBy: "default" })}
            className="gap-1"
          >
            <X className="h-3.5 w-3.5" />
            مسح
          </Button>
        )}
      </div>
    </div>
  );
}
