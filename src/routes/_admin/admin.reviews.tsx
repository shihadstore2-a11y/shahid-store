import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "@/components/admin/reviews/ReviewsPage";

export const Route = createFileRoute("/_admin/admin/reviews")({
  head: () => ({
    meta: [
      { title: "إدارة التقييمات — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReviewsPage,
});
