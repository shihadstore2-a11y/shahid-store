import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { TELEGRAM_URL, whatsappLink, useWhatsappNumber } from "@/lib/whatsapp";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل مع شاهد ستور" },
      {
        name: "description",
        content: "تواصل مع فريق شاهد ستور عبر النموذج أو قناة تلجرام للحصول على دعم سريع.",
      },
      { property: "og:title", content: "تواصل مع شاهد ستور" },
      {
        property: "og:description",
        content:
          "تواصل مع فريق شاهد ستور للحصول على دعم سريع لاشتراكك أو استفسار قبل الشراء.",
      },
      { property: "og:url", content: "https://shahidstore.net/contact" },
    ],
    links: [
      { rel: "canonical", href: "https://shahidstore.net/contact" },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير").max(80),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => {
        const cleaned = v.replace(/[\s\-()]/g, "");
        return /^(?:\+|00)?[1-9]\d{6,14}$/.test(cleaned) || /^(?:0)?5\d{8}$/.test(cleaned);
      },
      "يرجى إدخال رقم جوال صحيح مع رمز الدولة (مثل: +212... أو +966...)",
    ),
  topic: z.string().trim().min(2, "اختر موضوعاً").max(60),
  message: z.string().trim().min(5, "الرسالة قصيرة").max(500),
});
type Vals = z.infer<typeof schema>;

function ContactPage() {
  const whatsappNumber = useWhatsappNumber();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Vals>({ resolver: zodResolver(schema) });

  const onSubmit = (v: Vals) => {
    const msg = `السلام عليكم 👋\nأرسل عبر نموذج الموقع:\n\n👤 ${v.name}\n📱 ${v.phone}\n📌 الموضوع: ${v.topic}\n\n${v.message}`;
    if (typeof window !== "undefined") {
      window.open(whatsappLink(msg, whatsappNumber), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-black sm:text-4xl">تواصل معنا</h1>
          <p className="mt-3 text-base text-muted-foreground">
            متاحون لك يومياً عبر النموذج أدناه أو قناة تلجرام.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-1">
          <ContactCard
            href={TELEGRAM_URL}
            icon={<Send />}
            title="تلجرام"
            value="انضم إلى القناة"
            color="#229ED9"
          />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:grid-cols-2"
        >
          <h2 className="text-lg font-black sm:col-span-2">أرسل استفسارك</h2>
          <Field label="الاسم" error={errors.name?.message}>
            <input {...register("name")} className="cinput" autoComplete="name" />
          </Field>
          <Field label="رقم الجوال" error={errors.phone?.message}>
            <input {...register("phone")} dir="ltr" inputMode="tel" autoComplete="tel" placeholder="05xxxxxxxx" className="cinput text-right" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="الموضوع" error={errors.topic?.message}>
              <input {...register("topic")} className="cinput" placeholder="استفسار عن باقة / مشكلة في طلب / اقتراح" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="الرسالة" error={errors.message?.message}>
              <textarea {...register("message")} rows={5} className="cinput resize-none" />
            </Field>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 sm:col-span-2"
          >
            إرسال الاستفسار
          </button>
          <style>{`.cinput{display:block;width:100%;border-radius:0.5rem;border:1px solid var(--input);background:var(--background);padding:0.625rem 0.75rem;font-size:0.875rem;color:var(--foreground);outline:none}.cinput:focus{box-shadow:0 0 0 2px var(--ring)}`}</style>
        </form>
      </section>
    </SiteLayout>
  );
}

function ContactCard({
  href,
  icon,
  title,
  value,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:border-primary"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="truncate text-sm font-black">{value}</div>
      </div>
    </a>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-foreground">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs font-bold text-destructive">{error}</p>}
    </label>
  );
}
