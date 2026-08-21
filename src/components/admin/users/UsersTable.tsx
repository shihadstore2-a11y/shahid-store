import { Pencil, Power, PowerOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminUserRow } from "@/lib/admin-users";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserStatusBadge } from "./UserStatusBadge";

export function UsersTable({
  users,
  currentUserId,
  onEdit,
  onManagePerms,
  onToggle,
}: {
  users: AdminUserRow[];
  currentUserId: string | null;
  onEdit: (u: AdminUserRow) => void;
  onManagePerms: (u: AdminUserRow) => void;
  onToggle: (u: AdminUserRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs">
          <tr className="text-right">
            <th className="px-4 py-3 font-bold">الاسم</th>
            <th className="px-4 py-3 font-bold">الإيميل</th>
            <th className="px-4 py-3 font-bold">الصلاحية</th>
            <th className="px-4 py-3 font-bold">الحالة</th>
            <th className="px-4 py-3 font-bold">الجوال</th>
            <th className="px-4 py-3 text-left font-bold">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isMe = u.user_id === currentUserId;
            return (
              <tr key={u.id} className="border-b border-border/50 last:border-b-0">
                <td className="px-4 py-3 font-bold">
                  {u.full_name || "—"}
                  {isMe && (
                    <span className="ms-2 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                      أنت
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">{u.email}</td>
                <td className="px-4 py-3"><UserRoleBadge role={u.role} /></td>
                <td className="px-4 py-3"><UserStatusBadge active={u.is_active} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(u)}
                      disabled={isMe}
                      title={isMe ? "لا يمكن تعديل حسابك من هنا" : "تعديل"}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onManagePerms(u)}
                      disabled={isMe || u.role === "super_admin"}
                      title={
                        u.role === "super_admin"
                          ? "المشرف العام يملك كل الصلاحيات"
                          : isMe
                            ? "لا يمكن تعديل صلاحيات حسابك"
                            : "الصلاحيات الإضافية"
                      }
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggle(u)}
                      disabled={isMe}
                      title={isMe ? "لا يمكن تعطيل حسابك" : u.is_active ? "تعطيل" : "تفعيل"}
                      className={u.is_active ? "text-destructive hover:text-destructive" : "text-green-400 hover:text-green-300"}
                    >
                      {u.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
