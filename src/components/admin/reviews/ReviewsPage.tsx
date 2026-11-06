import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewsQueryOptions, type StoreReview } from "@/lib/admin-reviews";
import { RequireRole } from "@/components/admin/RequireRole";
import { ReviewsStatsStrip } from "./ReviewsStatsStrip";
import { ReviewsTable } from "./ReviewsTable";
import { ReviewCard } from "./ReviewCard";
import { CreateReviewDialog } from "./CreateReviewDialog";
import { DeleteReviewDialog } from "./DeleteReviewDialog";
import { ReviewsSettingsDialog } from "./ReviewsSettingsDialog";

type Filter = "all" | "active" | "inactive";

export function ReviewsPage() {
  const { data: reviews = [], isLoading } = useQuery(reviewsQueryOptions());
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<StoreReview | null>(null);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filter === "active" && !r.is_active) return false;
      if (filter === "inactive" && r.is_active) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const author = (r.author_name || r.customer_name || "").toLowerCase();
        const prod = (r.product_label || r.product_name || "").toLowerCase();
        const comment = (r.comment_ar || r.review_text || r.comment || "").toLowerCase();
        if (!author.includes(q) && !prod.includes(q) && !comment.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, filter, search]);

  return (
    <RequireRole roles={["super_admin", "admin", "developer"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">إدارة تقييمات العملاء</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              تقييمات العملاء الموثقة التي تظهر في المتجر وصفحات الاشتراكات.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <ReviewsSettingsDialog />
            <CreateReviewDialog />
          </div>
        </div>

        <ReviewsStatsStrip reviews={reviews} />

        {/* شريط الفلاتر والبحث */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as Filter[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f === "all" ? "الكل" : f === "active" ? "ظاهر بالمتجر" : "مخفي / معلّق"}
              </Button>
            ))}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم العميل أو الباقة..."
              className="pr-9 text-xs h-9"
            />
          </div>
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
                  لا توجد تقييمات مطابقة.
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
