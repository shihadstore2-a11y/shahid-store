import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminUser } from "@/hooks/useAdminUser";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مشرف عام",
  admin: "مشرف",
  staff: "موظف",
  developer: "مطوّر",
};

export function AccountInfo() {
  const { adminUser, isLoading } = useAdminUser();

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }
  if (!adminUser) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        لم يتم العثور على بيانات الحساب.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-black">معلومات الحساب</h3>
      </div>
      <dl className="space-y-3 text-sm">
        <Row label="الإيميل" value={<span dir="ltr">{adminUser.email}</span>} />
        <Row label="الاسم الكامل" value={adminUser.full_name || "—"} />
        <Row
          label="الصلاحية"
          value={
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">
              {ROLE_LABELS[adminUser.role] ?? adminUser.role}
            </span>
          }
        />
        <Row
          label="آخر تسجيل دخول"
          value={
            adminUser.last_login_at
              ? `${formatDistanceToNow(new Date(adminUser.last_login_at), { addSuffix: true, locale: ar })} (${format(new Date(adminUser.last_login_at), "yyyy-MM-dd HH:mm")})`
              : "—"
          }
        />
        <Row
          label="تاريخ الإنشاء"
          value={format(new Date(adminUser.created_at), "yyyy-MM-dd")}
        />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}
