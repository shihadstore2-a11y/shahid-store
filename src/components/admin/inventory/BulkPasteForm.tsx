import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bulkInsertInventory,
  checkInventoryDuplicates,
  type BulkInventoryItem,
  type InventoryProvider,
} from "@/lib/admin-inventory";

type ParsedRow = {
  idx: number;
  raw: string;
  username: string;
  password: string;
  url: string | null;
  valid: boolean;
  duplicate: boolean;
  included: boolean;
};

const SEPARATORS: Array<{ re: RegExp; label: string }> = [
  { re: /\s*\|\s*/, label: "|" },
  { re: /\s*\/\s*/, label: "/" },
  { re: /\s*,\s*/, label: "," },
  { re: /\t+/, label: "tab" },
  { re: /\s{2,}/, label: "spaces" },
];

function parseLines(text: string): ParsedRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line, i) => {
      for (const { re } of SEPARATORS) {
        const parts = line.split(re).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          return {
            idx: i,
            raw: line,
            username: parts[0],
            password: parts[1],
            url: parts[2] ?? null,
            valid: parts[0].length >= 2 && parts[1].length >= 4,
            duplicate: false,
            included: true,
          } as ParsedRow;
        }
      }
      return {
        idx: i,
        raw: line,
        username: "",
        password: "",
        url: null,
        valid: false,
        duplicate: false,
        included: false,
      } as ParsedRow;
    });
}

const PLACEHOLDER = `الصق سطراً لكل اشتراك. أمثلة مدعومة:

user1 / password1 / http://host1.com
user2, password2, http://host2.com
user3 | password3 | http://host3.com

الفواصل المدعومة:  /   ,   |   tab   مسافتان فأكثر`;

