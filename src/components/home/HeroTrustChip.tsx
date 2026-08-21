// Chip موحّد لشريط الثقة في الهيرو — نفس الـshell لمنصات + شارات دفع
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  label: string;
  className?: string;
  interactive?: boolean;
};

export function HeroTrustChip({ children, label, className = "", interactive = false }: Props) {
  return (
    <span
      dir="ltr"
      title={label}
      aria-label={label}
      className={[
        "inline-flex h-9 min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-white/[0.04] px-2.5 backdrop-blur-sm md:h-10 md:min-w-[56px]",
        interactive ? "transition-colors hover:border-accent/40 hover:bg-accent/[0.08]" : "",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
