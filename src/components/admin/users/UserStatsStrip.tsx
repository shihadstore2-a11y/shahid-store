import { Users, UserCheck, UserX, Crown } from "lucide-react";
import type { AdminUserRow } from "@/lib/admin-users";

export function UserStatsStrip({ users }: { users: AdminUserRow[] }) {
  const total = users.length;
  const active = users.filter((u) => u.is_active).length;
  const inactive = total - active;
  const supers = users.filter((u) => u.role === "super_admin" && u.is_active).length;

  const items = [
    { label: "إجمالي", value: total, Icon: Users, color: "text-foreground" },
    { label: "نشط", value: active, Icon: UserCheck, color: "text-green-400" },
    { label: "معطّل", value: inactive, Icon: UserX, color: "text-destructive" },
    { label: "مشرفون عامون", value: supers, Icon: Crown, color: "text-gold-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className={`rounded-lg bg-muted/40 p-2 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-black">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
