import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSAR } from "@/lib/format";
import { formatRelativeArabic } from "@/lib/admin-orders";
import { waLink, type Customer } from "@/lib/admin-customers";

export function CustomerCard({
  customer,
  onOpen,
}: {
  customer: Customer;
  onOpen: (phone: string) => void;
}) {
  const copyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(customer.customer_phone);
    toast.success("تم نسخ الرقم");
  };
  const openWa = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(waLink(customer.customer_phone), "_blank");
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(customer.customer_phone)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(customer.customer_phone);
        }
      }}
      className="w-full cursor-pointer rounded-2xl border border-border bg-card p-4 text-right shadow-sm transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black">{customer.customer_name}</p>
          <p dir="ltr" className="mt-0.5 text-right font-mono text-xs text-muted-foreground">
            {customer.customer_phone}
          </p>
        </div>
        <Badge variant="secondary">{customer.order_count} طلب</Badge>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">إجمالي الإنفاق</span>
        <span className="font-black text-[var(--gold)]">{formatSAR(customer.total_spent)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">آخر طلب</span>
        <span>{formatRelativeArabic(customer.last_order_at)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1" onClick={copyPhone}>
          <Copy className="h-3.5 w-3.5" />
          نسخ
        </Button>
        <Button variant="outline" size="sm" className="gap-1" onClick={openWa}>
          <MessageCircle className="h-3.5 w-3.5" />
          مراسلة
        </Button>
      </div>
    </div>
  );
}
