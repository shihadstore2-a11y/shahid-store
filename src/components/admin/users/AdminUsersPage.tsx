import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RequireRole } from "@/components/admin/RequireRole";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { UserCard } from "@/components/admin/users/UserCard";
import { UserStatsStrip } from "@/components/admin/users/UserStatsStrip";
import { CreateAdminDialog } from "@/components/admin/users/CreateAdminDialog";
import { EditAdminDialog } from "@/components/admin/users/EditAdminDialog";
import { DeactivateAdminDialog } from "@/components/admin/users/DeactivateAdminDialog";
import { DeleteAdminDialog } from "@/components/admin/users/DeleteAdminDialog";
import { ManagePermissionsDialog } from "@/components/admin/users/ManagePermissionsDialog";
import {
  adminUsersQueryOptions,
  setAdminActive,
  deleteAdminUser,
  type AdminUserRow,
} from "@/lib/admin-users";
import { useAdminUser } from "@/hooks/useAdminUser";

export function AdminUsersContent() {
  const qc = useQueryClient();
  const { adminUser: me } = useAdminUser();
  const { data: users = [], isLoading } = useQuery(adminUsersQueryOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [permsTarget, setPermsTarget] = useState<AdminUserRow | null>(null);

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAdminActive(id, isActive),
    onSuccess: async (_, vars) => {
      toast.success(vars.isActive ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeactivateTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAdmin = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: async () => {
      toast.success("تم حذف المستخدم من الإدارة وإعادته كعميل بنجاح");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message || "فشل حذف المستخدم"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">إدارة المستخدمين</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إنشاء وتعديل وتعطيل وحذف حسابات المشرفين
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">إضافة مشرف</span>
        </Button>
      </div>

      <UserStatsStrip users={users} />

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          جارٍ التحميل…
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <UsersIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">لا يوجد مشرفون بعد</p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <UsersTable
              users={users}
              currentUserId={me?.user_id ?? null}
              onEdit={setEditTarget}
              onManagePerms={setPermsTarget}
              onToggle={(u) => {
                if (u.is_active) setDeactivateTarget(u);
                else toggleActive.mutate({ id: u.id, isActive: true });
              }}
              onDelete={setDeleteTarget}
            />
          </div>
          <div className="grid gap-3 lg:hidden">
            {users.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                isMe={me?.user_id === u.user_id}
                onEdit={() => setEditTarget(u)}
                onManagePerms={() => setPermsTarget(u)}
                onToggle={() => {
                  if (u.is_active) setDeactivateTarget(u);
                  else toggleActive.mutate({ id: u.id, isActive: true });
                }}
                onDelete={() => setDeleteTarget(u)}
              />
            ))}
          </div>
        </>
      )}

      <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditAdminDialog
        user={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeactivateAdminDialog
        user={deactivateTarget}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) {
            toggleActive.mutate({ id: deactivateTarget.id, isActive: false });
          }
        }}
        pending={toggleActive.isPending}
      />
      <DeleteAdminDialog
        user={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            removeAdmin.mutate(deleteTarget.id);
          }
        }}
        pending={removeAdmin.isPending}
      />
      <ManagePermissionsDialog user={permsTarget} onClose={() => setPermsTarget(null)} />
    </div>
  );
}

export function AdminUsersPage() {
  return (
    <RequireRole roles={["super_admin"]}>
      <AdminUsersContent />
    </RequireRole>
  );
}
