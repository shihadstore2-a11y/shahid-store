import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewsQueryOptions, type StoreReview } from "@/lib/admin-reviews";
import { RequireRole } from "@/components/admin/RequireRole";
import { ReviewsStatsStrip } from "./ReviewsStatsStrip";
import { ReviewsTable } from "./ReviewsTable";
import { ReviewCard } from "./ReviewCard";
import { CreateReviewDialog } from "./CreateReviewDialog";
import { DeleteReviewDialog } from "./DeleteReviewDialog";

type Filter = "all" | "active" | "inactive";

export function ReviewsPage() {
  const { data: reviews = [], isLoading } = useQuery(reviewsQueryOptions());
  const [filter, setFilter] = useState<Filter>("all");
  const [toDelete, setToDelete] = useState<StoreReview | null>(null);

  const filtered = useMemo(() => {
    if (filter === "active") return reviews.filter((r) => r.is_active);
    if (filter === "inactive") return reviews.filter((r) => !r.is_active);
    return reviews;
  }, [reviews, filter]);

  return (
    <RequireRole roles={["super_admin", "admin", "developer"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">إدارة التقييمات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              تقييمات العملاء التي تظهر في الصفحة الرئيسية.
            </p>
          </div>
          <CreateReviewDialog />
        </div>

        <ReviewsStatsStrip reviews={reviews} />

        <div className="flex gap-2">
          {(["all", "active", "inactive"] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "الكل" : f === "active" ? "ظاهر" : "مخفي"}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <ReviewsTable reviews={filtered} onDelete={setToDelete} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  لا توجد تقييمات.
                </div>
              ) : (
                filtered.map((r) => (
                  <ReviewCard key={r.id} review={r} onDelete={setToDelete} />
                ))
              )}
            </div>
          </>
        )}

        <DeleteReviewDialog review={toDelete} onClose={() => setToDelete(null)} />
      </div>
    </RequireRole>
  );
}
