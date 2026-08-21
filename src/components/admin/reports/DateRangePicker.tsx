import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ReportFilters, ReportRange } from "@/lib/admin-reports";

const PRESETS: { value: Exclude<ReportRange, "custom">; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "7d", label: "7 أيام" },
  { value: "30d", label: "30 يوم" },
  { value: "90d", label: "90 يوم" },
];

export function DateRangePicker({
  value,
  onChange,
}: {
  value: ReportFilters;
  onChange: (next: ReportFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(
    value.range === "custom" && value.customFrom && value.customTo
      ? { from: new Date(value.customFrom), to: new Date(value.customTo) }
      : undefined,
  );

  const customLabel =
    value.range === "custom" && value.customFrom && value.customTo
      ? `${format(new Date(value.customFrom), "d MMM", { locale: ar })} → ${format(
          new Date(value.customTo),
          "d MMM",
          { locale: ar },
        )}`
      : "تاريخ مخصص";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
      {PRESETS.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={value.range === p.value ? "default" : "outline"}
          onClick={() => onChange({ range: p.value })}
          className={cn(
            "h-9 rounded-full px-4 font-bold",
            value.range === p.value &&
              "bg-accent text-accent-foreground hover:bg-accent/90",
          )}
        >
          {p.label}
        </Button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={value.range === "custom" ? "default" : "outline"}
            className={cn(
              "h-9 gap-2 rounded-full px-4 font-bold",
              value.range === "custom" &&
                "bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {customLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={1}
            locale={ar}
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="flex items-center justify-end gap-2 border-t border-border p-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button
              size="sm"
              disabled={!draft?.from || !draft?.to}
              onClick={() => {
                if (draft?.from && draft?.to) {
                  onChange({
                    range: "custom",
                    customFrom: format(draft.from, "yyyy-MM-dd"),
                    customTo: format(draft.to, "yyyy-MM-dd"),
                  });
                  setOpen(false);
                }
              }}
            >
              تطبيق
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
