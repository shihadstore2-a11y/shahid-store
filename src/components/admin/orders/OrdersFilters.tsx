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
import {
  ADMIN_VISIBLE_STATUSES,
  ORDER_STATUS_LABELS,
  type DateRange,
  type OrderStatus,
  type SortBy,
} from "@/lib/admin-orders";

export type FiltersState = {
  search: string;
  status: OrderStatus | "all";
  dateRange: DateRange;
  sortBy: SortBy;
};

export function OrdersFilters({
  value,
  onChange,
  onRefresh,
  isRefreshing,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
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
    value.search || value.status !== "all" || value.dateRange !== "all" || value.sortBy !== "newest";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث برقم الطلب / الاسم / الجوال"
          className="pr-9"
        />
      </div>

      <Select
        value={value.status}
        onValueChange={(v) => onChange({ ...value, status: v as OrderStatus | "all" })}
      >
        <SelectTrigger className="lg:w-[160px]">
          <SelectValue placeholder="الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الحالات</SelectItem>
          {ADMIN_VISIBLE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.dateRange}
        onValueChange={(v) => onChange({ ...value, dateRange: v as DateRange })}
      >
        <SelectTrigger className="lg:w-[140px]">
          <SelectValue placeholder="التاريخ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">اليوم</SelectItem>
          <SelectItem value="7d">آخر 7 أيام</SelectItem>
          <SelectItem value="30d">آخر 30 يوم</SelectItem>
          <SelectItem value="all">كل الوقت</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.sortBy}
        onValueChange={(v) => onChange({ ...value, sortBy: v as SortBy })}
      >
        <SelectTrigger className="lg:w-[140px]">
          <SelectValue placeholder="ترتيب" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">الأحدث</SelectItem>
          <SelectItem value="oldest">الأقدم</SelectItem>
          <SelectItem value="highest">الأعلى قيمة</SelectItem>
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
            onClick={() =>
              onChange({ search: "", status: "all", dateRange: "all", sortBy: "newest" })
            }
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
