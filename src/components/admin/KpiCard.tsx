import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  hint,
  current,
  previous,
  Icon,
  iconBg,
}: {
  title: string;
  value: string;
  hint: string;
  current: number;
  previous: number;
  Icon: LucideIcon;
  iconBg: string;
}) {
  const diff = current - previous;
  const pct = previous === 0 ? (current === 0 ? 0 : 100) : (diff / previous) * 100;
  const up = diff >= 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-[var(--shadow-gold)]">
      {/* Gold ambient overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(80% 60% at 100% 0%, oklch(0.78 0.16 85 / 0.10) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-zinc-300">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight tabular-nums">{value}</p>
        </div>
        <div
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105",
            iconBg,
          )}
        >
          <Icon className="h-5 w-5 text-white" />
          <span
            aria-hidden
            className="absolute inset-0 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
            style={{ background: "var(--gold)" }}
          />
        </div>
      </div>
      <div className="relative mt-3 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 font-black tabular-nums",
            up
              ? "border-success/30 bg-success/10 text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-red-300",
          )}
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(pct).toFixed(0)}%
        </span>
        <span className="truncate text-zinc-400">{hint}</span>
      </div>

      {/* Bottom accent bar */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] origin-right scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100",
          iconBg,
        )}
      />
    </div>
  );
}
