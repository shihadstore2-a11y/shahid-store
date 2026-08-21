import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import {
  diffToCountdown,
  getCountdownTarget,
  isSeasonActive,
  isSeasonStarted,
} from "@/lib/season";

const labels = [
  { key: "days", label: "يوم" },
  { key: "hours", label: "ساعة" },
  { key: "minutes", label: "دقيقة" },
  { key: "seconds", label: "ثانية" },
] as const;

const TARGET = getCountdownTarget();

export function SeasonCountdown() {
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState(() => diffToCountdown(TARGET));
  const active = mounted && isSeasonActive();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setParts(diffToCountdown(TARGET)), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  if (isSeasonStarted() || parts.done) {
    return (
      <section className="bg-secondary py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
            <Clock className="h-4 w-4" /> الموسم الكبير
          </div>
          <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">
            الموسم بدأ — استمتع الآن
          </h2>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90"
          >
            تصفح الباقات السنوية
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-secondary py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
          <Clock className="h-4 w-4" /> العد التنازلي للموسم الكبير
        </div>
        <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-black leading-tight text-foreground sm:text-4xl">
          استعد مبكراً واختر باقتك السنوية بسعر مناسب
        </h2>

        <div
          aria-live="polite"
          className="mx-auto mt-8 grid max-w-3xl grid-cols-4 gap-2 sm:gap-4"
        >
          {labels.map(({ key, label }) => (
            <div
              key={key}
              className="min-w-0 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:rounded-2xl sm:p-5"
              style={{
                background:
                  "linear-gradient(160deg, oklch(0.97 0.03 145) 0%, oklch(0.96 0.05 85) 100%)",
              }}
            >
              <div className="text-2xl font-black tabular-nums text-primary sm:text-5xl">
                {String(parts[key]).padStart(2, "0")}
              </div>
              <div className="mt-1 text-xs font-bold text-muted-foreground sm:text-sm">
                {label}
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/products"
          search={{ duration: 12 } as never}
          className="mt-8 inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold text-white shadow-[var(--shadow-gold)] hover:opacity-95"
          style={{ background: "var(--gradient-gold)" }}
        >
          تصفح الباقات السنوية
        </Link>
      </div>
    </section>
  );
}
