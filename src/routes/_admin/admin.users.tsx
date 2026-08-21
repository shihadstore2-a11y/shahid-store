import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/components/admin/users/AdminUsersPage";

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({
    meta: [
      { title: "إدارة المستخدمين — إدارة شاهد" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsersPage,
});
