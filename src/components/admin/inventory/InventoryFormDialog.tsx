import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  InventoryInput,
  InventoryItem,
  InventoryProvider,
} from "@/lib/admin-inventory";
import { BulkPasteForm } from "./BulkPasteForm";

const EMPTY: InventoryInput = {
  provider: "falcon",
  username: "",
  password: "",
  url: null,
  extra_info: null,
  duration_months: 12,
  device_limit: 1,
  expires_at: null,
  cogs: null,
  notes: null,
};

type Mode = "create" | "edit";

export function InventoryFormDialog({
  mode,
  open,
  onOpenChange,
  initial,
  onSubmit,
  trigger,
}: {
  mode: Mode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: InventoryItem | null;
  onSubmit: (input: InventoryInput, opts: { keepOpen: boolean }) => Promise<void>;
  trigger?: React.ReactNode;
}) {
  const [form, setForm] = useState<InventoryInput>(EMPTY);
  const [dateInput, setDateInput] = useState("");
  const [extraText, setExtraText] = useState("");
  const [extraError, setExtraError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setForm({
        provider: initial.provider,
        username: initial.username,
        password: initial.password,
        url: initial.url,
        extra_info: initial.extra_info,
        duration_months: initial.duration_months,
        device_limit: initial.device_limit ?? 1,
        expires_at: initial.expires_at,
        cogs: initial.cogs,
        notes: initial.notes,
      });
      setDateInput(initial.expires_at ? initial.expires_at.slice(0, 10) : "");
      setExtraText(
        initial.extra_info ? JSON.stringify(initial.extra_info, null, 2) : "",
      );
    } else {
      setForm(EMPTY);
      setDateInput("");
      setExtraText("");
    }
    setExtraError(null);
  }, [open, mode, initial]);

  const codeOk = form.username.trim().length >= 2 && form.password.length >= 4;
  const canSubmit = codeOk && !saving && !extraError;

  const buildInput = (): InventoryInput | null => {
    let extra: InventoryInput["extra_info"] = null;
    if (extraText.trim()) {
      try {
        extra = JSON.parse(extraText) as InventoryInput["extra_info"];
      } catch {
        setExtraError("صيغة JSON غير صحيحة");
        return null;
      }
    }
    setExtraError(null);
    return {
      ...form,
      username: form.username.trim(),
      url: form.url?.trim() ? form.url.trim() : null,
      extra_info: extra,
      expires_at: dateInput ? new Date(dateInput + "T23:59:59").toISOString() : null,
      cogs: form.cogs == null || Number.isNaN(form.cogs) ? null : Number(form.cogs),
      notes: form.notes?.trim() ? form.notes.trim() : null,
    };
  };

  const handleSubmit = async (keepOpen: boolean) => {
    const input = buildInput();
    if (!input) return;
    setSaving(true);
    try {
      await onSubmit(input, { keepOpen });
      if (keepOpen) {
        setForm((f) => ({
          ...EMPTY,
          provider: f.provider,
          duration_months: f.duration_months,
        }));
        setDateInput("");
        setExtraText("");
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === "Enter" && mode === "create" && canSubmit) {
      e.preventDefault();
      void handleSubmit(true);
    } else if (e.key.toLowerCase() === "s" && canSubmit) {
      e.preventDefault();
      void handleSubmit(false);
    }
  };

  const singleForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(false);
      }}
      onKeyDown={onKey}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>المزوّد</Label>
          <Select
            value={form.provider}
            onValueChange={(v) =>
              setForm({ ...form, provider: v as InventoryProvider })
            }
            disabled={mode === "edit"}
          >
            <SelectTrigger className="focus:ring-2 focus:ring-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="falcon">فالكون</SelectItem>
              <SelectItem value="hulk">هولك</SelectItem>
              <SelectItem value="smarters">سمارترز</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>المدة (شهر)</Label>
          <Select
            value={String(form.duration_months)}
            onValueChange={(v) =>
              setForm({ ...form, duration_months: Number(v) })
            }
            disabled={mode === "edit"}
          >
            <SelectTrigger className="focus:ring-2 focus:ring-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">شهر</SelectItem>
              <SelectItem value="3">3 أشهر</SelectItem>
              <SelectItem value="6">6 أشهر</SelectItem>
              <SelectItem value="12">سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>عدد الأجهزة</Label>
        <Select
          value={String(form.device_limit)}
          onValueChange={(v) => setForm({ ...form, device_limit: Number(v) })}
          disabled={mode === "edit"}
        >
          <SelectTrigger className="focus:ring-2 focus:ring-accent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">جهاز واحد</SelectItem>
            <SelectItem value="2">جهازان</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          منتجات «جهازين» (2dev) تُسلَّم من حسابات «جهازان» فقط.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">اسم المستخدم</Label>
        <Input
          id="username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="font-mono focus-visible:ring-accent"
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">كلمة السر</Label>
        <Input
          id="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="font-mono focus-visible:ring-accent"
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="url" className="flex items-center gap-2">
          رابط الخدمة <Badge variant="outline" className="text-[10px]">اختياري</Badge>
        </Label>
        <Input
          id="url"
          value={form.url ?? ""}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="font-mono text-xs focus-visible:ring-accent"
          placeholder="http://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expires" className="flex items-center gap-2">
            تاريخ الانتهاء <Badge variant="outline" className="text-[10px]">اختياري</Badge>
          </Label>
          <Input
            id="expires"
            type="date"
            value={dateInput}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDateInput(e.target.value)}
            className="focus-visible:ring-accent"
          />
          {dateInput && dateInput < new Date().toISOString().split("T")[0] && (
            <p className="text-xs text-destructive">
              تاريخ الانتهاء يجب أن يكون في المستقبل
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cogs" className="flex items-center gap-2">
            التكلفة <Badge variant="outline" className="text-[10px]">اختياري</Badge>
          </Label>
          <div className="relative">
            <Input
              id="cogs"
              type="number"
              min={0}
              step={0.01}
              value={form.cogs ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  cogs: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="pl-12 focus-visible:ring-accent"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ر.س
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="extra" className="flex items-center gap-2">
          معلومات إضافية JSON <Badge variant="outline" className="text-[10px]">اختياري</Badge>
        </Label>
        <Textarea
          id="extra"
          value={extraText}
          onChange={(e) => {
            setExtraText(e.target.value);
            setExtraError(null);
          }}
          placeholder='{"device_limit": 2}'
          className="font-mono text-xs focus-visible:ring-accent"
          rows={3}
        />
        {extraError && <p className="text-xs text-destructive">{extraError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes" className="flex items-center gap-2">
          ملاحظات داخلية <Badge variant="outline" className="text-[10px]">اختياري</Badge>
        </Label>
        <Textarea
          id="notes"
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="focus-visible:ring-accent"
          rows={2}
        />
      </div>

      <DialogFooter className="flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        {mode === "create" && (
          <Button
            type="button"
            variant="secondary"
            disabled={!canSubmit}
            onClick={() => void handleSubmit(true)}
            title="حفظ وأضف آخر (Ctrl+Enter)"
          >
            {saving ? "..." : "حفظ وأضف آخر"}
          </Button>
        )}
        <Button
          type="submit"
          disabled={!canSubmit}
          title={mode === "create" ? "حفظ (Ctrl+S)" : "تحديث (Ctrl+S)"}
        >
          {saving ? "جاري الحفظ..." : mode === "create" ? "حفظ" : "تحديث"}
        </Button>
      </DialogFooter>
    </form>
  );

  const content = (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {mode === "create" ? "إضافة اشتراك للمخزون" : "تعديل اشتراك"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "أضف اشتراكاً واحداً أو الصق دفعة كاملة."
            : "تعديل بيانات اشتراك موجود."}
        </DialogDescription>
      </DialogHeader>

      {mode === "create" ? (
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">إضافة واحد</TabsTrigger>
            <TabsTrigger value="bulk">إضافة مجمَّع 🚀</TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="mt-4">
            <p className="mb-3 rounded-md border border-accent/30 bg-accent/5 px-3 py-1.5 text-[11px] text-muted-foreground">
              💡 Ctrl+Enter للحفظ والإضافة، Ctrl+S للحفظ والإغلاق
            </p>
            {singleForm}
          </TabsContent>
          <TabsContent value="bulk" className="mt-4">
            <BulkPasteForm
              onDone={() => onOpenChange(false)}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      ) : (
        singleForm
      )}
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {content}
    </Dialog>
  );
}

export function CreateInventoryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button className="gap-2" onClick={onClick}>
      <Plus className="h-4 w-4" />
      اشتراك جديد
    </Button>
  );
}

