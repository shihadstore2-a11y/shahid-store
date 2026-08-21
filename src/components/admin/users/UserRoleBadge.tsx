import { Crown, Eye, Shield, User, Wrench } from "lucide-react";
import type { AdminRole } from "@/lib/admin-users";
import { ROLE_LABEL_AR } from "@/lib/admin-rbac";

const STYLES: Record<AdminRole, { cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  super_admin: { cls: "bg-gold/15 text-gold-foreground border-gold/40", Icon: Crown },
  admin: { cls: "bg-blue-500/15 text-blue-300 border-blue-500/40", Icon: Shield },
  staff: { cls: "bg-muted text-muted-foreground border-border", Icon: User },
  developer: { cls: "bg-purple-500/15 text-purple-300 border-purple-500/40", Icon: Wrench },
  orders_coupons_viewer: { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40", Icon: Eye },
};

export function UserRoleBadge({ role }: { role: AdminRole }) {
  const { cls, Icon } = STYLES[role];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      <Icon className="h-3 w-3" />
      {ROLE_LABEL_AR[role]}
    </span>
  );
}
