import { Link } from "@tanstack/react-router";
import { Apple, BookOpen, Laptop, Monitor, Smartphone, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";

const devices = [
  { slug: "android", label: "Android", Icon: Smartphone },
  { slug: "ios", label: "iPhone", Icon: Apple },
  { slug: "samsung-tv", label: "Samsung TV", Icon: Tv },
  { slug: "lg-tv", label: "LG TV", Icon: Tv },
  { slug: "windows", label: "Windows", Icon: Monitor },
  { slug: "mac", label: "Mac", Icon: Laptop },
];

export function AppGuidesSection() {
  return (
    <section className="bg-card/40 py-10 md:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 text-center md:mb-8">
          <h2 className="mb-2 text-2xl font-black md:text-3xl">كيف تشغّل اشتراكك؟</h2>
          <p className="text-muted-foreground">خطوات مبسّطة لكل جهاز</p>
        </div>

        <div className="mx-auto mb-6 grid max-w-3xl grid-cols-3 gap-3 md:grid-cols-6">
          {devices.map((d) => (
            <Link
              key={d.slug}
              to="/activation-guide"
              hash={d.slug}
              className="group flex flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 transition-all duration-200 hover:border-accent hover:shadow-md"
            >
              <div className="mb-2 rounded-full bg-secondary p-2.5 text-accent transition-colors group-hover:bg-accent/20">
                <d.Icon className="h-6 w-6" />
              </div>
              <span className="text-center text-xs font-bold leading-tight">
                {d.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/activation-guide">
              <BookOpen className="ml-2 h-5 w-5" />
              دليل التشغيل الكامل
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
