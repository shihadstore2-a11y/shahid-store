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
import type { CouponFilters, CouponStatus } from "@/lib/admin-coupons";

export function CouponFiltersBar({
  value,
  onChange,
  onRefresh,
  isRefreshing,
}: {
  value: CouponFilters;
  onChange: (next: CouponFilters) => void;
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

  const hasFilters = value.search || value.status !== "all";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث بكود الكوبون"
          className="pr-9"
        />
      </div>

      <Select
        value={value.status}
        onValueChange={(v) => onChange({ ...value, status: v as CouponStatus })}
      >
        <SelectTrigger className="lg:w-[180px]">
          <SelectValue placeholder="الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الحالات</SelectItem>
          <SelectItem value="active">نشط</SelectItem>
          <SelectItem value="expired">منتهي</SelectItem>
          <SelectItem value="disabled">معطّل</SelectItem>
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
            onClick={() => onChange({ search: "", status: "all" })}
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
