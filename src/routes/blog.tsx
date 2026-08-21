import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Eye, FileText } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { publicArticlesQueryOptions, type Article } from "@/lib/admin-articles";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "المدوّنة — شاهد ستور" },
      { name: "description", content: "نصائح ودروس عن IPTV والاشتراكات الرقمية من شاهد ستور." },
      { property: "og:title", content: "المدوّنة — شاهد ستور" },
      { property: "og:description", content: "نصائح ودروس عن IPTV والاشتراكات الرقمية." },
      { property: "og:url", content: "https://shahidstore.net/blog" },
    ],
    links: [{ rel: "canonical", href: "https://shahidstore.net/blog" }],
  }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(publicArticlesQueryOptions());
    return null;
  },
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const { data: articles, isLoading } = useQuery(publicArticlesQueryOptions());

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <FileText className="h-10 w-10 mx-auto text-accent mb-3" />
          <h1 className="text-3xl md:text-4xl font-black">المدوّنة</h1>
          <p className="mt-2 text-muted-foreground">
            نصائح ودروس عن IPTV والاشتراكات الرقمية
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-16">جارٍ التحميل…</div>
        ) : !articles || articles.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            لا توجد مقالات منشورة بعد.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function ArticleCard({ article: a }: { article: Article }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: a.slug }}
      className="group rounded-2xl border border-border bg-card overflow-hidden transition hover:border-accent/60 hover:shadow-lg"
    >
      {a.cover_image_url && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={a.cover_image_url}
            alt={a.title_ar}
            loading="lazy"
            className="w-full h-full object-cover transition group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5 space-y-3">
        {a.category && (
          <span className="inline-block text-xs font-bold text-accent">{a.category}</span>
        )}
        <h2 className="text-lg font-black leading-tight group-hover:text-accent transition">
          {a.title_ar}
        </h2>
        {a.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
          {a.published_at && (
            <div className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(a.published_at).toLocaleDateString("ar-SA")}
            </div>
          )}
          {a.view_count > 0 && (
            <div className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {a.view_count.toLocaleString("ar-SA")}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
