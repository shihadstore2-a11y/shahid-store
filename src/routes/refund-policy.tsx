import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AppWindow,
  CheckCircle2,
  Headphones,
  MessageCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "سياسة الإلغاء والاسترجاع — شاهد ستور" },
      {
        name: "description",
        content:
          "تفاصيل سياسة الاسترجاع والإلغاء في متجر شاهد ستور، والحالات المسموح فيها باسترداد المبلغ.",
      },
      { property: "og:title", content: "سياسة الإلغاء والاسترجاع — شاهد ستور" },
      {
        property: "og:description",
        content: "اطّلع على حالات الاسترجاع المعتمَدة وآلية معالجة الطلبات.",
      },
      { property: "og:url", content: "https://shahidstore.net/refund-policy" },
    ],
    links: [
      { rel: "canonical", href: "https://shahidstore.net/refund-policy" },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:py-16">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-black text-accent">
            <RotateCcw className="h-3 w-3" /> سياسة الإلغاء والاسترجاع
          </span>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            سياسة الإلغاء والاسترجاع
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            نظراً لطبيعة المنتجات الرقمية التي لا يمكن استرجاعها بعد التفعيل،
            فإن جميع المبيعات تعتبر نهائية وغير قابلة للإلغاء أو الاستبدال أو
            الاسترجاع بعد التسليم.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">آخر تحديث: 2026/05/18</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:py-14">
        {/* مسموح */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15 text-success">
              <CheckCircle2 />
            </div>
            <h2 className="text-xl font-black sm:text-2xl">
              حالات الاسترجاع المسموح بها
            </h2>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            يحقّ للعميل استرداد كامل المبلغ فقط في حال:
          </p>
          <ul className="mt-3 space-y-2">
            <Bullet>عدم القدرة على تفعيل أو تسليم الاشتراك.</Bullet>
            <Bullet>
              مرور أكثر من 48 ساعة على تأكيد الدفع دون تنفيذ الطلب.
            </Bullet>
          </ul>
        </div>

        {/* غير مشمول */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
              <XCircle />
            </div>
            <h2 className="text-xl font-black sm:text-2xl">
              الحالات غير المشمولة بالاسترجاع
            </h2>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            لا يشمل الاسترجاع الحالات التالية:
          </p>
          <ul className="mt-3 space-y-2">
            <Bullet>التراجع عن قرار الشراء.</Bullet>
            <Bullet>عدم الرغبة في الاستمرار بالخدمة.</Bullet>
            <Bullet>عدم معرفة طريقة التشغيل.</Bullet>
            <Bullet>مشاكل خاصة بالجهاز أو التطبيق المستخدم.</Bullet>
          </ul>
          <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                يوفّر المتجر <strong className="text-card-foreground">شروحات تشغيل واضحة</strong> و
                <strong className="text-card-foreground"> دعماً فنياً للمساعدة</strong> عبر قنواتنا الرسمية.
              </span>
            </p>
          </div>
        </div>

        {/* تطبيقات التشغيل */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <AppWindow />
            </div>
            <h2 className="text-xl font-black sm:text-2xl">تطبيقات التشغيل</h2>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            رسوم الاشتراك تشمل الخدمة والسيرفر فقط، ولا تشمل التطبيقات
            المدفوعة التي قد يحتاجها العميل لتشغيل الخدمة على بعض الأجهزة
            الذكية.
          </p>
        </div>

        {/* CTA دعم */}
        <div
          className="rounded-3xl border border-accent/40 bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 65%)",
          }}
        >
          <h2 className="text-lg font-black sm:text-xl">
            هل تواجه مشكلة في طلبك؟
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            تواصل مع فريق الدعم وسنحرص على معالجة طلبك بأسرع وقت ضمن سياستنا
            المعتمَدة.
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-black text-accent-foreground shadow-md transition hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> تواصل مع الدعم
          </Link>
        </div>

        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © جميع الحقوق محفوظة 2026 — مؤسسة شاهد ستور
        </div>
      </section>
    </SiteLayout>
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
