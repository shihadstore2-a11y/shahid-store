import { Check, Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InventoryStatusBadge } from "./InventoryStatusBadge";
import {
  deviceLimitLabel,
  getExpiryTone,
  PROVIDER_LABEL,
  type InventoryItem,
} from "@/lib/admin-inventory";

const EXPIRY_TONE_CLS: Record<string, string> = {
  none: "text-muted-foreground",
  green: "text-emerald-600",
  yellow: "text-amber-600",
  red: "text-destructive",
};

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`نُسخ ${label}`);
  } catch {
    toast.error("تعذّر النسخ");
  }
}

export function InventoryCard({
  item,
  onEdit,
  onDelete,
  canModify,
}: {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  canModify: boolean;
}) {
  const [reveal, setReveal] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const expiry = getExpiryTone(item.expires_at);

  const copyPwd = async () => {
    await copy(item.password, "كلمة السر");
    setCopiedPwd(true);
    setTimeout(() => setCopiedPwd(false), 1500);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{PROVIDER_LABEL[item.provider]}</div>
          <div className="font-mono text-sm font-bold">{item.username}</div>
          <Badge
            variant="outline"
            className={`mt-1 ${item.device_limit >= 2 ? "border-accent/50 text-accent" : "text-muted-foreground"}`}
          >
            {deviceLimitLabel(item.device_limit)}
          </Badge>
        </div>
        <InventoryStatusBadge status={item.status} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
          <span className="font-mono tabular-nums text-xs">
            {reveal ? item.password : "•".repeat(Math.min(item.password.length, 10))}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={copyPwd}
              aria-label="نسخ كلمة المرور"
            >
              {copiedPwd ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">المدة</div>
            <div className="font-semibold">{item.duration_months} شهر</div>
          </div>
          <div>
            <div className="text-muted-foreground">الانتهاء</div>
            <div className={`font-semibold ${EXPIRY_TONE_CLS[expiry.tone]}`}>{expiry.label}</div>
          </div>
        </div>

        {item.url && (
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1.5">
            <span className="truncate font-mono text-xs text-muted-foreground">{item.url}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => copy(item.url!, "الرابط")}
              aria-label="نسخ الرابط"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {canModify && (
        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button size="sm" variant="outline" onClick={() => onEdit(item)} className="gap-1">
            <Pencil className="h-3.5 w-3.5" />
            تعديل
          </Button>
          {item.status !== "claimed" && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
