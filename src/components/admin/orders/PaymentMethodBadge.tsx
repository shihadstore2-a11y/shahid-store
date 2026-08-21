import { CreditCard, MessageCircle, Banknote, Smartphone } from "lucide-react";
import { PAYMENT_LABELS } from "@/lib/admin-orders";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageCircle,
  bank_transfer: Banknote,
  stc_pay: Smartphone,
  cash: Banknote,
};

export function PaymentMethodBadge({ method }: { method: string }) {
  const Icon = ICONS[method] ?? CreditCard;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {PAYMENT_LABELS[method] ?? method}
    </span>
  );
}
