import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/admin-settings";

const STRONG = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function ChangePasswordForm() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: (next: string) => changePassword(next),
    onSuccess: () => {
      toast.success("تم تغيير كلمة السر بنجاح");
      setPwd("");
      setConfirm("");
      setErr(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!STRONG.test(pwd)) {
      setErr("كلمة السر يجب أن تكون 8 أحرف على الأقل وتشمل رقماً ورمزاً");
      return;
    }
    if (pwd !== confirm) {
      setErr("كلمتا السر غير متطابقتين");
      return;
    }
    setErr(null);
    m.mutate(pwd);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-1">
        <h3 className="text-lg font-black">تغيير كلمة السر</h3>
        <p className="text-xs text-muted-foreground">اختر كلمة سر قوية لحماية حسابك</p>
      </div>
      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-bold">كلمة السر الجديدة</Label>
          <Input
            type="password"
            dir="ltr"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">8 أحرف على الأقل، تشمل رقم ورمز</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold">تأكيد كلمة السر</Label>
          <Input
            type="password"
            dir="ltr"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {err ? <p className="text-xs text-destructive">{err}</p> : null}
        <Button type="submit" disabled={m.isPending || !pwd || !confirm} className="gap-2">
          <KeyRound className="h-4 w-4" />
          {m.isPending ? "جارٍ التغيير…" : "تغيير كلمة السر"}
        </Button>
      </div>
    </form>
  );
}
