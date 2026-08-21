import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function AdminPlaceholder({
  title,
  Icon,
  phase,
}: {
  title: string;
  Icon: LucideIcon;
  phase?: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-primary">
          <Icon className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          قيد التطوير — ستتوفر في {phase ?? "المرحلة القادمة"}
        </p>
        <Link
          to="/admin/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          العودة للوحة التحكم
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
