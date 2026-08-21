import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createAdminUser, generateTempPassword, type AdminRole,
} from "@/lib/admin-users";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

const ROLE_OPTIONS: { value: AdminRole; label: string; desc: string }[] = [
  { value: "orders_coupons_viewer", label: "مشاهد طلبات وكوبونات", desc: "عرض الطلبات والكوبونات فقط — بدون أي تعديل" },
  { value: "staff", label: "موظف (Staff)", desc: "الطلبات + العملاء + التقارير فقط" },
  { value: "admin", label: "مدير (Admin)", desc: "كل شيء عدا إدارة المستخدمين والإعدادات" },
  { value: "developer", label: "مطوّر (Developer)", desc: "كل شيء + الإعدادات (للـ debugging)" },
  { value: "super_admin", label: "مشرف عام (Super Admin)", desc: "كل الصلاحيات بما فيها إدارة المستخدمين" },
];

export function CreateAdminDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");
  const [password, setPassword] = useState(() => generateTempPassword());
  const [showPwd, setShowPwd] = useState(false);

  const reset = () => {
    setEmail(""); setFullName(""); setPhone("");
    setRole("staff"); setPassword(generateTempPassword()); setShowPwd(false);
  };

  const m = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async () => {
      toast.success("تم إنشاء المستخدم بنجاح");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      onOpenChange(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyPwd = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("تم نسخ كلمة السر");
    } catch {
      toast.error("فشل النسخ");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !password) {
      toast.error("اكمل الحقول المطلوبة");
      return;
    }
    m.mutate({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة مشرف جديد</DialogTitle>
          <DialogDescription>
            سيُنشأ حساب جديد بكلمة سر مؤقتة. شارك التفاصيل مع المستخدم.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">الإيميل *</Label>
            <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold">الاسم الكامل *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold">الجوال (اختياري)</Label>
            <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold">الصلاحية *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <div className="flex flex-col items-start py-1">
                      <span className="font-bold">{o.label}</span>
                      <span className="text-[11px] text-muted-foreground">{o.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold">كلمة السر المؤقتة *</Label>
            <div className="flex gap-1.5">
              <Input
                dir="ltr"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono"
                required
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowPwd(!showPwd)} title="إظهار/إخفاء">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={copyPwd} title="نسخ">
                <Copy className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generateTempPassword())} title="توليد جديد">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="rounded-md border border-gold/40 bg-gold/10 px-2 py-1.5 text-[11px] text-gold-foreground">
              ⚠️ احفظ هذه الكلمة وشاركها مع المستخدم — لن تُعرض مرة أخرى بعد الإنشاء.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "جارٍ الإنشاء…" : "إنشاء المستخدم"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
