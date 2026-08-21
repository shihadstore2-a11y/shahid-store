import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { articlesQueryOptions, type Article } from "@/lib/admin-articles";
import { RequireRole } from "@/components/admin/RequireRole";
import { ArticlesStatsStrip } from "./ArticlesStatsStrip";
import { ArticlesTable } from "./ArticlesTable";
import { ArticleCard } from "./ArticleCard";
import { ArticleFormDialog } from "./ArticleFormDialog";
import { DeleteArticleDialog } from "./DeleteArticleDialog";

type Filter = "all" | "published" | "draft";

export function ArticlesPage() {
  const { data: articles = [], isLoading } = useQuery(articlesQueryOptions());
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState<Article | null>(null);

  const filtered = useMemo(() => {
    if (filter === "published") return articles.filter((a) => a.is_published);
    if (filter === "draft") return articles.filter((a) => !a.is_published);
    return articles;
  }, [articles, filter]);

  return (
    <RequireRole roles={["super_admin", "admin", "developer"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">إدارة المقالات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              مقالات المدوّنة التي تظهر في صفحة /blog.
            </p>
          </div>
          <ArticleFormDialog withTrigger />
        </div>

        <ArticlesStatsStrip articles={articles} />

        <div className="flex gap-2">
          {(["all", "published", "draft"] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "الكل" : f === "published" ? "منشور" : "مسودة"}
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
              <ArticlesTable articles={filtered} onEdit={setEditing} onDelete={setDeleting} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  لا توجد مقالات.
                </div>
              ) : (
                filtered.map((a) => (
                  <ArticleCard key={a.id} article={a} onEdit={setEditing} onDelete={setDeleting} />
                ))
              )}
            </div>
          </>
        )}

        <ArticleFormDialog
          article={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
        <DeleteArticleDialog article={deleting} onClose={() => setDeleting(null)} />
      </div>
    </RequireRole>
  );
}
