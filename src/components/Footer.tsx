import { Link } from "@tanstack/react-router";
import { Mail, Send } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { TELEGRAM_URL } from "@/lib/whatsapp";

const quickLinks = [
  { to: "/products", label: "كل الباقات" },
  { to: "/category/$slug", params: { slug: "falcon" }, label: "فالكون" },
  { to: "/category/$slug", params: { slug: "hulk" }, label: "هولك" },
  { to: "/category/$slug", params: { slug: "smarters" }, label: "سمارترز برو" },
] as const;

const helpLinks = [
  { to: "/about", label: "من نحن" },
  { to: "/reviews", label: "التقييمات" },
  { to: "/activation-guide", label: "طريقة التفعيل" },
  { to: "/track-order", label: "تتبّع الطلب" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-14 text-center">
        {/* العلامة */}
        <div className="flex flex-col items-center">
          <Logo size="md" />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            متجر متخصص في باقات الاشتراكات الرقمية بأسعار مناسبة ودعم متواصل.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-border bg-card/40 px-3 py-1 text-[11px] font-bold">
              VAT 15% مشمولة
            </span>
            <span className="rounded-full border border-border bg-card/40 px-3 py-1 text-[11px] font-bold">
              دعم متواصل
            </span>
          </div>
        </div>

        {/* فاصل ذهبي */}
        <div
          aria-hidden
          className="mx-auto my-10 h-px w-40 bg-gradient-to-r from-transparent via-accent/50 to-transparent"
        />

        {/* روابط في عمودين متمركزين */}
        <div className="mx-auto grid max-w-3xl gap-10 sm:grid-cols-2">
          <nav aria-label="روابط سريعة">
            <h3 className="mb-4 text-sm font-black tracking-wide text-accent">
              روابط سريعة
            </h3>
            <ul className="flex flex-col items-center gap-2.5 text-sm text-muted-foreground">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  {"params" in l ? (
                    <Link
                      to={l.to}
                      params={l.params}
                      className="transition-colors hover:text-accent"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <Link to={l.to} className="transition-colors hover:text-accent">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="المساعدة">
            <h3 className="mb-4 text-sm font-black tracking-wide text-accent">
              المساعدة
            </h3>
            <ul className="flex flex-col items-center gap-2.5 text-sm text-muted-foreground">
              {helpLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* تواصل */}
        <div className="mt-10">
          <h3 className="mb-4 text-sm font-black tracking-wide text-accent">
            تواصل معنا
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-bold transition-colors hover:border-accent hover:text-accent"
            >
              <Mail className="h-4 w-4 text-accent" /> صفحة التواصل
            </Link>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-bold transition-colors hover:border-accent hover:text-accent"
            >
              <Send className="h-4 w-4 text-accent" /> قناة تلجرام
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} شاهد ستور — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
