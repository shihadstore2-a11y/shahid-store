import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  CheckCircle2,
  Compass,
  Headphones,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  Tv,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — شاهد ستور | Shahid Store" },
      {
        name: "description",
        content:
          "شاهد ستور منصة سعودية متخصصة في الاشتراكات الرقمية وخدمات البث والترفيه الإلكتروني، تعمل تحت الاسم التجاري VIP DIGITAL.",
      },
      { property: "og:title", content: "من نحن — شاهد ستور" },
      {
        property: "og:description",
        content:
          "منصة سعودية للاشتراكات الرقمية وخدمات البث — جودة، استقرار، وأسعار مناسبة.",
      },
      { property: "og:url", content: "https://shahidstore.net/about" },
    ],
    links: [
      { rel: "canonical", href: "https://shahidstore.net/about" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:py-20">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-black text-accent">
            <Sparkles className="h-3 w-3" /> من نحن
          </span>
          <h1 className="mt-4 text-3xl font-black sm:text-5xl">
            شاهد ستور <span className="text-accent">|</span> Shahid Store
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            منصة سعودية متخصصة في توفير الاشتراكات الرقمية وخدمات البث والترفيه الإلكتروني، تعمل داخل المملكة العربية السعودية وفق نشاط تجاري رسمي، وتهدف إلى تقديم تجربة رقمية موثوقة تجمع بين الجودة، الاستقرار، والأسعار المناسبة.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            يعمل المتجر إلكترونياً تحت الاسم التجاري{" "}
            <span className="font-black text-accent">VIP DIGITAL</span>، لتقديم
            حلول اشتراك متنوعة تلبي احتياجات المستخدمين الباحثين عن محتوى
            ترفيهي متكامل وسهل الوصول.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:py-16">
        {/* ماذا نقدم */}
        <Block icon={<Tv />} title="ماذا نقدّم؟">
          <p className="leading-relaxed text-muted-foreground">
            في شاهد ستور نوفّر مجموعة واسعة من الاشتراكات الرقمية التي تمنح
            المستخدم تجربة مشاهدة متكاملة تشمل:
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            <Bullet>القنوات الرياضية</Bullet>
            <Bullet>الأفلام والمسلسلات</Bullet>
            <Bullet>المحتوى الترفيهي المتنوّع</Bullet>
            <Bullet>خدمات البث عبر الأجهزة الذكية</Bullet>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            كما نحرص على توفير خيارات مرنة تناسب مختلف الاحتياجات والميزانيات.
          </p>
        </Block>

        {/* رؤية + رسالة */}
        <div className="grid gap-4 md:grid-cols-2">
          <Block icon={<Compass />} title="رؤيتنا">
            <p className="leading-relaxed text-muted-foreground">
              نسعى لأن نصبح من أبرز المتاجر الرقمية المتخصصة في الاشتراكات
              الإلكترونية، عبر تقديم خدمات عالية الجودة تعتمد على الثقة، سهولة
              الاستخدام، والأسعار التنافسية.
            </p>
          </Block>
          <Block icon={<Target />} title="رسالتنا">
            <p className="leading-relaxed text-muted-foreground">
              تقديم حلول رقمية ترفيهية تساعد عملاءنا على الوصول إلى المحتوى
              المفضّل لديهم بسهولة ومرونة، مع ضمان تجربة استخدام مستقرة وخدمة
              عملاء احترافية.
            </p>
          </Block>
        </div>

        {/* خدمات */}
        <Block icon={<Layers />} title="خدمات شاهد ستور">
          <p className="leading-relaxed text-muted-foreground">
            تشمل خدماتنا مجموعة متنوّعة من الاشتراكات الرقمية، مثل:
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            <Bullet>اشتراك فالكون</Bullet>
            <Bullet>اشتراك هولك</Bullet>
            <Bullet>اشتراك سمارترز</Bullet>
            <Bullet>الباقات الشهرية والسنوية</Bullet>
            <Bullet>العروض الموسمية والخطط المرنة</Bullet>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            وتتميّز جميع الخدمات بسرعة التفعيل وسهولة التشغيل على مختلف الأجهزة
            والمنصات.
          </p>
        </Block>

        {/* لماذا يختارنا */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Award />
            </div>
            <h2 className="text-2xl font-black">لماذا يختارنا العملاء؟</h2>
          </div>
          <p className="mb-5 leading-relaxed text-muted-foreground">
            لأننا نؤمن بأن جودة الخدمة تبدأ من التفاصيل، لذلك نركّز على:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card icon={<Sparkles />} title="أسعار تنافسية" desc="أسعار مناسبة وتنافسية تتناسب مع جميع الفئات." />
            <Card icon={<Layers />} title="خيارات متعدّدة" desc="باقات وخطط مرنة تناسب الجميع واحتياجاتهم." />
            <Card icon={<Headphones />} title="دعم فني متواصل" desc="فريق دعم سريع الاستجابة طوال أيام الأسبوع." />
            <Card icon={<Zap />} title="سهولة الاستخدام" desc="تفعيل سريع وخطوات تشغيل واضحة على جميع الأجهزة." />
            <Card icon={<Tv />} title="تحديث مستمر" desc="تطوير دائم للخدمات والمحتوى لضمان أفضل تجربة." />
            <Card icon={<ShieldCheck />} title="أداء موثوق" desc="استقرار وأداء يعتمد عليه في وقت الذروة." />
          </div>
        </div>

        {/* التزامنا */}
        <Block icon={<ShieldCheck />} title="التزامنا">
          <p className="leading-relaxed text-muted-foreground">
            نعمل باستمرار على تطوير خدماتنا وتحسين تجربة المستخدم، مع الحرص على
            تقديم مستوى عالٍ من الجودة والاعتمادية لضمان رضا عملائنا داخل
            المملكة وخارجها.
          </p>
        </Block>

        {/* خاتمة + CTA */}
        <div
          className="overflow-hidden rounded-3xl border border-accent/40 bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 65%)",
          }}
        >
          <h2 className="text-2xl font-black sm:text-3xl">
            شاهد ستور… تجربة رقمية بثقة
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            في شاهد ستور نطمح لأن نكون خيارك الأول في عالم الاشتراكات الرقمية،
            من خلال تقديم خدمات تجمع بين الجودة، المرونة، والدعم المستمر.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              hash="catalog"
              className="inline-block rounded-xl bg-accent px-6 py-3 font-black text-accent-foreground shadow-md transition hover:opacity-90"
            >
              تصفّح الباقات
            </Link>
          </div>
        </div>

        {/* الحقوق */}
        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © جميع الحقوق محفوظة 2026 — Shahid Store | شاهد ستور
        </div>
      </section>
    </SiteLayout>
  );
}

function Block({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
          {icon}
        </div>
        <h2 className="text-xl font-black sm:text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-card-foreground">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <span>{children}</span>
    </li>
  );
}

function Card({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
        {icon}
      </div>
      <h3 className="mt-3 text-base font-black">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
