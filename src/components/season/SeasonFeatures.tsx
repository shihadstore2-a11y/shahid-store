import { Clock, Shield, Wifi, Zap } from "lucide-react";
import { isSeasonActive } from "@/lib/season";

const items = [
  {
    Icon: Zap,
    title: "تفعيل قبل الموسم",
    text: "احصل على اشتراكك جاهزاً قبل بدء أيام الذروة",
  },
  {
    Icon: Wifi,
    title: "استقرار في الذروة",
    text: "سيرفرات قوية تتحمل الضغط في الأوقات الأكثر مشاهدة",
  },
  {
    Icon: Clock,
    title: "دعم 24/7",
    text: "فريق الدعم متاح طوال الموسم لأي استفسار",
  },
  {
    Icon: Shield,
    title: "اشتراك موثوق",
    text: "استبدال خلال 24 ساعة وفق سياسة الاسترجاع",
  },
];

export function SeasonFeatures() {
  if (!isSeasonActive()) return null;
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-black text-foreground sm:text-4xl">
            جهّز اشتراكك للموسم الكبير
          </h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">
            4 أسباب تخليك تختار الباقة السنوية الآن
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]"
            >
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                style={{ background: "var(--gradient-gold)" }}
              >
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
