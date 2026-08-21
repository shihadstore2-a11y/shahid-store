import { useState, type ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Ambient gold glow — لمسة فخامة لا تكسر اللون الموحَّد */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 90% 0%, oklch(0.78 0.16 85 / 0.05) 0%, transparent 60%), radial-gradient(50% 40% at 10% 100%, oklch(0.78 0.16 85 / 0.035) 0%, transparent 65%)",
        }}
      />

      {/* Sidebar — desktop */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Sidebar — mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="إغلاق"
          />
          <div className="absolute right-0 top-0 h-full animate-in slide-in-from-right duration-300">
            <AdminSidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onOpenSidebar={() => setOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
