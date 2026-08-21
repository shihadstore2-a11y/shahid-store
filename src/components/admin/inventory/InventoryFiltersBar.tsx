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
  DEFAULT_INVENTORY_FILTERS,
  type InventoryFilters,
  type InventoryStatus,
} from "@/lib/admin-inventory";

export function InventoryFiltersBar({
  value,
  onChange,
  onRefresh,
  isRefreshing,
}: {
  value: InventoryFilters;
  onChange: (next: InventoryFilters) => void;
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
    value.search ||
    value.provider !== "all" ||
    value.status !== "all" ||
    value.duration !== "all";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث باسم المستخدم"
          className="pr-9"
        />
      </div>

      <Select
        value={value.provider}
        onValueChange={(v) =>
          onChange({ ...value, provider: v as InventoryFilters["provider"] })
        }
      >
        <SelectTrigger className="lg:w-[160px]">
          <SelectValue placeholder="المزوّد" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل المزوّدين</SelectItem>
          <SelectItem value="falcon">فالكون</SelectItem>
          <SelectItem value="hulk">هولك</SelectItem>
          <SelectItem value="smarters">سمارترز</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(v) =>
          onChange({ ...value, status: v as InventoryStatus | "all" })
        }
      >
        <SelectTrigger className="lg:w-[160px]">
          <SelectValue placeholder="الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الحالات</SelectItem>
          <SelectItem value="available">متاح</SelectItem>
          <SelectItem value="reserved">محجوز</SelectItem>
          <SelectItem value="claimed">مسلَّم</SelectItem>
          <SelectItem value="expired">منتهي</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={String(value.duration)}
        onValueChange={(v) =>
          onChange({
            ...value,
            duration: v === "all" ? "all" : (Number(v) as 1 | 3 | 6 | 12),
          })
        }
      >
        <SelectTrigger className="lg:w-[140px]">
          <SelectValue placeholder="المدة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل المُدد</SelectItem>
          <SelectItem value="1">شهر</SelectItem>
          <SelectItem value="3">3 أشهر</SelectItem>
          <SelectItem value="6">6 أشهر</SelectItem>
          <SelectItem value="12">سنة</SelectItem>
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
            onClick={() => onChange(DEFAULT_INVENTORY_FILTERS)}
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

