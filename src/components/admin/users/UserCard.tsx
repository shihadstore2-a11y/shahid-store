import { Pencil, Power, PowerOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminUserRow } from "@/lib/admin-users";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserStatusBadge } from "./UserStatusBadge";

export function UserCard({
  user,
  isMe,
  onEdit,
  onManagePerms,
  onToggle,
}: {
  user: AdminUserRow;
  isMe: boolean;
  onEdit: () => void;
  onManagePerms: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">
            {user.full_name || "—"}
            {isMe && (
              <span className="ms-2 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                أنت
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">{user.email}</p>
        </div>
        <UserStatusBadge active={user.is_active} />
      </div>
      <div className="flex items-center gap-2">
        <UserRoleBadge role={user.role} />
        {user.phone && (
          <span className="text-xs text-muted-foreground" dir="ltr">{user.phone}</span>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onEdit} disabled={isMe}>
          <Pencil className="h-3.5 w-3.5" />
          تعديل
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={onManagePerms}
          disabled={isMe || user.role === "super_admin"}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          الصلاحيات
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 gap-1 ${user.is_active ? "text-destructive" : "text-green-400"}`}
          onClick={onToggle}
          disabled={isMe}
        >
          {user.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
          {user.is_active ? "تعطيل" : "تفعيل"}
        </Button>
      </div>
    </div>
  );
}
