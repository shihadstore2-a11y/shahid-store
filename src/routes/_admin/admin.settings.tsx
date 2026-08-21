import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StoreSettingsForm } from "@/components/admin/settings/StoreSettingsForm";
import { AccountInfo } from "@/components/admin/settings/AccountInfo";
import { ChangePasswordForm } from "@/components/admin/settings/ChangePasswordForm";
import { SystemInfo } from "@/components/admin/settings/SystemInfo";
import { signOutEverywhere } from "@/lib/admin-settings";

export const Route = createFileRoute("/_admin/admin/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [tab, setTab] = useState("store");

  const signOutM = useMutation({
    mutationFn: signOutEverywhere,
    onSuccess: () => {
      toast.success("تم تسجيل الخروج من جميع الأجهزة");
      window.location.href = "/admin/login";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">الإعدادات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إدارة معلومات المتجر، الحساب، ومعلومات النظام
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="store">المتجر</TabsTrigger>
          <TabsTrigger value="account">الحساب</TabsTrigger>
          <TabsTrigger value="system">النظام</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-4">
          <StoreSettingsForm />
        </TabsContent>

        <TabsContent value="account" className="mt-4 space-y-6">
          <AccountInfo />
          <ChangePasswordForm />

          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
            <div className="mb-3">
              <h3 className="text-lg font-black text-destructive">منطقة الخطر</h3>
              <p className="text-xs text-muted-foreground">
                هذا الإجراء سيُسجّل خروجك من كل الأجهزة فوراً
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج من جميع الأجهزة
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم إنهاء جلستك على جميع المتصفحات والأجهزة. ستحتاج لتسجيل الدخول مجدداً.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => signOutM.mutate()}
                    disabled={signOutM.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    تأكيد الخروج
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <SystemInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
