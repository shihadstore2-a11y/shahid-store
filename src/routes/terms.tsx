import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Headphones,
  Info,
  PlayCircle,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  XCircle,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — شاهد ستور" },
      {
        name: "description",
        content:
          "شروط استخدام متجر شاهد ستور، ضوابط الاشتراكات الرقمية، الضمان، وحدود المسؤولية.",
      },
      { property: "og:title", content: "الشروط والأحكام — شاهد ستور" },
      { property: "og:url", content: "https://shahidstore.net/terms" },
      {
        property: "og:description",
        content:
          "اطّلع على شروط استخدام متجر شاهد ستور وحقوق العميل بالتفصيل.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://shahidstore.net/terms" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:py-16">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-black text-accent">
            <ScrollText className="h-3 w-3" /> الشروط والأحكام
          </span>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            شروط استخدام متجر شاهد ستور
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            مرحباً بك في شاهد ستور، نسعى دائماً لتقديم تجربة اشتراكات رقمية
            آمنة وموثوقة لعملائنا داخل المملكة العربية السعودية وخارجها. ويُعدّ
            إتمام عملية الشراء أو طلب النسخة التجريبية موافقة كاملة وملزمة على
            جميع الشروط والأحكام والسياسات الموضحة أدناه.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">آخر تحديث: 2026/05/18</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:py-14">
        {/* ضوابط الاستخدام */}
        <div>
          <SectionHeader index="أولاً" title="ضوابط استخدام الاشتراكات الرقمية" />
          <div className="mt-4 space-y-4">
            <Block icon={<Zap />} title="التفعيل والتسليم">
              <ul className="space-y-2">
                <Bullet>
                  يتم تفعيل الاشتراكات الرسمية بشكل سريع وآلي بعد تأكيد عملية
                  الدفع.
                </Bullet>
                <Bullet>
                  أما النسخ التجريبية فقد يستغرق تفعيلها من 5 دقائق وحتى 10
                  ساعات كحدّ أقصى.
                </Bullet>
              </ul>
            </Block>

            <Block icon={<ShieldAlert />} title="سياسة الاستخدام">
              <p className="leading-relaxed text-muted-foreground">
                جميع الاشتراكات مخصّصة للاستخدام على جهاز واحد فقط في نفس
                الوقت، ما لم يُوضَّح غير ذلك ضمن تفاصيل الباقة. وأي محاولة
                لاستخدام الحساب على أكثر من جهاز بشكل متزامن قد تؤدي إلى:
              </p>
              <ul className="mt-3 space-y-2">
                <Bullet>حظر دائم وتلقائي للحساب من السيرفر</Bullet>
                <Bullet>إلغاء صلاحية الاشتراك</Bullet>
                <Bullet>سقوط حق الدعم أو التعويض</Bullet>
              </ul>
            </Block>

            <Block icon={<Headphones />} title="الدعم الفني">
              <p className="leading-relaxed text-muted-foreground">
                نوفّر دعماً فنياً مستمراً عبر قنواتنا الرسمية طوال فترة صلاحية
                الاشتراك لمعالجة المشكلات والاستفسارات الفنية.
              </p>
            </Block>

            <Block icon={<Smartphone />} title="جودة الاتصال والأجهزة">
              <p className="leading-relaxed text-muted-foreground">
                لا يتحمّل المتجر مسؤولية ضعف الخدمة الناتج عن:
              </p>
              <ul className="mt-3 space-y-2">
                <Bullet>ضعف اتصال الإنترنت لدى العميل</Bullet>
                <Bullet>عدم توافق الجهاز المستخدم</Bullet>
                <Bullet>مشاكل التشغيل الخاصة بالجهاز</Bullet>
              </ul>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                لذلك ننصح بطلب النسخة التجريبية قبل الشراء للتأكد من توافق
                الخدمة مع جهاز العميل.
              </p>
            </Block>
          </div>
        </div>

        {/* الإلغاء والاسترجاع — رابط لصفحة الاسترجاع */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Info />
            </div>
            <h3 className="text-lg font-black sm:text-xl">
              سياسة الإلغاء والاسترجاع
            </h3>
          </div>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            نظراً لطبيعة المنتجات الرقمية، تعتبر جميع المبيعات نهائية وغير
            قابلة للإلغاء أو الاستبدال بعد التسليم — مع استثناءات محدّدة موضّحة
            في صفحة الاسترجاع.
          </p>
          <Link
            to="/refund-policy"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-black text-accent-foreground shadow-md transition hover:opacity-90"
          >
            الاطّلاع على سياسة الاسترجاع
          </Link>
        </div>

        {/* إخلاء المسؤولية والضمان */}
        <div>
          <SectionHeader
            index="ثانياً"
            title="إخلاء المسؤولية والضمان"
          />
          <div className="mt-4 space-y-4">
            <Block icon={<PlayCircle />} title="طبيعة الخدمة">
              <p className="leading-relaxed text-muted-foreground">
                تعمل مؤسسة شاهد ستور كموزّع لخدمات البث والسيرفرات الرقمية،
                ولسنا المالك المباشر لمحتوى السيرفرات. لذلك لا يتحمّل المتجر
                مسؤولية:
              </p>
              <ul className="mt-3 space-y-2">
                <Bullet>حذف المحتوى</Bullet>
                <Bullet>تغيير القنوات</Bullet>
                <Bullet>توقّف بعض الأفلام أو المسلسلات</Bullet>
                <Bullet>أي تحديثات تجريها الجهة المزوّدة للخدمة</Bullet>
              </ul>
            </Block>

            <Block icon={<AlertTriangle />} title="مسؤولية بيانات الطلب">
              <p className="leading-relaxed text-muted-foreground">
                يتحمّل العميل المسؤولية الكاملة عن صحة البيانات المدخلة أثناء
                الطلب، مثل البريد الإلكتروني ورقم الجوال. ولا يتحمّل المتجر أي
                مسؤولية عن أخطاء الإدخال التي قد تؤدي إلى تأخّر أو فقدان
                بيانات التفعيل.
              </p>
            </Block>

            <Block icon={<ShieldCheck />} title="الضمان">
              <p className="leading-relaxed text-muted-foreground">
                نوفّر ضماناً تشغيلياً طوال مدة الاشتراك. وفي حال حدوث توقّف
                دائم وكلّي للخدمة بسبب ظروف خارجة عن الإرادة، يلتزم المتجر
                بتعويض العميل باشتراك بديل يغطّي المدة المتبقية.
              </p>
            </Block>

            <Block icon={<XCircle />} title="إسقاط الضمان">
              <p className="leading-relaxed text-muted-foreground">
                يحقّ للمتجر إيقاف الخدمة وإلغاء الضمان والدعم الفني دون تعويض
                في الحالات التالية:
              </p>
              <ul className="mt-3 space-y-2">
                <Bullet>مشاركة الحساب مع الآخرين</Bullet>
                <Bullet>إعادة بيع الاشتراك</Bullet>
                <Bullet>التلاعب ببيانات الحساب</Bullet>
                <Bullet>أي استخدام مخالف لسياسة المتجر</Bullet>
              </ul>
            </Block>
          </div>
        </div>

        {/* تنويه هام */}
        <div
          className="rounded-3xl border border-accent/40 bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 65%)",
          }}
        >
          <h2 className="text-lg font-black sm:text-xl">تنويه هام</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            شراء أي منتج من متجر شاهد ستور يعني إقرار العميل بأنه:
          </p>
          <ul className="mx-auto mt-4 inline-flex max-w-md flex-col gap-2 text-start">
            <Bullet>اطّلع على جميع الشروط والأحكام</Bullet>
            <Bullet>فهم كافة السياسات المذكورة</Bullet>
            <Bullet>وافق عليها بشكل كامل وملزم دون أي تحفّظ</Bullet>
          </ul>
        </div>

        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © جميع الحقوق محفوظة 2026 — مؤسسة شاهد ستور
        </div>
      </section>
    </SiteLayout>
  );
}

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-accent/30 pb-3">
      <span className="rounded-md bg-accent px-2.5 py-0.5 text-xs font-black text-accent-foreground">
        {index}
      </span>
      <h2 className="text-xl font-black sm:text-2xl">{title}</h2>
    </div>
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
        <h3 className="text-lg font-black sm:text-xl">{title}</h3>
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
