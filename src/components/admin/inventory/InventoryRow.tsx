import { Check, Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TableCell, TableRow } from "@/components/ui/table";
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

export function InventoryRow({
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
    <TableRow>
      <TableCell className="font-medium">{PROVIDER_LABEL[item.provider]}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm">{item.username}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => copy(item.username, "اسم المستخدم")}
            aria-label="نسخ اسم المستخدم"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm tabular-nums">
            {reveal ? item.password : "•".repeat(Math.min(item.password.length, 10))}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "إخفاء" : "عرض"}
          >
            {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={copyPwd}
            aria-label="نسخ كلمة السر"
          >
            {copiedPwd ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        {item.url ? (
          <div className="flex max-w-[220px] items-center gap-1">
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
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>{item.duration_months}ش</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={
            item.device_limit >= 2
              ? "border-accent/50 text-accent"
              : "text-muted-foreground"
          }
        >
          {deviceLimitLabel(item.device_limit)}
        </Badge>
      </TableCell>
      <TableCell>
        <InventoryStatusBadge status={item.status} />
      </TableCell>
      <TableCell className={`text-xs ${EXPIRY_TONE_CLS[expiry.tone]}`}>
        {expiry.label}
      </TableCell>
      {canModify && (
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEdit(item)}
              aria-label="تعديل"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {item.status !== "claimed" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(item)}
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
