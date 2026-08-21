import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createArticle, updateArticle, type Article } from "@/lib/admin-articles";

const schema = z.object({
  title_ar: z.string().trim().min(5, "العنوان قصير جداً").max(200),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  content_md: z.string().trim().min(50, "المحتوى قصير جداً (50 حرف على الأقل)"),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  cover_image_url: z.string().trim().url("رابط الصورة غير صحيح").optional().or(z.literal("")),
  author: z.string().trim().max(80).optional().or(z.literal("")),
  meta_title: z.string().trim().max(160).optional().or(z.literal("")),
  meta_description: z.string().trim().max(300).optional().or(z.literal("")),
  is_published: z.boolean(),
});

const empty = {
  title_ar: "",
  slug: "",
  excerpt: "",
  content_md: "",
  category: "",
  cover_image_url: "",
  author: "",
  meta_title: "",
  meta_description: "",
  is_published: false,
};

type Props = {
  /** للتحرير: مرّر المقالة. للإضافة: اتركه فارغاً واستخدم trigger. */
  article?: Article | null;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  /** يعرض زر إضافة كـ trigger داخلي (مفيد للوضع "إضافة"). */
  withTrigger?: boolean;
};

export function ArticleFormDialog({ article, open: ctlOpen, onOpenChange, withTrigger }: Props) {
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = ctlOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = !!article;

  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (article) {
      setForm({
        title_ar: article.title_ar ?? "",
        slug: article.slug ?? "",
        excerpt: article.excerpt ?? "",
        content_md: article.content_md ?? "",
        category: article.category ?? "",
        cover_image_url: article.cover_image_url ?? "",
        author: article.author ?? "",
        meta_title: article.meta_title ?? "",
        meta_description: article.meta_description ?? "",
        is_published: article.is_published,
      });
    } else if (!open) {
      setForm(empty);
    }
  }, [article, open]);

  const mut = useMutation({
    mutationFn: async (payload: typeof empty) => {
      const parsed = schema.parse(payload);
      const clean = {
        title_ar: parsed.title_ar,
        slug: parsed.slug || undefined,
        excerpt: parsed.excerpt || null,
        content_md: parsed.content_md,
        category: parsed.category || null,
        cover_image_url: parsed.cover_image_url || null,
        author: parsed.author || "فريق شاهد ستور",
        meta_title: parsed.meta_title || null,
        meta_description: parsed.meta_description || null,
        is_published: parsed.is_published,
      };
      if (isEdit && article) {
        return updateArticle(article.id, {
          ...clean,
          published_at:
            parsed.is_published && !article.published_at
              ? new Date().toISOString()
              : !parsed.is_published
                ? null
                : article.published_at,
        } as Partial<Article>);
      }
      return createArticle(clean as never);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["public-articles"] });
      toast.success(isEdit ? "تم تحديث المقالة" : "تمت إضافة المقالة");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || "فشل الحفظ"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    mut.mutate(form);
  };

  const Body = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "تحرير المقالة" : "مقالة جديدة"}</DialogTitle>
        <DialogDescription>
          المحتوى يقبل Markdown بسيط: <code className="font-mono"># عنوان</code>،{" "}
          <code className="font-mono">**عريض**</code>،{" "}
          <code className="font-mono">- قائمة</code>.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>العنوان *</Label>
          <Input
            value={form.title_ar}
            onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
            maxLength={200}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>المعرّف (slug)</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="يُولَّد تلقائياً"
              maxLength={120}
              dir="ltr"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label>التصنيف</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="دروس / أخبار / عروض"
              maxLength={40}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>المقتطف ({form.excerpt.length}/300)</Label>
          <Textarea
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            maxLength={300}
            rows={2}
            placeholder="ملخّص قصير يظهر في القائمة"
          />
        </div>

        <div className="space-y-1.5">
          <Label>المحتوى (Markdown) * ({form.content_md.length})</Label>
          <Textarea
            value={form.content_md}
            onChange={(e) => setForm((f) => ({ ...f, content_md: e.target.value }))}
            rows={14}
            required
            className="font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>رابط صورة الغلاف</Label>
            <Input
              value={form.cover_image_url}
              onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label>اسم الكاتب</Label>
            <Input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              placeholder="فريق شاهد ستور"
              maxLength={80}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border p-3 space-y-3">
          <div className="text-xs font-bold text-muted-foreground">إعدادات SEO (اختياري)</div>
          <Input
            value={form.meta_title}
            onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
            placeholder="Meta Title"
            maxLength={160}
          />
          <Input
            value={form.meta_description}
            onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
            placeholder="Meta Description"
            maxLength={300}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="art-pub">نشر المقالة (تظهر في /blog)</Label>
          <Switch
            id="art-pub"
            checked={form.is_published}
            onCheckedChange={(c) => setForm((f) => ({ ...f, is_published: c }))}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEdit ? "حفظ التغييرات" : "إضافة"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (withTrigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            مقالة جديدة
          </Button>
        </DialogTrigger>
        {Body}
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {Body}
    </Dialog>
  );
}
