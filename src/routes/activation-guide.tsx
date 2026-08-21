import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Apple,
  Cast,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Laptop2,
  LifeBuoy,
  MessageCircle,
  Monitor,
  ShieldCheck,
  Smartphone,
  Tv,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { publicActivationStepsQueryOptions } from "@/lib/admin-activation";

type Tab = "ios" | "android" | "samsung-tv" | "lg-tv" | "windows" | "mac";

const TABS: {
  id: Tab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  seoLabel: string;
}[] = [
  { id: "android", label: "أندرويد / شاومي", shortLabel: "أندرويد", icon: <Smartphone className="h-4 w-4" />, seoLabel: "الأندرويد وشاومي" },
  { id: "ios", label: "آيفون / آيباد", shortLabel: "آيفون", icon: <Apple className="h-4 w-4" />, seoLabel: "آيفون وآيباد" },
  { id: "samsung-tv", label: "Samsung TV", shortLabel: "سامسونج", icon: <Tv className="h-4 w-4" />, seoLabel: "شاشات سامسونج" },
  { id: "lg-tv", label: "LG TV", shortLabel: "LG", icon: <Cast className="h-4 w-4" />, seoLabel: "شاشات LG" },
  { id: "windows", label: "ويندوز", shortLabel: "ويندوز", icon: <Monitor className="h-4 w-4" />, seoLabel: "الكمبيوتر بنظام ويندوز" },
  { id: "mac", label: "ماك", shortLabel: "ماك", icon: <Laptop2 className="h-4 w-4" />, seoLabel: "أجهزة ماك" },
];

type StepView = { title?: string; description: string; image?: string | null };

const FALLBACK_STEPS: Record<Tab, StepView[]> = {
  ios: [
    { title: "استلم بيانات اشتراكك", description: "بعد إتمام طلبك من شاهد ستور، تصلك بيانات التفعيل عبر البريد الإلكتروني والواتساب خلال دقائق." },
    { title: "افتح App Store على جهازك", description: "ابحث عن تطبيق المشغّل الذي يصلك ضمن بيانات اشتراكك." },
    { title: "ثبّت تطبيق المشغّل", description: "اضغط Get وانتظر التثبيت ثم افتح التطبيق." },
    { title: "سجّل دخولك بالبيانات", description: "أدخل اسم المستخدم وكلمة المرور ورمز الخادم ثم اضغط تسجيل الدخول." },
    { title: "ابدأ المشاهدة", description: "تظهر مكتبتك الكاملة جاهزة للمشاهدة بجودة عالية." },
  ],
  android: [
    { title: "استلم بيانات اشتراكك", description: "تصلك بيانات الدخول ورابط التحميل عبر البريد الإلكتروني والواتساب فور إتمام الطلب." },
    { title: "افتح متجر التطبيقات", description: "ثبّت تطبيق Downloader من Google Play أو Mi Store على جهازك." },
    { title: "ثبّت تطبيق المشغّل عبر Downloader", description: "افتح Downloader وأدخل الكود المرسل لك ثم اضغط GO ليبدأ تنزيل التطبيق." },
    { title: "سجّل دخولك بالبيانات", description: "افتح المشغّل وأدخل اسم المستخدم وكلمة المرور ورمز الخادم المرسلين لك." },
    { title: "ابدأ المشاهدة", description: "تظهر مكتبتك جاهزة بكامل الأقسام والقنوات." },
  ],
  "samsung-tv": [
    { title: "استلم بيانات اشتراكك", description: "تصلك تعليمات التفعيل المخصصة لشاشات سامسونج." },
    { title: "افتح Samsung Apps", description: "ابحث عن تطبيق المشغّل المرسل لك وثبّته." },
    { title: "افتح التطبيق", description: "افتح التطبيق من قائمة تطبيقاتك على الشاشة." },
    { title: "أرسل بيانات الجهاز للدعم", description: "صوّر شاشة Device ID + Device Key وأرسلها على الواتساب." },
    { title: "يُفعَّل اشتراكك تلقائياً", description: "نربط اشتراكك خلال دقائق دون أي إعدادات منك." },
  ],
  "lg-tv": [
    { title: "استلم بيانات اشتراكك", description: "تصلك تعليمات التفعيل المخصصة لشاشات LG." },
    { title: "افتح LG Content Store", description: "ابحث عن تطبيق المشغّل المرسل لك وثبّته." },
    { title: "افتح التطبيق", description: "افتح التطبيق من قائمة تطبيقاتك على الشاشة." },
    { title: "أرسل بيانات الجهاز للدعم", description: "صوّر شاشة Device ID + Device Key وأرسلها على الواتساب." },
    { title: "يُفعَّل اشتراكك تلقائياً", description: "نربط اشتراكك خلال دقائق دون أي إعدادات منك." },
  ],
  windows: [
    { title: "استلم بيانات اشتراكك", description: "تصلك البيانات ورابط التحميل عبر البريد والواتساب." },
    { title: "حمّل المشغّل", description: "افتح الرابط المرسل لك وحمّل ملف التثبيت." },
    { title: "ثبّت البرنامج وافتحه", description: "اتبع خطوات المُثبِّت حتى تظهر شاشة المشغّل." },
    { title: "سجّل دخولك بالبيانات", description: "أدخل اسم المستخدم وكلمة المرور." },
    { title: "ابدأ المشاهدة", description: "تظهر مكتبتك الكاملة جاهزة." },
  ],
  mac: [
    { title: "استلم بيانات اشتراكك", description: "تصلك البيانات ورابط التحميل عبر البريد والواتساب." },
    { title: "حمّل المشغّل المتوافق مع macOS", description: "حمّل ملف dmg من الرابط المرسل لك." },
    { title: "اسحب التطبيق إلى Applications", description: "افتح dmg واسحب التطبيق إلى مجلد Applications." },
    { title: "سجّل دخولك بالبيانات", description: "أدخل اسم المستخدم وكلمة المرور." },
    { title: "ابدأ المشاهدة", description: "تظهر مكتبتك الكاملة جاهزة." },
  ],
};

