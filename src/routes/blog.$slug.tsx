import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, ArrowRight, Share2, Eye } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ErrorFallback } from "@/components/ErrorFallback";
import { articleBySlugQueryOptions, type Article } from "@/lib/admin-articles";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params, context }) => {
    const article = await context.queryClient.fetchQuery(
      articleBySlugQueryOptions(params.slug),
    );
    if (!article) throw notFound();
    return { article };
  },
  head: ({ params, loaderData }) => {
    const a = loaderData?.article as Article | undefined;
    if (!a) {
      return { meta: [{ title: "مقالة — شاهد ستور" }] };
    }
    const title = a.meta_title || a.title_ar;
    const desc = a.meta_description || a.excerpt || "";
    const url = `https://shahidstore.net/blog/${params.slug}`;
    return {
      meta: [
        { title: `${title} — شاهد ستور` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        ...(a.cover_image_url
          ? [
              { property: "og:image", content: a.cover_image_url },
              { property: "twitter:image", content: a.cover_image_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title_ar,
            description: desc,
            image: a.cover_image_url || undefined,
            datePublished: a.published_at || undefined,
            dateModified: a.updated_at || a.published_at || undefined,
            author: {
              "@type": "Organization",
              name: a.author || "شاهد ستور",
            },
            publisher: {
              "@type": "Organization",
              name: "شاهد ستور",
              logo: {
                "@type": "ImageObject",
                url: "https://shahidstore.net/logo.webp",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": url,
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-black">المقالة غير موجودة</h1>
        <Link to="/blog" className="mt-6 inline-flex text-accent hover:underline">
          العودة للمدوّنة
        </Link>
      </div>
    </SiteLayout>
  ),
  component: ArticleDetailPage,
  errorComponent: (props) => <ErrorFallback {...props} />,
});

function ArticleDetailPage() {
  const { article } = Route.useLoaderData();

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const waText = encodeURIComponent(`${article.title_ar} — ${shareUrl}`);
  const twText = encodeURIComponent(article.title_ar);

  return (
    <SiteLayout>
      <article className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-8"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للمدوّنة
        </Link>

        <header className="space-y-4 mb-8">
          {article.category && (
            <span className="inline-block text-xs font-bold text-accent">{article.category}</span>
          )}
          <h1 className="text-3xl md:text-4xl font-black leading-tight">{article.title_ar}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{article.author}</span>
            {article.published_at && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(article.published_at).toLocaleDateString("ar-SA")}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {article.view_count.toLocaleString("ar-SA")}
            </span>
          </div>
        </header>

        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title_ar}
            className="w-full rounded-2xl mb-10 object-cover"
          />
        )}

        <div
          className="prose prose-invert max-w-none prose-headings:font-black prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-accent prose-li:text-foreground/90 prose-hr:border-border"
          dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(article.content_md) }}
        />

        <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center gap-3">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">شارك:</span>
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm rounded-full border border-border px-3 py-1 hover:border-accent hover:text-accent"
          >
            واتساب
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${twText}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm rounded-full border border-border px-3 py-1 hover:border-accent hover:text-accent"
          >
            تويتر / X
          </a>
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            className="text-sm rounded-full border border-border px-3 py-1 hover:border-accent hover:text-accent"
          >
            نسخ الرابط
          </button>
        </div>
      </article>
    </SiteLayout>
  );
}

// Markdown بسيط آمن (يُعرَّف هنا فقط؛ يهرب HTML أولاً)
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function simpleMarkdownToHtml(md: string): string {
  const lines = escapeHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let paragraph: string[] = [];

  const flushPara = () => {
    if (paragraph.length) {
      let text = paragraph.join(" ");
      text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
      out.push(`<p>${text}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      closeList();
      continue;
    }
    if (/^---+$/.test(line)) {
      flushPara();
      closeList();
      out.push("<hr />");
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^###\s+(.+)$/))) {
      flushPara();
      closeList();
      out.push(`<h3>${m[1]}</h3>`);
      continue;
    }
    if ((m = line.match(/^##\s+(.+)$/))) {
      flushPara();
      closeList();
      out.push(`<h2>${m[1]}</h2>`);
      continue;
    }
    if ((m = line.match(/^#\s+(.+)$/))) {
      flushPara();
      closeList();
      out.push(`<h1>${m[1]}</h1>`);
      continue;
    }
    if ((m = line.match(/^[-*]\s+(.+)$/))) {
      flushPara();
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      let item = m[1].replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      item = item.replace(/\*(.+?)\*/g, "<em>$1</em>");
      out.push(`<li>${item}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line);
  }
  flushPara();
  closeList();
  return out.join("\n");
}
