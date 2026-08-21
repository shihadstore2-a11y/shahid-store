import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { isSeasonActive } from "@/lib/season";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveCoupon } from "@/lib/queries";

const STORAGE_KEY = "season_banner_dismissed";

export function SeasonBanner() {
  const [dismissed, setDismissed] = useState(false);
  const active = isSeasonActive();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
  }, []);

  const { data: coupon } = useQuery({
    queryKey: ["coupon", "SUMMER25"],
    queryFn: () => fetchActiveCoupon("SUMMER25"),
    enabled: active && !dismissed,
    staleTime: 1000 * 60 * 10,
  });

  if (!active || dismissed) return null;

  const handleClose = () => {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className="relative w-full text-white"
      style={{ background: "var(--gradient-season)" }}
    >
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4 text-xs font-bold sm:h-10 sm:text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Trophy className="h-4 w-4 shrink-0" aria-hidden />
          <p className="truncate">
            🏆 موسم كأس العالم — خصومات تصل إلى 50%
            {coupon ? (
              <>
                {" "}
                · استخدم كود{" "}
                <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono">
                  {coupon.code}
                </span>{" "}
                للحصول على {coupon.discount_percent}% خصم
              </>
            ) : null}
          </p>
        </div>
        <button
          aria-label="إغلاق الشريط"
          onClick={handleClose}
          className="rounded p-1 hover:bg-white/15"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
