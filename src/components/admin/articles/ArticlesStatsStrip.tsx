import { useMemo } from "react";
import { FileText, CheckCircle2, FileEdit, Eye } from "lucide-react";
import type { Article } from "@/lib/admin-articles";
import { computeArticlesStats } from "@/lib/admin-articles";

export function ArticlesStatsStrip({ articles }: { articles: Article[] }) {
  const s = useMemo(() => computeArticlesStats(articles), [articles]);
  const items = [
    { label: "إجمالي المقالات", value: s.total, Icon: FileText, color: "text-foreground" },
    { label: "منشور", value: s.published, Icon: CheckCircle2, color: "text-emerald-500" },
    { label: "مسودة", value: s.drafts, Icon: FileEdit, color: "text-amber-500" },
    { label: "إجمالي المشاهدات", value: s.totalViews, Icon: Eye, color: "text-accent" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(({ label, value, Icon, color }) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className={`h-4 w-4 ${color}`} />
            {label}
          </div>
          <div className="mt-2 text-2xl font-black">{value.toLocaleString("ar-SA")}</div>
        </div>
      ))}
    </div>
  );
}
