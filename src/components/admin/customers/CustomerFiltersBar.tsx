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
import type { CustomerPeriod, CustomerSortBy } from "@/lib/admin-customers";

export type CustomerFiltersState = {
  search: string;
  sortBy: CustomerSortBy;
  period: CustomerPeriod;
};

export const DEFAULT_CUSTOMER_FILTERS: CustomerFiltersState = {
  search: "",
  sortBy: "total_spent",
  period: "all",
};

export function CustomerFiltersBar({
  value,
  onChange,
  onRefresh,
  isRefreshing,
}: {
  value: CustomerFiltersState;
  onChange: (next: CustomerFiltersState) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  const [searchInput, setSearchInput] = useState(value.search);

  useEffect(() => {
    setSearchInput(value.search);
  }, [value.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== value.search) {
        onChange({ ...value, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasFilters =
    value.search || value.period !== "all" || value.sortBy !== "total_spent";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث بالاسم أو رقم الجوال"
          className="pr-9"
        />
      </div>

      <Select
        value={value.sortBy}
        onValueChange={(v) => onChange({ ...value, sortBy: v as CustomerSortBy })}
      >
        <SelectTrigger className="lg:w-[180px]">
          <SelectValue placeholder="الترتيب" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="total_spent">الأكثر إنفاقاً</SelectItem>
          <SelectItem value="last_order">الأحدث</SelectItem>
          <SelectItem value="order_count">الأكثر طلباً</SelectItem>
          <SelectItem value="first_order">الأقدم</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.period}
        onValueChange={(v) => onChange({ ...value, period: v as CustomerPeriod })}
      >
        <SelectTrigger className="lg:w-[140px]">
          <SelectValue placeholder="الفترة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الوقت</SelectItem>
          <SelectItem value="30d">آخر 30 يوم</SelectItem>
          <SelectItem value="90d">آخر 90 يوم</SelectItem>
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
            onClick={() => onChange(DEFAULT_CUSTOMER_FILTERS)}
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
