// شريط الثقة — منصات + طرق دفع. منقول من الهيرو إلى ما بعد أقسام المنتجات.
import { PLATFORMS } from "@/components/icons/PlatformIcons";
import { PAYMENTS } from "@/components/icons/PaymentBadges";
import { HeroTrustChip } from "./HeroTrustChip";

export function TrustStrip() {
  return (
    <section aria-label="منصات مدعومة وطرق دفع آمنة" className="container mx-auto px-4 py-6 md:py-8">
      <div
        className="mx-auto max-w-3xl rounded-2xl border border-accent/20 bg-background/30 p-3 backdrop-blur-md md:p-4 lg:max-w-4xl"
        style={{
          boxShadow:
            "0 8px 30px -12px rgba(0,0,0,0.6), inset 0 1px 0 oklch(0.78 0.16 85 / 0.08)",
        }}
      >
        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-center lg:gap-5">
          {/* صف المنصات */}
          <div className="flex flex-col items-center gap-1.5 lg:flex-1 lg:flex-row lg:items-center lg:gap-3">
            <span className="shrink-0 text-[10px] font-bold tracking-[0.18em] text-accent/70 md:text-[11px]">
              يعمل على
            </span>
            <div className="scrollbar-hide flex w-full items-center justify-center gap-1.5 overflow-x-auto lg:w-auto lg:flex-1 lg:justify-start lg:gap-2">
              {PLATFORMS.map(({ key, label, Icon }) => (
                <HeroTrustChip key={key} label={label} interactive>
                  <Icon size={20} className="text-accent/90" />
                </HeroTrustChip>
              ))}
            </div>
          </div>

          {/* فاصل عمودي ذهبي — lg+ */}
          <div
            aria-hidden
            className="hidden h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent lg:block"
          />

          {/* فاصل أفقي رفيع — mobile/tablet */}
          <div
            aria-hidden
            className="mx-auto h-px w-16 shrink-0 bg-accent/20 lg:hidden"
          />

          {/* صف الدفع */}
          <div className="flex flex-col items-center gap-1.5 lg:flex-1 lg:flex-row-reverse lg:items-center lg:gap-3">
            <span className="shrink-0 text-[10px] font-bold tracking-[0.18em] text-accent/70 md:text-[11px]">
              طرق دفع آمنة
            </span>
            <div className="scrollbar-hide flex w-full items-center justify-center gap-1.5 overflow-x-auto lg:w-auto lg:flex-1 lg:justify-end lg:gap-2">
              {PAYMENTS.map(({ key, Component }) => (
                <Component key={key} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