// المنصّات التي توجد لها صور خطوات محلية في public/activation/{tab}/step-{n}.jpg
const TABS_WITH_LOCAL_IMAGES: Tab[] = ["android", "ios", "samsung-tv"];

const VALID_TABS = TABS.map((t) => t.id) as readonly string[];

export const Route = createFileRoute("/activation-guide")({
  head: () => ({
    meta: [
      { title: "طريقة تفعيل اشتراكك — شاهد ستور" },
      {
        name: "description",
        content:
          "دليل تفعيل اشتراك شاهد ستور خطوة بخطوة بالصور — أندرويد، شاومي، آيفون، شاشات سامسونج وLG، ويندوز، وماك. أقل من 5 دقائق.",
      },
      { property: "og:title", content: "طريقة تفعيل اشتراك IPTV — شاهد ستور" },
      {
        property: "og:description",
        content:
          "دليل تفعيل اشتراك شاهد ستور خطوة بخطوة بالصور لكل جهاز: أندرويد، آيفون، سامسونج، LG، ويندوز، وماك.",
      },
      { property: "og:url", content: "https://shahidstore.net/activation-guide" },
    ],
    links: [
      { rel: "canonical", href: "https://shahidstore.net/activation-guide" },
    ],
  }),
  component: ActivationGuide,
});

