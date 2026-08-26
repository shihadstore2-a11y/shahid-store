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
import type { DateRange } from "@/lib/admin-orders";
import type { AbandonedFilters } from "@/lib/admin-abandoned-orders";

export function AbandonedFiltersBar({
  value,
  onChange,
  onRefresh,
  isRefreshing,
}: {
  value: AbandonedFilters;
  onChange: (next: AbandonedFilters) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  const [searchInput, setSearchInput] = useState(value.search || "");

  useEffect(() => {
    setSearchInput(value.search || "");
  }, [value.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== (value.search || "")) {
        onChange({ ...value, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasFilters =
    Boolean(value.search) ||
    (value.dateRange && value.dateRange !== "all") ||
    (value.sortBy && value.sortBy !== "newest");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث برقم الطلب / الاسم / الجوال / الإيميل"
          className="pr-9"
        />
      </div>

      <Select
        value={value.dateRange || "all"}
        onValueChange={(v) => onChange({ ...value, dateRange: v as DateRange })}
      >
        <SelectTrigger className="lg:w-[150px]">
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
        value={value.sortBy || "newest"}
        onValueChange={(v) =>
          onChange({
            ...value,
            sortBy: v as "newest" | "oldest" | "highest" | "lowest",
          })
        }
      >
        <SelectTrigger className="lg:w-[150px]">
          <SelectValue placeholder="ترتيب" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">الأحدث أولاً</SelectItem>
          <SelectItem value="oldest">الأقدم أولاً</SelectItem>
          <SelectItem value="highest">الأعلى قيمة</SelectItem>
          <SelectItem value="lowest">الأقل قيمة</SelectItem>
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
          <RefreshCw
            className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
          />
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                search: "",
                dateRange: "all",
                sortBy: "newest",
              })
            }
            className="gap-1"
          >
            <X className="h-3.5 w-3.5" />
            مسح الفلاتر
          </Button>
        )}
      </div>
    </div>
  );
}
