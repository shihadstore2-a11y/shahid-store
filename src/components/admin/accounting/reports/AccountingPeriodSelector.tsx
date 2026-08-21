import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PERIOD_LABELS_AR,
  PERIOD_PRESETS,
  type PeriodPreset,
} from "@/lib/admin-accounting-reports";

export function AccountingPeriodSelector({
  value,
  onChange,
}: {
  value: PeriodPreset;
  onChange: (p: PeriodPreset) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max items-center gap-2 px-1">
        {PERIOD_PRESETS.map((p) => {
          const active = p === value;
          return (
            <Button
              key={p}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(p)}
              className={cn(
                "rounded-full font-bold transition-all",
                active
                  ? "bg-gold text-background hover:bg-gold/90 border-gold shadow-[var(--shadow-gold)]"
                  : "border-border hover:border-gold/60 hover:text-gold",
              )}
            >
              {PERIOD_LABELS_AR[p]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
