import type { ReactNode } from "react";
import { Lock, ShieldCheck, Clock, MessageCircle } from "lucide-react";

interface TrustBadgeProps {
  icon: ReactNode;
  text: string;
}

function TrustBadge({ icon, text }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-accent" aria-hidden="true">
        {icon}
      </span>
      <span className="text-[11px] font-bold text-muted-foreground">{text}</span>
    </div>
  );
}

export function TrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-accent/20 bg-accent/[0.03] p-2">
      <TrustBadge icon={<Lock className="h-3.5 w-3.5" />} text="دفع آمن SSL" />
      <TrustBadge icon={<ShieldCheck className="h-3.5 w-3.5" />} text="بياناتك محمية" />
      <TrustBadge icon={<Clock className="h-3.5 w-3.5" />} text="تفعيل خلال 10 دقائق" />
      <TrustBadge icon={<MessageCircle className="h-3.5 w-3.5" />} text="دعم 24/7" />
    </div>
  );
}
