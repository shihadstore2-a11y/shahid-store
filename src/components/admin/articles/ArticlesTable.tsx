import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Article } from "@/lib/admin-articles";
import { togglePublish } from "@/lib/admin-articles";

type Props = {
  articles: Article[];
  onEdit: (a: Article) => void;
  onDelete: (a: Article) => void;
};

export function ArticlesTable({ articles, onEdit, onDelete }: Props) {
  const qc = useQueryClient();
  const toggleMut = useMutation({
    mutationFn: ({ id, v }: { id: string; v: boolean }) => togglePublish(id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["public-articles"] });
      toast.success("تم تحديث الحالة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        لا توجد مقالات. أضف أول مقالة!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-right text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">العنوان</th>
            <th className="px-4 py-3 font-semibold">التصنيف</th>
            <th className="px-4 py-3 font-semibold">الحالة</th>
            <th className="px-4 py-3 font-semibold">المشاهدات</th>
            <th className="px-4 py-3 font-semibold">التاريخ</th>
            <th className="px-4 py-3 font-semibold">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="font-bold">{a.title_ar}</div>
                {a.excerpt && (
                  <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{a.excerpt}</div>
                )}
                <div className="mt-1 text-[10px] text-muted-foreground/70 font-mono">{a.slug}</div>
              </td>
              <td className="px-4 py-3">
                {a.category ? (
                  <Badge variant="secondary">{a.category}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={a.is_published}
                    onCheckedChange={(v) => toggleMut.mutate({ id: a.id, v })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {a.is_published ? "منشور" : "مسودة"}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <div className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {a.view_count.toLocaleString("ar-SA")}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {a.published_at
                  ? new Date(a.published_at).toLocaleDateString("ar-SA")
                  : new Date(a.created_at).toLocaleDateString("ar-SA")}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(a)} title="تحرير">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(a)}
                    title="حذف"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
