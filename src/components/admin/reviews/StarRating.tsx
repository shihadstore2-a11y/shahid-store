import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onChange?: (rating: number) => void;
};

export function StarRating({ rating, size = "md", editable = false, onChange }: Props) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="inline-flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rating;
        const star = (
          <Star
            className={cn(
              sizeClass,
              filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
        );
        if (editable) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(i + 1)}
              className="cursor-pointer transition-transform hover:scale-110"
              aria-label={`${i + 1} نجوم`}
            >
              {star}
            </button>
          );
        }
        return <span key={i}>{star}</span>;
      })}
    </div>
  );
}
