import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type AdminCategoryItem,
} from "@/lib/admin-categories";

type Props = {
  categories: AdminCategoryItem[];
  onChanged: () => void;
};

export function ManageCategoriesDialog({ categories, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // New category form state
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);

  const handleNameChange = (val: string) => {
    setNameAr(val);
    if (!slug || slug === nameAr.toLowerCase().replace(/\s+/g, "-")) {
      setSlug(
        val
          .trim()
          .toLowerCase()
          .replace(/[^\w\u0621-\u064A0-9-]+/g, "-")
      );
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminCategory({
        name_ar: nameAr,
        slug: slug || `cat-${Date.now()}`,
        sort_order: sortOrder,
      }),
    onSuccess: () => {
      toast.success("تمت إضافة التصنيف بنجاح");
      setNameAr("");
      setSlug("");
      setSortOrder(0);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onChanged();
    },
    onError: (err: any) => {
      toast.error("تعذرت إضافة التصنيف: " + (err?.message || "خطأ غير معروف"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      updateAdminCategory(id, {
        name_ar: editNameAr,
        slug: editSlug,
        sort_order: editSortOrder,
      }),
    onSuccess: () => {
      toast.success("تم تعديل التصنيف بنجاح");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onChanged();
    },
    onError: (err: any) => {
      toast.error("تعذر تعديل التصنيف: " + (err?.message || "خطأ غير معروف"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      toast.success("تم حذف التصنيف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onChanged();
    },
    onError: (err: any) => {
      toast.error("تعذر حذف التصنيف: " + (err?.message || "خطأ غير معروف"));
    },
  });

  const handleStartEdit = (cat: AdminCategoryItem) => {
    setEditingId(cat.id);
    setEditNameAr(cat.name_ar);
    setEditSlug(cat.slug);
    setEditSortOrder(cat.sort_order ?? 0);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editNameAr.trim()) {
      toast.error("يرجى إدخال اسم التصنيف");
      return;
    }
    await updateMutation.mutateAsync(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border bg-card/60 hover:bg-card gap-2 font-bold text-xs sm:text-sm">
          <Layers className="h-4 w-4 text-accent" />
          إدارة التصنيفات
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-right">
            <FolderTree className="h-5 w-5 text-accent" />
            <DialogTitle className="text-lg font-black">إدارة تصنيفات وفئات المتجر</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">
            إضافة، تعديل، أو حذف أقسام وتصنيفات المنتجات (تظهر في القوائم وفلاتر المتجر).
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* قسم إضافة تصنيف جديد */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <h3 className="text-xs font-black flex items-center gap-1.5 text-accent">
              <Plus className="h-4 w-4" />
              إضافة تصنيف جديد
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground mb-1 block">
                  اسم التصنيف *
                </label>
                <Input
                  value={nameAr}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: باقات VIP"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground mb-1 block">
                  الرابط التعريفي (Slug)
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="vip-packages"
                  dir="ltr"
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground mb-1 block">
                  الترتيب
                </label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  placeholder="0"
                  dir="ltr"
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={() => {
                  if (!nameAr.trim()) {
                    toast.error("يرجى كتابة اسم التصنيف");
                    return;
                  }
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending}
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                ) : (
                  <Plus className="h-4 w-4 ml-1" />
                )}
                إضافة التصنيف
              </Button>
            </div>
          </div>

          {/* قائمة التصنيفات الحالية */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-muted-foreground">
              التصنيفات الحالية ({categories.length})
            </h3>

            {categories.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                لا توجد تصنيفات حالياً. أضف تصنيفاً جديداً أعلاه.
              </div>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-3 transition-colors hover:bg-muted/10"
                  >
                    {editingId === cat.id ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                        <Input
                          value={editNameAr}
                          onChange={(e) => setEditNameAr(e.target.value)}
                          className="h-8 text-xs font-bold"
                          placeholder="اسم التصنيف"
                        />
                        <Input
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="h-8 text-xs font-mono"
                          dir="ltr"
                          placeholder="slug"
                        />
                        <Input
                          type="number"
                          value={editSortOrder}
                          onChange={(e) => setEditSortOrder(Number(e.target.value))}
                          className="h-8 text-xs"
                          dir="ltr"
                          placeholder="الترتيب"
                        />
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {cat.name_ar}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground" dir="ltr">
                            ({cat.slug})
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          ترتيب العرض: {cat.sort_order ?? 0}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      {editingId === cat.id ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveEdit(cat.id)}
                            disabled={updateMutation.isPending}
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            title="حفظ"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            className="h-8 w-8 text-muted-foreground hover:bg-muted"
                            title="إلغاء"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(cat)}
                            className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                            title="تعديل التصنيف"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="حذف التصنيف"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="text-right">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-right font-black">
                                  تأكيد حذف التصنيف
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-right text-sm">
                                  هل أنت متأكد من حذف تصنيف <strong className="text-foreground">"{cat.name_ar}"</strong>؟
                                  <br />
                                  <span className="text-xs text-muted-foreground mt-1 block">
                                    ملاحظة: المنتجات التابعة لهذا التصنيف ستبقى موجودة وتصبح "بدون تصنيف".
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row-reverse justify-start gap-2 pt-2">
                                <AlertDialogCancel>تراجع</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(cat.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                                >
                                  نعم، احذف التصنيف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
