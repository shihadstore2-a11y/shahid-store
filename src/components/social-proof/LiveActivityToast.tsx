import { useEffect, useRef, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { formatTimeAgo, recentActivities } from "@/data/recentActivity";

const STORAGE_KEY = "shahid:activity-dismissed";
const LEGACY_STORAGE_KEY = "lega:activity-dismissed";
const INITIAL_DELAY = 6000;
const VISIBLE_MS = 4500;
const GAP_MS = 3500;

// ملاحظة: prop liftAboveSticky مُحتفَظ به للتوافق مع الاستدعاءات الحالية
// لكنه غير مستخدم بعد نقل التوست للأعلى (لا تداخل مع شريط أسفل الشاشة).
export function LiveActivityToast({ liftAboveSticky: _liftAboveSticky = false }: { liftAboveSticky?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState<number>(0);
  const [dismissed, setDismissed] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const lastIndexRef = useRef<number>(-1);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const dismissedNow =
      window.sessionStorage.getItem(STORAGE_KEY) === "1" ||
      window.sessionStorage.getItem(LEGACY_STORAGE_KEY) === "1";
    setDismissed(dismissedNow);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (!mounted || dismissed || paused) return;
    const clearAll = () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };

    const pickNext = () => {
      let next = Math.floor(Math.random() * recentActivities.length);
      if (recentActivities.length > 1) {
        while (next === lastIndexRef.current) {
          next = Math.floor(Math.random() * recentActivities.length);
        }
      }
      lastIndexRef.current = next;
      setIndex(next);
      setVisible(true);
      const hide = window.setTimeout(() => setVisible(false), VISIBLE_MS);
      const next2 = window.setTimeout(pickNext, VISIBLE_MS + GAP_MS);
      timersRef.current.push(hide, next2);
    };

    const start = window.setTimeout(pickNext, INITIAL_DELAY);
    timersRef.current.push(start);
    return clearAll;
  }, [mounted, dismissed, paused]);

  if (!mounted || dismissed) return null;
  const item = recentActivities[index];

  return (
    <div
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={[
        // أسفل Header + CategoriesBar مع هامش تنفّس آمن
        "fixed right-3 z-toast-activity block max-w-[260px] sm:max-w-sm md:right-4",
        "top-[calc(env(safe-area-inset-top)+7rem)] md:top-[8.25rem]",
        reduceMotion ? "" : "transition-all duration-300 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : reduceMotion
            ? "pointer-events-none opacity-0"
            : "-translate-y-4 pointer-events-none opacity-0",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-accent/30 bg-card/95 p-2.5 shadow-[0_10px_30px_-12px_oklch(0_0_0/0.55)] backdrop-blur-md md:gap-3 md:p-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white md:h-10 md:w-10"
          style={{ background: "var(--gradient-gold)" }}
          aria-hidden
        >
          <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-[13px] font-bold text-foreground md:text-sm">
            {item.name} من {item.city}
          </p>
          <p className="truncate text-[11px] text-muted-foreground md:text-xs">
            اشترك في {item.product} · {formatTimeAgo(item.minutesAgo)}
          </p>
        </div>
        <button
          aria-label="إغلاق"
          onClick={() => {
            window.sessionStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
