import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

const FAQ = [
  { q: "كم يستغرق تفعيل الاشتراك؟", a: "نسعى للتفعيل خلال دقائق إلى ساعة بعد تأكيد الدفع. في فترات الذروة قد يصل إلى 24 ساعة." },
  { q: "هل الأسعار تشمل ضريبة القيمة المضافة؟", a: "نعم، جميع الأسعار المعروضة بالريال السعودي وتشمل ضريبة القيمة المضافة 15%." },
  { q: "ما طرق الدفع المتاحة؟", a: "نتلقى الطلبات حالياً من خلال الموقع ونتواصل معك لتأكيد الدفع. بوابات البطاقة وتابي والتحويل البنكي قيد التفعيل قريباً." },
  { q: "هل يمكنني الاسترجاع؟", a: "نعم، وفق سياسة الاسترجاع المعلنة. يرجى التواصل مع الدعم خلال 7 أيام من الشراء." },
  { q: "على أي أجهزة يعمل الاشتراك؟", a: "تختلف من باقة لأخرى. الأجهزة المدعومة موضّحة في صفحة كل باقة (تلفزيونات سمارت، أندرويد، iOS، Mac، Windows...)." },
  { q: "هل يدعم الاشتراك أكثر من جهاز؟", a: "بعض الباقات تدعم جهازين أو أكثر. راجع تفاصيل كل باقة قبل الشراء." },
  { q: "ماذا أفعل إذا واجهتني مشكلة في التشغيل؟", a: "تواصل معنا من صفحة الدعم وأرفق لقطة شاشة للمشكلة، فريقنا سيساعدك خطوة بخطوة." },
  { q: "هل تخزّنون بيانات الدفع؟", a: "لا. نحن لا نخزّن أي بيانات بطاقات. الدفع يتم عبر بوابات معتمدة." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة — شاهد ستور" },
      { name: "description", content: "إجابات على أكثر الأسئلة شيوعاً حول الاشتراكات والدفع والتفعيل في شاهد ستور." },
      { property: "og:title", content: "الأسئلة الشائعة — شاهد ستور" },
      {
        property: "og:description",
        content:
          "إجابات على أكثر الأسئلة شيوعاً عن اشتراكات IPTV، طرق الدفع، التفعيل، والدعم في شاهد ستور.",
      },
      { property: "og:url", content: "https://shahidstore.net/faq" },
    ],
    links: [
      { rel: "canonical", href: "https://shahidstore.net/faq" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-black sm:text-4xl">الأسئلة الشائعة</h1>
          <p className="mt-3 text-muted-foreground">إجابات سريعة لأكثر ما يسأل عنه عملاؤنا.</p>
        </div>

        <div className="mt-8 space-y-2">
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-right"
                  aria-expanded={isOpen}
                >
                  <span className="font-black">{f.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-secondary/30 p-4 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}
