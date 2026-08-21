import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Clock } from "lucide-react";

type Props = {
  slug: string;
  duration: number;
  variant?: "default" | "compact";
};

type StockResult = { available: boolean; reason?: string };

export function StockStatusBadge({ slug, duration, variant = "default" }: Props) {
  const safeDuration = duration && duration > 0 ? duration : 1;
  const { data, isLoading } = useQuery({
    queryKey: ["stock-check", slug, safeDuration],
    queryFn: async (): Promise<StockResult> => {
      const { data, error } = await supabase.rpc("check_stock_available", {
        _slug: slug,
        _duration: safeDuration,
      });
      if (error) {
        console.error("[D.3] Stock check error:", error);
        return { available: true };
      }
      return (data as StockResult) ?? { available: true };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full bg-muted/60 ${
          variant === "compact" ? "h-5 w-20" : "h-6 w-28"
        } animate-pulse`}
        aria-label="جارٍ التحقق من التوفر"
      />
    );
  }

  const isAvailable = data?.available !== false;

  if (isAvailable) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 ${
          variant === "compact" ? "py-0.5 text-[11px]" : "py-1 text-xs"
        } font-bold text-emerald-300`}
      >
        <Zap className={variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        متاح فوراً
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 ${
        variant === "compact" ? "py-0.5 text-[11px]" : "py-1 text-xs"
      } font-bold text-amber-300`}
    >
      <Clock className={variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {variant === "compact" ? "خلال 1-3 ساعات" : "تسليم خلال 1-3 ساعات"}
    </span>
  );
}
