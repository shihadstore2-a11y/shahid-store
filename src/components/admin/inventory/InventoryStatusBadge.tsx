import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type InventoryStatus } from "@/lib/admin-inventory";

const TONE: Record<InventoryStatus, string> = {
  available: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-300",
  reserved: "bg-blue-500/15 text-blue-700 border-blue-500/40 dark:text-blue-300",
  claimed: "bg-muted text-muted-foreground border-border",
  expired: "bg-destructive/15 text-destructive border-destructive/40",
};

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  return (
    <Badge variant="outline" className={TONE[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
