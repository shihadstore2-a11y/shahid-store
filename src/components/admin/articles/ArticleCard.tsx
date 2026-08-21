import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Article } from "@/lib/admin-articles";
import { togglePublish } from "@/lib/admin-articles";

type Props = {
  article: Article;
  onEdit: (a: Article) => void;
  onDelete: (a: Article) => void;
};

export function ArticleCard({ article: a, onEdit, onDelete }: Props) {
  const qc = useQueryClient();
  const toggleMut = useMutation({
    mutationFn: (v: boolean) => togglePublish(a.id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["public-articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-bold">{a.title_ar}</div>
          {a.excerpt && (
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</div>
          )}
        </div>
        {a.category && <Badge variant="secondary" className="shrink-0">{a.category}</Badge>}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {a.view_count.toLocaleString("ar-SA")} مشاهدة
        </div>
        <span>
          {a.published_at
            ? new Date(a.published_at).toLocaleDateString("ar-SA")
            : new Date(a.created_at).toLocaleDateString("ar-SA")}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Switch checked={a.is_published} onCheckedChange={(v) => toggleMut.mutate(v)} />
          <span className="text-xs">{a.is_published ? "منشور" : "مسودة"}</span>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => onEdit(a)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(a)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