export function BulkPasteForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<InventoryProvider>("falcon");
  const [duration, setDuration] = useState<number>(12);
  const [deviceLimit, setDeviceLimit] = useState<number>(1);
  const [cogs, setCogs] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  const stats = useMemo(() => {
    const valid = rows.filter((r) => r.valid).length;
    const invalid = rows.filter((r) => !r.valid).length;
    const dup = rows.filter((r) => r.duplicate).length;
    const willSave = rows.filter((r) => r.valid && !r.duplicate && r.included).length;
    return { total: rows.length, valid, invalid, dup, willSave };
  }, [rows]);

  const today = new Date().toISOString().split("T")[0];
  const dateValid = !expiresAt || expiresAt >= today;

  const handleParse = async () => {
    const parsed = parseLines(text);
    if (parsed.length === 0) {
      toast.error("الصق سطراً واحداً على الأقل.");
      return;
    }
    if (parsed.length > 50) {
      toast.error("الحد الأقصى 50 سطر في الدفعة الواحدة.");
      return;
    }
    setRows(parsed);
    setChecking(true);
    try {
      const usernames = parsed.filter((r) => r.valid).map((r) => r.username);
      const dups = await checkInventoryDuplicates(provider, usernames);
      const dupSet = new Set(dups);
      setRows(
        parsed.map((r) => ({
          ...r,
          duplicate: dupSet.has(r.username),
          included: r.valid && !dupSet.has(r.username),
        })),
      );
    } catch (e) {
      toast.error("تعذّر فحص التكرار: " + (e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const toggleRow = (idx: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.idx === idx && r.valid && !r.duplicate
          ? { ...r, included: !r.included }
          : r,
      ),
    );
  };

  const handleSave = async () => {
    if (!dateValid) {
      toast.error("تاريخ الانتهاء يجب أن يكون في المستقبل");
      return;
    }
    const toInsert: BulkInventoryItem[] = rows
      .filter((r) => r.included && r.valid && !r.duplicate)
      .map((r) => ({
        provider,
        username: r.username,
        password: r.password,
        url: r.url,
        duration_months: duration,
        device_limit: deviceLimit,
        expires_at: expiresAt ? new Date(expiresAt + "T23:59:59").toISOString() : null,
        cogs: cogs === "" ? null : Number(cogs),
        cogs_currency: "SAR",
        notes: null,
      }));
    if (toInsert.length === 0) {
      toast.error("لا توجد صفوف صالحة للحفظ.");
      return;
    }
    setSaving(true);
    setProgress({ done: 0, total: toInsert.length });
    try {
      const res = await bulkInsertInventory(toInsert);
      setProgress({ done: res.inserted, total: toInsert.length });
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      if (res.failed === 0) {
        toast.success(`تم حفظ ${res.inserted} اشتراك بنجاح`);
        onDone();
      } else {
        toast.warning(
          `تم حفظ ${res.inserted}، فشل ${res.failed}. أوّل خطأ: ${res.errors[0]?.error ?? "غير محدد"}`,
        );
        if (res.inserted > 0) onDone();
      }
    } catch (e) {
      toast.error("تعذّر الحفظ: " + (e as Error).message);
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">
        <Sparkles className="inline h-3.5 w-3.5 text-accent" /> الحقول المشتركة تُطبَّق
        على جميع الصفوف. الحد الأقصى 50 صفّاً في الدفعة.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>المزوّد</Label>
          <Select
            value={provider}
            onValueChange={(v) => {
              setProvider(v as InventoryProvider);
              setRows([]);
            }}
            disabled={saving}
          >
            <SelectTrigger>
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
            value={String(duration)}
            onValueChange={(v) => setDuration(Number(v))}
            disabled={saving}
          >
            <SelectTrigger>
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
        <Label>عدد الأجهزة (للدفعة كلها)</Label>
        <Select
          value={String(deviceLimit)}
          onValueChange={(v) => setDeviceLimit(Number(v))}
          disabled={saving}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">جهاز واحد</SelectItem>
            <SelectItem value="2">جهازان</SelectItem>
          </SelectContent>
        </Select>
      </div>


      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bulk-cogs" className="flex items-center gap-2">
            التكلفة (SAR) <Badge variant="outline" className="text-[10px]">اختياري</Badge>
          </Label>
          <Input
            id="bulk-cogs"
            type="number"
            min={0}
            step={0.01}
            value={cogs}
            onChange={(e) => setCogs(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bulk-expires" className="flex items-center gap-2">
            تاريخ الانتهاء <Badge variant="outline" className="text-[10px]">اختياري</Badge>
          </Label>
          <Input
            id="bulk-expires"
            type="date"
            value={expiresAt}
            min={today}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={saving}
          />
          {!dateValid && (
            <p className="text-xs text-destructive">يجب أن يكون في المستقبل</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bulk-text">الصق الاشتراكات (سطر لكل واحد)</Label>
        <Textarea
          id="bulk-text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setRows([]);
          }}
          placeholder={PLACEHOLDER}
          className="font-mono text-xs"
          rows={8}
          disabled={saving}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void handleParse()}
            disabled={!text.trim() || checking || saving}
          >
            {checking ? (
              <>
                <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> فحص...
              </>
            ) : (
              "تحليل ومعاينة"
            )}
          </Button>
          {rows.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {rows.length} سطر تم تحليله
            </span>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="ml-1 h-3 w-3" /> صحيح: {stats.valid}
            </Badge>
            {stats.invalid > 0 && (
              <Badge variant="outline" className="border-destructive/40 text-destructive">
                <AlertCircle className="ml-1 h-3 w-3" /> خاطئ: {stats.invalid}
              </Badge>
            )}
            {stats.dup > 0 && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                مكرّر: {stats.dup}
              </Badge>
            )}
            <Badge className="bg-accent text-accent-foreground">
              سيُحفظ: {stats.willSave}
            </Badge>
          </div>

          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 text-right">#</th>
                  <th className="px-2 py-1.5 text-right">اسم المستخدم</th>
                  <th className="px-2 py-1.5 text-right">كلمة السر</th>
                  <th className="px-2 py-1.5 text-right">URL</th>
                  <th className="px-2 py-1.5 text-right">الحالة</th>
                  <th className="px-2 py-1.5 text-center">حفظ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.idx}
                    className={
                      !r.valid
                        ? "bg-destructive/5"
                        : r.duplicate
                          ? "bg-amber-500/5"
                          : ""
                    }
                  >
                    <td className="px-2 py-1.5 text-muted-foreground">{r.idx + 1}</td>
                    <td className="px-2 py-1.5 font-mono">
                      {r.username || <span className="text-destructive">—</span>}
                    </td>
                    <td className="px-2 py-1.5 font-mono">
                      {r.password ? "•".repeat(Math.min(r.password.length, 8)) : "—"}
                    </td>
                    <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-muted-foreground">
                      {r.url ?? "—"}
                    </td>
                    <td className="px-2 py-1.5">
                      {!r.valid ? (
                        <span className="text-destructive">❌ خطأ</span>
                      ) : r.duplicate ? (
                        <span className="text-amber-400">⚠ مكرّر</span>
                      ) : (
                        <span className="text-emerald-400">✅ صحيح</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={r.included}
                        disabled={!r.valid || r.duplicate || saving}
                        onChange={() => toggleRow(r.idx)}
                        aria-label={`تضمين الصف ${r.idx + 1}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>جاري الحفظ...</span>
            <span>
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          إلغاء
        </Button>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || stats.willSave === 0 || !dateValid}
        >
          {saving ? (
            <>
              <Loader2 className="ml-1 h-4 w-4 animate-spin" /> جاري الحفظ...
            </>
          ) : (
            `حفظ ${stats.willSave} اشتراك`
          )}
        </Button>
      </div>
    </div>
  );
}
