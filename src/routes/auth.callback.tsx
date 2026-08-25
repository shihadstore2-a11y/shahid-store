import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (s: Record<string, unknown>) => ({
    return_to: typeof s.return_to === "string" ? s.return_to : "",
    redirect_to: typeof s.redirect_to === "string" ? s.redirect_to : "",
  }),
  head: () => ({
    meta: [
      { title: "جاري التحقق والمتابعة... — شاهد ستور" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState("جاري التحقق من أمان الرابط والتوجيه لمتجرك...");

  useEffect(() => {
    const rawTarget = search.return_to || search.redirect_to || "";
    const hash = window.location.hash || "";

    // 1. إذا كان الهدف متجراً فرعياً أو نطاقاً مخصصاً، ننقل الـ Hash فوراً إلى المتجر المطلوب
    if (rawTarget) {
      try {
        const parsedTarget = new URL(rawTarget);
        // نضمن نقل معلمات الجلسة والتوكن كاملة في الرابط الهدف
        const finalUrl = `${parsedTarget.origin}${parsedTarget.pathname}${parsedTarget.search}${hash}`;
        setStatusMessage("جاري إعادتك لمتجرك...");
        window.location.replace(finalUrl);
        return;
      } catch (e) {
        console.warn("[AuthCallback] Invalid return_to URL:", rawTarget, e);
      }
    }

    // 2. إذا كان الطلب على المنصة الرئيسية نفسها
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (hash.includes("type=recovery")) {
            navigate({ to: "/reset-password", replace: true });
          } else {
            navigate({ to: "/account", replace: true });
          }
          return;
        }
      } catch (err) {
        console.error("[AuthCallback] session error:", err);
      }

      // توجيه افتراضي لصفحة إعادة التعيين أو الحساب
      if (hash.includes("type=recovery")) {
        navigate({ to: "/reset-password", replace: true });
      } else {
        navigate({ to: "/account", replace: true });
      }
    })();
  }, [search.return_to, search.redirect_to, navigate]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
      <h2 className="text-lg font-black">{statusMessage}</h2>
      <p className="mt-2 text-xs text-muted-foreground">لن يستغرق الأمر سوى لحظات قليلة...</p>
    </div>
  );
}
