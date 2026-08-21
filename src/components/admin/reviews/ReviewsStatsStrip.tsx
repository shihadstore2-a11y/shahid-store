import { MessageSquare, Eye, EyeOff, Star } from "lucide-react";
import type { StoreReview } from "@/lib/admin-reviews";
import { computeReviewsStats } from "@/lib/admin-reviews";

export function ReviewsStatsStrip({ reviews }: { reviews: StoreReview[] }) {
  const { total, active, inactive, avgRating } = computeReviewsStats(reviews);
  const items = [
    { label: "إجمالي التقييمات", value: total, Icon: MessageSquare, color: "text-foreground" },
    { label: "ظاهر", value: active, Icon: Eye, color: "text-green-400" },
    { label: "مخفي", value: inactive, Icon: EyeOff, color: "text-destructive" },
    { label: "متوسط التقييم", value: avgRating.toFixed(1), Icon: Star, color: "text-gold-foreground" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className={`rounded-lg bg-muted/40 p-2 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-black">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
