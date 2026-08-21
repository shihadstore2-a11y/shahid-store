import { useState } from "react";
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
import { createReview } from "@/lib/admin-reviews";
import { StarRating } from "./StarRating";

const schema = z.object({
  customer_name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  customer_city: z.string().trim().max(60).optional().or(z.literal("")),
  product_label: z.string().trim().max(80).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().trim().min(10, "النص قصير جداً").max(500),
  display_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export function CreateReviewDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_city: "",
    product_label: "",
    rating: 5,
    review_text: "",
    display_order: 100,
    is_active: true,
  });

  const mut = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["public-reviews"] });
      toast.success("تمت إضافة التقييم");
      setOpen(false);
      setForm({
        customer_name: "", customer_city: "", product_label: "",
        rating: 5, review_text: "", display_order: 100, is_active: true,
      });
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
    mut.mutate({
      ...parsed.data,
      customer_city: parsed.data.customer_city || null,
      product_label: parsed.data.product_label || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة تقييم
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة تقييم جديد</DialogTitle>
          <DialogDescription>سيظهر في الصفحة الرئيسية فور الحفظ.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>اسم العميل *</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>المدينة</Label>
              <Input
                value={form.customer_city}
                onChange={(e) => setForm((f) => ({ ...f, customer_city: e.target.value }))}
                maxLength={60}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>المنتج المُقيَّم</Label>
            <Input
              value={form.product_label}
              onChange={(e) => setForm((f) => ({ ...f, product_label: e.target.value }))}
              placeholder="فالكون سنة، هولك 6 شهور..."
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label>التقييم *</Label>
            <StarRating
              rating={form.rating}
              size="lg"
              editable
              onChange={(r) => setForm((f) => ({ ...f, rating: r }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>نص التقييم * ({form.review_text.length}/500)</Label>
            <Textarea
              value={form.review_text}
              onChange={(e) => setForm((f) => ({ ...f, review_text: e.target.value }))}
              maxLength={500}
              rows={4}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>الترتيب (الأصغر أولاً)</Label>
              <Input
                type="number"
                min={0}
                max={9999}
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="is-active-new">نشط (يظهر للعملاء)</Label>
              <Switch
                id="is-active-new"
                checked={form.is_active}
                onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
