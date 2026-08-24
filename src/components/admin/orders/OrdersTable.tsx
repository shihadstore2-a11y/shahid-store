import { Copy, ChevronLeft } from "lucide-react";
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
import { OrderStatusBadge } from "./OrderStatusBadge";
import { PaymentMethodBadge } from "./PaymentMethodBadge";
import { formatSAR } from "@/lib/format";
import { formatRelativeArabic, type AdminOrderRow } from "@/lib/admin-orders";

export function OrdersTable({
  rows,
  onOpen,
}: {
  rows: AdminOrderRow[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">رقم الطلب</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">المبلغ</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">الدفع</TableHead>
            <TableHead className="text-right">التاريخ</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => {
            return (
              <TableRow key={o.id} className="hover:bg-accent/5">
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>{o.order_number}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(o.order_number);
                        toast.success("تم النسخ");
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="نسخ"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold">{o.customer_name}</div>
                </TableCell>
                <TableCell className="font-bold">{formatSAR(o.total)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} fulfilledAt={o.fulfilled_at} />
                </TableCell>
                <TableCell>
                  <PaymentMethodBadge method={o.payment_method} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeArabic(o.created_at)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpen(o.id)}
                    className="gap-1"
                  >
                    تفاصيل
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
