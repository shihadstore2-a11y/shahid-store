import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, KeyRound, LogOut } from "lucide-react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/profile")({
  head: () => ({
    meta: [
      { title: "ملفي الشخصي — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { adminUser } = useAdminUser();
  const [fullName, setFullName] = useState(adminUser?.full_name ?? "");
  const [phone, setPhone] = useState(adminUser?.phone ?? "");
  const [pwd, setPwd] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const saveProfile = async () => {
    if (!adminUser) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("admin_users")
      .update({ full_name: fullName, phone })
      .eq("id", adminUser.id);
    setSavingProfile(false);
    if (error) toast.error("تعذّر الحفظ");
    else toast.success("تم حفظ التعديلات");
  };

  const changePwd = async () => {
    if (pwd.length < 8) {
      toast.error("كلمة المرور الجديدة قصيرة (8 أحرف على الأقل)");
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);
    if (error) toast.error("تعذّر تغيير كلمة المرور");
    else {
      toast.success("تم تغيير كلمة المرور");
      setPwd("");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black">المعلومات الشخصية</h2>
        </div>

        <div className="space-y-3 text-sm">
          <Field label="البريد الإلكتروني">
            <input
              value={adminUser?.email ?? ""}
              disabled
              dir="ltr"
              className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-right opacity-70"
            />
          </Field>
          <Field label="الاسم الكامل">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2"
            />
          </Field>
          <Field label="رقم الجوال">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-right"
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            آخر دخول:{" "}
            {adminUser?.last_login_at
              ? new Date(adminUser.last_login_at).toLocaleString("ar-SA")
              : "—"}
          </p>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {savingProfile ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black">تغيير كلمة المرور</h2>
        </div>
        <div className="space-y-3">
          <Field label="كلمة المرور الجديدة">
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              dir="ltr"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-right"
            />
          </Field>
          <button
            onClick={changePwd}
            disabled={savingPwd}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {savingPwd ? "جارٍ الحفظ..." : "تحديث كلمة المرور"}
          </button>
        </div>
      </div>

      <button
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-black text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        تسجيل الخروج
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold">{label}</label>
      {children}
    </div>
  );
}