function ActivationGuide() {
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("android");
  const { data: dbSteps } = useQuery(publicActivationStepsQueryOptions());
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = location.hash?.replace(/^#/, "");
    if (hash && VALID_TABS.includes(hash)) {
      setTab(hash as Tab);
    }
  }, [location.hash]);

  const stepsForTab = useMemo<StepView[]>(() => {
    const fromDb = (dbSteps ?? [])
      .filter((s) => s.device_type === tab)
      .map((s) => ({
        title: s.title_ar,
        description: s.description_ar || "",
        image: (s as unknown as { image_url?: string | null }).image_url ?? null,
      }));
    const base = fromDb.length > 0 ? fromDb : FALLBACK_STEPS[tab];

    // Auto-attach local images when DB has no image
    return base.map((s, i) => ({
      ...s,
      image: s.image || (TABS_WITH_LOCAL_IMAGES.includes(tab) ? `/activation/${tab}/step-${i + 1}.jpg` : null),
    }));
  }, [dbSteps, tab]);

  const currentTab = TABS.find((t) => t.id === tab)!;

  const howToJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `طريقة تفعيل اشتراك شاهد ستور على ${currentTab.seoLabel}`,
      description: `دليل تفعيل خطوة بخطوة على ${currentTab.seoLabel} مع صور توضيحية`,
      totalTime: "PT5M",
      step: stepsForTab.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title ?? `الخطوة ${i + 1}`,
        text: s.description,
        ...(s.image ? { image: s.image } : {}),
      })),
    };
  }, [currentTab, stepsForTab]);

  const handleTabChange = (next: Tab) => {
    setTab(next);
    requestAnimationFrame(() => {
      stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openWhatsapp = () => {
    const wa = document.querySelector<HTMLAnchorElement>('a[aria-label="WhatsApp"]');
    if (wa) wa.click();
  };

  return (
    <SiteLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--accent) 10%, transparent) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 text-xs font-bold text-accent">
            <CheckCircle2 className="h-3.5 w-3.5" />
            دليل مبسّط بالصور · 5 خطوات فقط
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">
            طريقة تفعيل اشتراكك
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base leading-relaxed">
            اختر جهازك من القائمة بالأسفل، ثم اتبع الخطوات الخمس بالتسلسل.
            معظم المستخدمين ينهون التفعيل في أقل من 5 دقائق.
          </p>

          {/* Trust chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-bold text-foreground/90">
              <Clock3 className="h-3.5 w-3.5 text-accent" /> أقل من 5 دقائق
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-bold text-foreground/90">
              <ImageIcon className="h-3.5 w-3.5 text-accent" /> صور توضيحية
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-bold text-foreground/90">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> دعم مباشر
            </span>
          </div>
        </div>
      </section>

      {/* ============ Sticky tab bar ============ */}
      <div
        className="sticky top-16 z-30 border-b border-border/40 bg-background/85 backdrop-blur-md"
        ref={stepsRef}
      >
        <div className="mx-auto max-w-5xl px-3 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                    active
                      ? "border-accent bg-accent text-accent-foreground shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
                      : "border-border bg-card text-foreground hover:border-accent/50"
                  }`}
                  aria-pressed={active}
                >
                  {t.icon}
                  <span className="sm:hidden">{t.shortLabel}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ Steps timeline ============ */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="min-w-0 flex-1 text-base font-black leading-tight sm:text-2xl">
            خطوات التفعيل على {currentTab.label}
          </h2>
          <span className="shrink-0 rounded-full bg-card border border-border px-3 py-1 text-xs font-bold text-muted-foreground">
            {stepsForTab.length} خطوات
          </span>
        </div>

        <ol className="relative space-y-5 sm:space-y-7">
          {/* connector line (desktop only) */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-[19px] top-2 bottom-2 hidden w-px bg-gradient-to-b from-accent/60 via-border to-accent/20 sm:block"
          />

          {stepsForTab.map((s, i) => (
            <li key={`${tab}-${i}`} className="relative">
              <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:border-accent/40 hover:shadow-md">
                <div className="grid gap-0 md:grid-cols-[1fr_minmax(0,1.1fr)]">
                  {/* Text block */}
                  <div className="flex gap-4 p-5 sm:p-6">
                    <div className="flex flex-col items-center">
                      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/80 text-base font-black text-accent-foreground shadow-[0_4px_12px_-2px_color-mix(in_oklab,var(--accent)_45%,transparent)] ring-2 ring-background sm:h-11 sm:w-11">
                        {i + 1}
                      </span>
                      <span className="mt-2 text-[10px] font-bold tracking-wider text-muted-foreground">
                        {i + 1}/{stepsForTab.length}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {s.title ? (
                        <h3 className="text-base font-black leading-tight text-foreground sm:text-lg md:text-xl">
                          {s.title}
                        </h3>
                      ) : null}
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                        {s.description}
                      </p>
                    </div>
                  </div>

                  {/* Image block */}
                  {s.image ? (
                    <div className="relative border-t border-border/50 bg-black/40 md:border-t-0 md:border-r md:border-border/50">
                      <img
                        src={s.image}
                        alt={s.title ?? `الخطوة ${i + 1} — ${currentTab.label}`}
                        loading={i < 2 ? "eager" : "lazy"}
                        decoding="async"
                        width={1280}
                        height={720}
                        className="aspect-[16/10] h-full w-full object-cover md:aspect-auto"
                      />
                    </div>
                  ) : (
                    <div className="hidden md:flex items-center justify-center border-r border-border/50 bg-muted/30 p-8 text-center text-xs text-muted-foreground">
                      <div>
                        <ImageIcon className="mx-auto mb-2 h-6 w-6 opacity-50" />
                        صورة توضيحية قريباً
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ol>

        {/* ============ Final CTA ============ */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/10 via-card to-card p-6 text-center sm:p-8">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-black sm:text-2xl">واجهت أي مشكلة في التفعيل؟</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
            فريق الدعم متاح يومياً للرد على استفساراتك وإتمام التفعيل نيابةً عنك خلال دقائق.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={openWhatsapp}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-black text-accent-foreground shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--accent)_60%,transparent)] transition hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              تواصل مع الدعم عبر واتساب
            </button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
