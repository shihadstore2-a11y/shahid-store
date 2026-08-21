import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { LiveActivityToast } from "./social-proof/LiveActivityToast";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // صفحات تحتوي شريط CTA سفلي ثابت على الموبايل (PDP) — نرفع زر الواتساب فوقه
  const hasStickyCta = pathname.startsWith("/product/");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat liftAboveSticky={hasStickyCta} />
      <LiveActivityToast />
    </div>
  );
}
