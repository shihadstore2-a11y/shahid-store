import { createFileRoute } from "@tanstack/react-router";
import { ArticlesPage } from "@/components/admin/articles/ArticlesPage";

export const Route = createFileRoute("/_admin/admin/articles")({
  head: () => ({
    meta: [
      { title: "إدارة المقالات — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ArticlesPage,
});
