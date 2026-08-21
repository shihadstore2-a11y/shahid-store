import { Copy, MessageCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSAR } from "@/lib/format";
import { formatRelativeArabic } from "@/lib/admin-orders";
import { waLink, type Customer } from "@/lib/admin-customers";

export function CustomerRow({
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
    <tr
      className="cursor-pointer border-b border-border transition hover:bg-muted/40"
      onClick={() => onOpen(customer.customer_phone)}
    >
      <td className="px-4 py-3 text-sm font-bold">{customer.customer_name}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span dir="ltr" className="font-mono">{customer.customer_phone}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyPhone} aria-label="نسخ الرقم">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openWa} aria-label="مراسلة">
            <MessageCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <Badge variant="secondary">{customer.order_count} طلب</Badge>
      </td>
      <td className="px-4 py-3 text-sm font-black text-[var(--gold)]">
        {formatSAR(customer.total_spent)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatRelativeArabic(customer.last_order_at)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatRelativeArabic(customer.first_order_at)}
      </td>
      <td className="px-4 py-3 text-left">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(customer.customer_phone);
          }}
        >
          تفاصيل
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
