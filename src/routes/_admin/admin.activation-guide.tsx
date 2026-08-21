import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/admin/RequireRole";
import {
  allActivationStepsQueryOptions, createStep, deleteStep,
  swapStepOrder, updateStep, DEVICE_TYPES,
  uploadActivationStepImage, deleteActivationStepImageFromStorage,
  type ActivationStep, type DeviceId,
} from "@/lib/admin-activation";

export const Route = createFileRoute("/_admin/admin/activation-guide")({
  head: () => ({
    meta: [
      { title: "دليل التفعيل — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <RequireRole roles={["super_admin", "admin", "developer"]}>
      <ActivationAdminPage />
    </RequireRole>
  ),
});

function ActivationAdminPage() {
  const [device, setDevice] = useState<DeviceId>("ios");
  const { data: all = [], isLoading } = useQuery(allActivationStepsQueryOptions());
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivationStep | null>(null);

  const stepsByDevice = useMemo(() => {
    const m: Record<string, ActivationStep[]> = {};
    all.forEach((s) => {
      if (!m[s.device_type]) m[s.device_type] = [];
      m[s.device_type].push(s);
    });
    return m;
  }, [all]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">دليل التفعيل</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تعديل خطوات التفعيل لكل جهاز — تظهر فوراً في صفحة /activation-guide العامة
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">إضافة خطوة</span>
        </Button>
      </div>

      <Tabs value={device} onValueChange={(v) => setDevice(v as DeviceId)}>
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-card p-1">
          {DEVICE_TYPES.map((d) => (
            <TabsTrigger key={d.id} value={d.id} className="text-xs sm:text-sm">
              {d.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {DEVICE_TYPES.map((d) => {
          const steps = stepsByDevice[d.id] ?? [];
          return (
            <TabsContent key={d.id} value={d.id} className="mt-4">
              {isLoading ? (
                <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                  جارٍ التحميل…
                </div>
              ) : steps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                  <p className="text-sm text-muted-foreground">لا توجد خطوات لهذا الجهاز بعد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      isFirst={i === 0}
                      isLast={i === steps.length - 1}
                      neighborUp={steps[i - 1]}
                      neighborDown={steps[i + 1]}
                      onDelete={() => setDeleteTarget(step)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <AddStepDialog open={addOpen} onOpenChange={setAddOpen} device={device} existing={stepsByDevice[device] ?? []} />
      <DeleteStepDialog target={deleteTarget} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function StepRow({
  step, isFirst, isLast, neighborUp, neighborDown, onDelete,
}: {
  step: ActivationStep;
  isFirst: boolean; isLast: boolean;
  neighborUp?: ActivationStep; neighborDown?: ActivationStep;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(step.title_ar);
  const [desc, setDesc] = useState(step.description_ar ?? "");
  const [imageUrl, setImageUrl] = useState(step.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "activation-steps"] });
  const invalidatePublic = () => qc.invalidateQueries({ queryKey: ["activation-steps-public"] });

  const saveM = useMutation({
    mutationFn: () => updateStep(step.id, {
      title_ar: title.trim(),
      description_ar: desc.trim() || null,
      image_url: imageUrl.trim() || null,
    }),
    onSuccess: () => { toast.success("تم الحفظ"); setEditing(false); invalidate(); invalidatePublic(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: () => updateStep(step.id, { is_active: !step.is_active }),
    onSuccess: () => { invalidate(); invalidatePublic(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const swapM = useMutation({
    mutationFn: (dir: "up" | "down") => {
      const partner = dir === "up" ? neighborUp : neighborDown;
      if (!partner) return Promise.resolve();
      return swapStepOrder(step, partner);
    },
    onSuccess: () => { invalidate(); invalidatePublic(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadM = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      try {
        const url = await uploadActivationStepImage(step, file);
        if (step.image_url) {
          await deleteActivationStepImageFromStorage(step.image_url).catch(() => {});
        }
        await updateStep(step.id, { image_url: url });
        return url;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: (url) => {
      setImageUrl(url);
      toast.success("تم رفع الصورة");
      invalidate();
      invalidatePublic();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteImageM = useMutation({
    mutationFn: async () => {
      const oldUrl = step.image_url;
      await updateStep(step.id, { image_url: null });
      if (oldUrl) {
        await deleteActivationStepImageFromStorage(oldUrl).catch(() => {});
      }
    },
    onSuccess: () => {
      setImageUrl("");
      toast.success("تم حذف الصورة");
      invalidate();
      invalidatePublic();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={`rounded-2xl border bg-card p-4 ${step.is_active ? "border-border" : "border-dashed border-muted opacity-70"}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="icon" disabled={isFirst || swapM.isPending} onClick={() => swapM.mutate("up")} className="h-7 w-7">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className="text-center text-xs font-bold text-muted-foreground">{step.step_order}</span>
          <Button variant="ghost" size="icon" disabled={isLast || swapM.isPending} onClick={() => swapM.mutate("down")} className="h-7 w-7">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {editing ? (
            <>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="العنوان" />
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="الوصف" rows={3} />
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-bold text-muted-foreground">صورة الخطوة</p>

                {imageUrl && (
                  <div className="relative mb-3 inline-block">
                    <img
                      src={imageUrl}
                      alt="معاينة"
                      className="h-24 w-auto rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("هل تريد حذف الصورة الحالية؟")) deleteImageM.mutate();
                      }}
                      disabled={deleteImageM.isPending}
                      className="absolute left-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      aria-label="حذف الصورة"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadM.mutate(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {imageUrl ? "تغيير الصورة" : "اختر صورة من جهازك"}
                  </Button>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    JPG / PNG / WEBP — الحد الأقصى 2MB
                  </p>
                </div>

                <details className="mt-3" open={showUrlField} onToggle={(e) => setShowUrlField((e.target as HTMLDetailsElement).open)}>
                  <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                    رابط متقدّم (URL خارجي)
                  </summary>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                    className="mt-2"
                  />
                </details>
              </div>
            </>
          ) : (
            <>
              <p className="font-bold">{step.title_ar}</p>
              {step.description_ar && (
                <p className="text-sm text-muted-foreground">{step.description_ar}</p>
              )}
              {step.image_url && (
                <img
                  src={step.image_url}
                  alt={step.title_ar}
                  loading="lazy"
                  className="mt-2 h-24 w-auto rounded-lg border border-border object-cover"
                />
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {editing ? (
            <>
              <Button size="sm" onClick={() => saveM.mutate()} disabled={saveM.isPending} className="gap-1">
                <Save className="h-3.5 w-3.5" /> حفظ
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setTitle(step.title_ar); setDesc(step.description_ar ?? ""); setImageUrl(step.image_url ?? ""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={() => setEditing(true)} title="تعديل">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => toggleM.mutate()} title={step.is_active ? "إخفاء" : "إظهار"}>
                {step.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete} className="text-destructive" title="حذف">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddStepDialog({
  open, onOpenChange, device, existing,
}: { open: boolean; onOpenChange: (v: boolean) => void; device: DeviceId; existing: ActivationStep[] }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const nextOrder = (existing[existing.length - 1]?.step_order ?? 0) + 1;

  const m = useMutation({
    mutationFn: () => createStep({
      device_type: device,
      step_order: nextOrder,
      title_ar: title.trim() || `الخطوة ${nextOrder}`,
      description_ar: desc.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success("تمت إضافة الخطوة");
      qc.invalidateQueries({ queryKey: ["admin", "activation-steps"] });
      qc.invalidateQueries({ queryKey: ["activation-steps-public"] });
      onOpenChange(false);
      setTitle(""); setDesc("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة خطوة جديدة — ترتيب {nextOrder}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`الخطوة ${nextOrder}`} />
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="وصف الخطوة" rows={4} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending ? "جارٍ الإضافة…" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteStepDialog({
  target, onCancel,
}: { target: ActivationStep | null; onCancel: () => void }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (id: string) => deleteStep(id),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin", "activation-steps"] });
      qc.invalidateQueries({ queryKey: ["activation-steps-public"] });
      onCancel();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AlertDialog open={!!target} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف الخطوة</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف "{target?.title_ar}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={m.isPending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => target && m.mutate(target.id)}
            disabled={m.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {m.isPending ? "جارٍ الحذف…" : "حذف"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
