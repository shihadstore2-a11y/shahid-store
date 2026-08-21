import { Zap, Clapperboard, Headphones } from "lucide-react";

const items = [
  { Icon: Zap, label: "تفعيل سريع" },
  { Icon: Clapperboard, label: "جودة 4K حقيقية" },
  { Icon: Headphones, label: "دعم فني متواصل" },
];

/**
 * ValueBridge — شريط قيمة قصير يربط الهيرو بأقسام المنتجات.
 * بدون CTA، بدون أرقام، بدون نصوص محظورة.
 */
export function ValueBridge() {
  return (
    <section
      aria-label="مزايا شاهد ستور"
      className="border-y border-accent/15 bg-card/50 py-5 backdrop-blur-sm md:py-7"
    >
      <div className="container mx-auto max-w-5xl px-4">
        <ul className="flex items-stretch justify-between gap-2 md:justify-center md:gap-10">
          {items.map(({ Icon, label }) => (
            <li
              key={label}
              className="flex flex-1 items-center justify-center gap-2 text-center md:flex-none md:gap-3"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/30 text-accent md:h-10 md:w-10"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.16 85 / 0.12), oklch(0.78 0.16 85 / 0.04))",
                }}
                aria-hidden
              >
                <Icon className="h-4 w-4 md:h-5 md:w-5" />
              </span>
              <span className="text-[12px] font-bold leading-tight text-foreground md:text-sm">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
