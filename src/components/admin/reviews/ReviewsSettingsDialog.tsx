import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, Sparkles, ShieldCheck, Clock, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  reviewsSettingsQueryOptions,
  saveReviewsSettings,
  DEFAULT_REVIEWS_SETTINGS,
  type ReviewsSettings,
} from "@/lib/admin-reviews";

export function ReviewsSettingsDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: remoteSettings = DEFAULT_REVIEWS_SETTINGS, isLoading } = useQuery(
    reviewsSettingsQueryOptions()
  );

  const [settings, setSettings] = useState<ReviewsSettings>(DEFAULT_REVIEWS_SETTINGS);

  useEffect(() => {
    if (remoteSettings) {
      setSettings(remoteSettings);
    }
  }, [remoteSettings]);

  const saveMutation = useMutation({
    mutationFn: (newSettings: ReviewsSettings) => saveReviewsSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-settings"] });
      toast.success("تم حفظ إعدادات التقييمات بنجاح ✨");
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-border bg-card/60 hover:bg-card gap-2 font-bold text-xs sm:text-sm"
        >
          <Settings2 className="h-4 w-4 text-accent" />
          <span>إعدادات التقييمات</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-right">
            <Settings2 className="h-5 w-5 text-accent" />
            <DialogTitle className="text-lg font-black">إعدادات نشر التقييمات</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">
            التحكم في سياسة قبول ونشر تقييمات العملاء في متجر ديوان البث.
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : (
          <div className="space-y-4 py-3">
            {/* بطاقة إعداد النشر التلقائي */}
            <div
              className={`rounded-xl border p-4 transition-all ${
                settings.auto_publish
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      نشر التقييمات تلقائياً
                    </span>
                    {settings.auto_publish ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                        <Check className="h-3 w-3 ml-1" />
                        نشر فوري
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
                        <Clock className="h-3 w-3 ml-1" />
                        موافقة مسبقة
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {settings.auto_publish
                      ? "يتم نشر تقييمات العملاء فور إرسالها وتظهر في صفحة المنتج والمتجر فوراً."
                      : "تبقى التقييمات الجديدة مخفية حتى تقوم الإدارة بمراجعتها وتفعيلها يدوياً."}
                  </p>
                </div>
                <Switch
                  checked={settings.auto_publish}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, auto_publish: checked }))
                  }
                />
              </div>
            </div>

            {/* بطاقة الموثوقية */}
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>حماية ضد التقييمات الوهمية</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                يتحقق النظام آلياً من سجلات الطلبات في قاعدة البيانات قبل السماح بإرسال أي تقييم، بحيث لا يستطيع تقييم أي منتج سوى العميل الذي اشتراه وتم تفعيل طلبه بنجاح.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            إلغاء
          </Button>
          <Button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending || isLoading}
            className="bg-accent text-accent-foreground font-black text-xs gap-2"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <span>حفظ الإعدادات</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

