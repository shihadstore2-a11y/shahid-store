import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

type Props = { slug: string; duration: number };

type StockResult = { available: boolean; reason?: string };

export function PreOrderWarning({ slug, duration }: Props) {
  const safeDuration = duration && duration > 0 ? duration : 1;
  const { data, isLoading } = useQuery({
    queryKey: ["stock-check", slug, safeDuration],
    queryFn: async (): Promise<StockResult> => {
      const { data, error } = await supabase.rpc("check_stock_available", {
        _slug: slug,
        _duration: safeDuration,
      });
      if (error) return { available: true };
      return (data as StockResult) ?? { available: true };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || data?.available !== false) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-right"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <div className="space-y-1">
        <p className="text-sm font-black text-amber-200">
          تنبيه: تسليم خلال 1-3 ساعات
        </p>
        <p className="text-xs leading-relaxed text-amber-100/80">
          المخزون منخفض حالياً. سنتواصل معك عبر واتساب لإرسال بيانات اشتراكك خلال 1-3 ساعات بعد إتمام الدفع.
        </p>
      </div>
    </div>
  );
}
