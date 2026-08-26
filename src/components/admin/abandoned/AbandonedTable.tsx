import { useState } from "react";
import {
  Copy,
  MessageCircle,
  Trash2,
  Package,
  CheckSquare,
  Square,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatSAR } from "@/lib/format";
import { formatRelativeArabic } from "@/lib/admin-orders";
import type { AbandonedOrderRow } from "@/lib/admin-abandoned-orders";
import { durationLabel } from "@/lib/order";

export function AbandonedTable({
  rows,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenWhatsapp,
  onDeleteOne,
  isDeleting,
}: {
  rows: AbandonedOrderRow[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onOpenWhatsapp: (order: AbandonedOrderRow) => void;
  onDeleteOne: (order: AbandonedOrderRow) => void;
  isDeleting?: boolean;
}) {
  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const someSelected =
    rows.some((r) => selectedIds.includes(r.id)) && !allSelected;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-10 text-center">
              <button
                type="button"
                onClick={() => onSelectAll(!allSelected)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="تحديد الكل"
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : someSelected ? (
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </TableHead>
            <TableHead className="text-right">رقم السلة</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">المنتج</TableHead>
            <TableHead className="text-right">المبلغ</TableHead>
            <TableHead className="text-right">وقت الترك</TableHead>
            <TableHead className="text-right">حالة المراسلة</TableHead>
            <TableHead className="text-center">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => {
            const isSelected = selectedIds.includes(o.id);
            const firstItem = o.items?.[0];
            const productName =
              firstItem?.product_name ??
              firstItem?.name_ar ??
              firstItem?.name ??
              "اشتراك";
            const dur =
              firstItem?.duration_label ??
              (firstItem?.duration_months
                ? durationLabel(firstItem.duration_months)
                : "");

            const messages = o.whatsapp_messages_sent ?? [];
            const hasMessages = messages.length > 0;
            const lastMsg = hasMessages
              ? messages[messages.length - 1]
              : null;

            return (
              <TableRow
                key={o.id}
                className={
                  isSelected
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-accent/5"
                }
              >
                {/* Checkbox */}
                <TableCell className="text-center">
                  <button
                    type="button"
                    onClick={() => onToggleSelect(o.id)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`تحديد ${o.order_number}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableCell>

                {/* رقم الطلب */}
                <TableCell className="font-mono text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span>{o.order_number}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(o.order_number);
                        toast.success("تم نسخ رقم الطلب");
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="نسخ"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </TableCell>

                {/* العميل */}
                <TableCell>
                  <div className="font-bold text-sm text-foreground">
                    {o.customer_name || "—"}
                  </div>
                  <div
                    dir="ltr"
                    className="text-right text-xs font-mono text-muted-foreground"
                  >
                    {o.customer_phone}
                  </div>
                </TableCell>

                {/* المنتج */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">
                        {productName}
                      </p>
                      {dur && (
                        <p className="text-[11px] text-muted-foreground">
                          {dur}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* المبلغ */}
                <TableCell className="font-black text-primary text-sm">
                  {formatSAR(o.total)}
                </TableCell>

                {/* وقت الترك */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500/70 shrink-0" />
                    <span>{formatRelativeArabic(o.created_at)}</span>
                  </div>
                </TableCell>

                {/* حالة المراسلة */}
                <TableCell>
                  {hasMessages ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                      💬 تم الإرسال ({messages.length})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                      لم يُراسل بعد
                    </span>
                  )}
                </TableCell>

                {/* إجراءات */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => onOpenWhatsapp(o)}
                      className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5"
                      title="استعادة عبر واتساب"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>مراسلة</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isDeleting}
                      onClick={() => onDeleteOne(o)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="حذف هذه السلة"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
