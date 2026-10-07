import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import appCss from "../styles.css?url";
import { SiteLayout } from "@/components/SiteLayout";
import { Logo } from "@/components/brand/Logo";
import { AuthProvider } from "@/hooks/useAuth";
import { getActiveStore } from "@/lib/store-config";


function NotFoundComponent() {
  return (
    <SiteLayout>
      <section className="relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-20">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" showText={false} />
          </div>
          <p
            className="bg-clip-text text-7xl font-black leading-none text-transparent md:text-8xl"
            style={{ backgroundImage: "var(--gradient-gold)" }}
          >
            404
          </p>
          <h1 className="mt-4 text-2xl font-bold text-foreground md:text-3xl">
            الصفحة غير موجودة
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            الرابط الذي تبحث عنه غير متوفر أو تم نقله. تفقّد العنوان أو ارجع إلى الصفحة الرئيسية.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-accent-foreground shadow-[var(--shadow-gold)] transition-transform hover:scale-[1.03] md:text-base"
              style={{ background: "var(--gradient-gold)" }}
            >
              <Home className="h-4 w-4" />
              الرجوع للرئيسية
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-2xl border border-accent/40 bg-background/40 px-6 py-3 text-sm font-bold text-foreground backdrop-blur-md transition-colors hover:bg-background/60 md:text-base"
            >
              عرض الباقات
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <SiteLayout>
      <section className="relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-20">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/15"
              aria-hidden
            >
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            حصلت مشكلة في تحميل الصفحة
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            يبدو أن هناك خطأً مؤقتاً. حاول إعادة التحميل أو ارجع للرئيسية.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-accent-foreground shadow-[var(--shadow-gold)] transition-transform hover:scale-[1.03] md:text-base"
              style={{ background: "var(--gradient-gold)" }}
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-background/40 px-6 py-3 text-sm font-bold text-foreground backdrop-blur-md transition-colors hover:bg-background/60 md:text-base"
            >
              <Home className="h-4 w-4" />
              الرئيسية
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const store = getActiveStore();
    const storeTitle = `${store.name_ar} — اشتراكات رقمية بتفعيل سريع`;
    const storeDesc = `${store.name_ar} — متجر اشتراكات رقمية موثوق. تفعيل سريع، دفع آمن، ودعم متواصل.`;
    const storeLogo = store.logo_url || "/logo.webp";
    const storeUrl = store.domain ? `https://${store.domain}` : "https://ksa-tv.com";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: storeTitle },
        { name: "description", content: storeDesc },
        { name: "author", content: store.name_ar },
        { property: "og:title", content: storeTitle },
        { property: "og:description", content: storeDesc },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "ar_SA" },
        { property: "og:image", content: storeLogo },
        { property: "og:image:width", content: "512" },
        { property: "og:image:height", content: "512" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: storeTitle },
        { name: "twitter:description", content: storeDesc },
        { name: "twitter:image", content: storeLogo },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/webp", href: storeLogo },
        { rel: "icon", type: "image/webp", sizes: "192x192", href: storeLogo },
        { rel: "icon", type: "image/webp", sizes: "512x512", href: storeLogo },
        { rel: "apple-touch-icon", sizes: "180x180", href: storeLogo },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: store.name_ar,
            alternateName: store.name_en || store.name_ar,
            url: storeUrl,
            logo: storeLogo.startsWith("http") ? storeLogo : `${storeUrl}${storeLogo}`,
            description: storeDesc,
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              availableLanguage: ["ar", "en"],
              areaServed: "SA",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: store.name_ar,
            url: storeUrl,
            inLanguage: "ar",
            potentialAction: {
              "@type": "SearchAction",
              target: `${storeUrl}/products?search={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
    },
  },
});

function RootShell({ children }: { children: React.ReactNode }) {
  const activeStore = getActiveStore();

  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__STORE_CONTEXT__ = ${JSON.stringify(activeStore)};`,
          }}
        />
      </head>
      <body>
        <QueryClientProvider client={defaultQueryClient}>
          <AuthProvider>
            {children}
            <Toaster position="top-center" dir="rtl" richColors />
          </AuthProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
