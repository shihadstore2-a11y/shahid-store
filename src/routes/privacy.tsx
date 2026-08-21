import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Lock, ShieldCheck, UserCog } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — شاهد ستور" },
      {
        name: "description",
        content:
          "كيف يجمع شاهد ستور بيانات العملاء ويحميها وفق أعلى معايير الأمان والسرية.",
      },
      { property: "og:title", content: "سياسة الخصوصية — شاهد ستور" },
      {
        property: "og:description",
        content:
          "نلتزم بسرية بيانات عملائنا وحمايتها وفق أعلى معايير الأمان.",
      },
      { property: "og:url", content: "https://shahidstore.net/privacy" },
    ],
    links: [
      { rel: "canonical", href: "https://shahidstore.net/privacy" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:py-16">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-black text-accent">
            <ShieldCheck className="h-3 w-3" /> سياسة الخصوصية
          </span>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            خصوصيتك أمانة لدينا
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            مرحباً بك في شاهد ستور، نسعى دائماً لتقديم تجربة اشتراكات رقمية
            آمنة وموثوقة لعملائنا داخل المملكة العربية السعودية وخارجها. ويُعدّ
            إتمام عملية الشراء أو طلب النسخة التجريبية موافقة كاملة وملزمة على
            جميع الشروط والسياسات الموضّحة.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">آخر تحديث: 2026/05/18</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:py-14">
        <Block icon={<UserCog />} title="استخدام البيانات">
          <p className="leading-relaxed text-muted-foreground">
            يتم استخدام البيانات الشخصية مثل:
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            <Bullet>الاسم</Bullet>
            <Bullet>البريد الإلكتروني</Bullet>
            <Bullet>رقم الجوال</Bullet>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            وذلك فقط لغرض:
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            <Bullet>معالجة الطلبات</Bullet>
            <Bullet>تفعيل الاشتراكات</Bullet>
            <Bullet>تقديم الدعم الفني وخدمة العملاء</Bullet>
          </ul>
        </Block>

        <Block icon={<Lock />} title="سرية المعلومات">
          <p className="leading-relaxed text-muted-foreground">
            نلتزم بعدم بيع أو مشاركة أو تأجير أي بيانات خاصة بالعملاء لأي طرف
            خارجي خارج النطاق التشغيلي الضروري لتقديم الخدمة.
          </p>
        </Block>

        <Block icon={<ShieldCheck />} title="حماية البيانات">
          <p className="leading-relaxed text-muted-foreground">
            تتم معالجة جميع البيانات عبر أنظمة حماية وتشفير متقدّمة لضمان أعلى
            مستويات الأمان والخصوصية.
          </p>
        </Block>

        <div
          className="rounded-3xl border border-accent/40 bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 65%)",
          }}
        >
          <h2 className="text-lg font-black sm:text-xl">تنويه هام</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            شراء أي منتج من متجر شاهد ستور يعني إقرار العميل بأنه اطّلع على
            جميع الشروط والأحكام وفهم كافة السياسات المذكورة ووافق عليها بشكل
            كامل وملزم دون أي تحفّظ.
          </p>
        </div>

        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © جميع الحقوق محفوظة 2026 — مؤسسة شاهد ستور
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
