import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

type Props = {
  error: Error;
  reset?: () => void;
};

export function ErrorFallback({ error, reset }: Props) {
  const router = useRouter();

  if (typeof window !== "undefined") {
    console.error("[ErrorFallback]", error);
  }

  const handleRetry = () => {
    router.invalidate();
    if (reset) reset();
  };

  return (
    <section className="relative isolate flex min-h-[60vh] items-center justify-center overflow-hidden px-4 py-16">
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
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          حدث خطأ — نأسف للإزعاج
        </h2>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          واجهتنا مشكلة في تحميل هذه الصفحة. يمكنك إعادة المحاولة أو العودة للرئيسية.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleRetry}
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
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </section>
  );
}
