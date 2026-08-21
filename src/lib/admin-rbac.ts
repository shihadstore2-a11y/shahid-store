// Role-Based Access Control matrix لكل أدوار الإدارة في شاهد ستور
// + طبقة الصلاحيات الإضافية لكل حساب (permission_overrides) — إضافية فقط (OR)، لا تسحب أبداً.
import type { AdminRole } from "@/hooks/useAdminUser";

export type AdminRoute =
  | "dashboard"
  | "orders"
  | "products"
  | "coupons"
  | "customers"
  | "reports"
  | "settings"
  | "users"
  | "activation-guide"
  | "articles"
  | "reviews"
  | "accounting-costs"
  | "accounting-expenses"
  | "accounting-reports"
  | "accounting-periods"
  | "inventory";

type Perms = {
  canAccessRoutes: AdminRoute[];
  canModifyProducts: boolean;
  canModifyCoupons: boolean;
  canModifyOrders: boolean;
  canFulfillOrders: boolean;
  canManageUsers: boolean;
  canModifySettings: boolean;
  canModifyActivationGuide: boolean;
  canModifyReviews: boolean;
  canModifyArticles: boolean;
  canManageInventory: boolean;
};

export type PermAction = Exclude<keyof Perms, "canAccessRoutes">;

export const ROLE_PERMISSIONS: Record<AdminRole, Perms> = {
  super_admin: {
    canAccessRoutes: [
      "dashboard", "orders", "products", "coupons", "customers",
      "reports", "settings", "users", "activation-guide", "articles", "reviews",
      "accounting-costs", "accounting-expenses", "accounting-reports", "accounting-periods",
      "inventory",
    ],
    canModifyProducts: true,
    canModifyCoupons: true,
    canModifyOrders: true,
    canFulfillOrders: true,
    canManageUsers: true,
    canModifySettings: true,
    canModifyActivationGuide: true,
    canModifyReviews: true,
    canModifyArticles: true,
    canManageInventory: true,
  },
  admin: {
    canAccessRoutes: [
      "dashboard", "orders", "products", "coupons", "customers",
      "reports", "activation-guide", "articles", "reviews",
      "accounting-costs", "accounting-expenses", "accounting-reports",
      "inventory",
    ],
    canModifyProducts: true,
    canModifyCoupons: true,
    canModifyOrders: true,
    canFulfillOrders: true,
    canManageUsers: false,
    canModifySettings: false,
    canModifyActivationGuide: true,
    canModifyReviews: true,
    canModifyArticles: true,
    canManageInventory: true,
  },
  staff: {
    canAccessRoutes: ["dashboard", "orders", "customers", "reports"],
    canModifyProducts: false,
    canModifyCoupons: false,
    canModifyOrders: false,
    canFulfillOrders: false,
    canManageUsers: false,
    canModifySettings: false,
    canModifyActivationGuide: false,
    canModifyReviews: false,
    canModifyArticles: false,
    canManageInventory: false,
  },
  developer: {
    canAccessRoutes: [
      "dashboard", "orders", "products", "coupons", "customers",
      "reports", "settings", "activation-guide", "articles", "reviews",
      "accounting-reports",
      "inventory",
    ],
    canModifyProducts: true,
    canModifyCoupons: true,
    canModifyOrders: false,
    canFulfillOrders: false,
    canManageUsers: false,
    canModifySettings: true,
    canModifyActivationGuide: true,
    canModifyReviews: true,
    canModifyArticles: true,
    canManageInventory: false,
  },
  // مشاهد الطلبات والكوبونات: قراءة فقط بدون أي تعديل
  orders_coupons_viewer: {
    canAccessRoutes: ["dashboard", "orders", "coupons"],
    canModifyProducts: false,
    canModifyCoupons: false,
    canModifyOrders: false,
    canFulfillOrders: false,
    canManageUsers: false,
    canModifySettings: false,
    canModifyActivationGuide: false,
    canModifyReviews: false,
    canModifyArticles: false,
    canManageInventory: false,
  },
};

/* ============================================================
   طبقة الصلاحيات الإضافية لكل حساب (Additive Overrides)
   ============================================================ */

export type PermissionOverrides = {
  routes: AdminRoute[];
  actions: PermAction[];
};

export const EMPTY_OVERRIDES: PermissionOverrides = { routes: [], actions: [] };

// المسارات القابلة للمنح: كل المسارات عدا الحسّاسة (anti-escalation).
// users + settings مستثنيان بقرار المالك (Senior 16y).
const NON_GRANTABLE_ROUTES: AdminRoute[] = ["users", "settings"];

export const GRANTABLE_ROUTES: AdminRoute[] = (
  ROLE_PERMISSIONS.super_admin.canAccessRoutes
).filter((r) => !NON_GRANTABLE_ROUTES.includes(r));

// الأفعال القابلة للمنح: كل الأفعال عدا canManageUsers + canModifySettings.
const ALL_ACTIONS: PermAction[] = [
  "canModifyProducts",
  "canModifyCoupons",
  "canModifyOrders",
  "canFulfillOrders",
  "canManageUsers",
  "canModifySettings",
  "canModifyActivationGuide",
  "canModifyReviews",
  "canModifyArticles",
  "canManageInventory",
];

const NON_GRANTABLE_ACTIONS: PermAction[] = ["canManageUsers", "canModifySettings"];

export const GRANTABLE_ACTIONS: PermAction[] = ALL_ACTIONS.filter(
  (a) => !NON_GRANTABLE_ACTIONS.includes(a),
);

// الأدوار التي يسمح لها RLS فعلياً بكل فعل كتابة.
// can_modify_data = super_admin/admin/developer/staff (لا يشمل orders_coupons_viewer).
// is_admin = كل الأدوار الإدارية النشطة (الخمسة).
const CAN_MODIFY_DATA_ROLES: AdminRole[] = ["super_admin", "admin", "developer", "staff"];
const IS_ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "developer", "staff", "orders_coupons_viewer"];

export const ACTION_RLS_ROLES: Record<PermAction, AdminRole[]> = {
  canModifyProducts: CAN_MODIFY_DATA_ROLES,
  canModifyCoupons: CAN_MODIFY_DATA_ROLES,
  canModifyOrders: CAN_MODIFY_DATA_ROLES,
  canFulfillOrders: CAN_MODIFY_DATA_ROLES,
  canManageInventory: CAN_MODIFY_DATA_ROLES,
  canModifyActivationGuide: IS_ADMIN_ROLES,
  canModifyReviews: IS_ADMIN_ROLES,
  canModifyArticles: IS_ADMIN_ROLES,
  // المستثناة من المنح (لاكتمال النوع فقط)
  canManageUsers: ["super_admin"],
  canModifySettings: IS_ADMIN_ROLES,
};

/**
 * هل سيمرّ منح هذا الفعل لهذا الدور عبر RLS فعلياً؟
 * إن كان false → المنح بصري فقط ويرفضه قاعدة البيانات → يجب تنبيه المالك.
 */
export function actionEffectiveForRole(role: AdminRole, action: PermAction): boolean {
  return (ACTION_RLS_ROLES[action] ?? []).includes(role);
}

const ROUTE_SET = new Set<string>(ROLE_PERMISSIONS.super_admin.canAccessRoutes);
const GRANTABLE_ROUTE_SET = new Set<string>(GRANTABLE_ROUTES);
const GRANTABLE_ACTION_SET = new Set<string>(GRANTABLE_ACTIONS);

/**
 * قراءة دفاعية لقيمة permission_overrides القادمة من قاعدة البيانات (jsonb غير موثوق).
 * - يتجاهل أي مسار/فعل خارج القائمة القابلة للمنح (حتى لو خُزِّن يدوياً في DB).
 * - يُزيل التكرار والقيم غير المعروفة.
 */
export function parseOverrides(raw: unknown): PermissionOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_OVERRIDES;
  const obj = raw as Record<string, unknown>;

  const rawRoutes = Array.isArray(obj.routes) ? obj.routes : [];
  const rawActions = Array.isArray(obj.actions) ? obj.actions : [];

  const routes = Array.from(
    new Set(
      rawRoutes.filter(
        (r): r is AdminRoute => typeof r === "string" && GRANTABLE_ROUTE_SET.has(r),
      ),
    ),
  );
  const actions = Array.from(
    new Set(
      rawActions.filter(
        (a): a is PermAction => typeof a === "string" && GRANTABLE_ACTION_SET.has(a),
      ),
    ),
  );

  return { routes, actions };
}

export function hasPermission(
  role: AdminRole | null | undefined,
  perm: PermAction,
  overrides?: PermissionOverrides | null,
): boolean {
  if (!role) return false;
  if (ROLE_PERMISSIONS[role][perm]) return true;
  // OR merge: منح إضافي (لا يشمل الأفعال المستثناة لأن parseOverrides يُزيلها)
  return Boolean(overrides?.actions.includes(perm));
}

export function canAccessRoute(
  role: AdminRole | null | undefined,
  route: AdminRoute,
  overrides?: PermissionOverrides | null,
): boolean {
  if (!role) return false;
  if (ROLE_PERMISSIONS[role].canAccessRoutes.includes(route)) return true;
  // OR merge: منح إضافي للمسار (لا يشمل users/settings لأن parseOverrides يُزيلها)
  return Boolean(overrides?.routes.includes(route));
}

export const ROLE_LABEL_AR: Record<AdminRole, string> = {
  super_admin: "المشرف العام",
  admin: "المدير",
  staff: "الموظف",
  developer: "المطوّر",
  orders_coupons_viewer: "مشاهد طلبات وكوبونات",
};

export const ROUTE_LABEL_AR: Record<AdminRoute, string> = {
  dashboard: "لوحة التحكم",
  orders: "الطلبات",
  products: "المنتجات",
  coupons: "الكوبونات",
  customers: "العملاء",
  reports: "التقارير",
  settings: "الإعدادات",
  users: "إدارة المستخدمين",
  "activation-guide": "دليل التفعيل",
  articles: "المقالات",
  reviews: "التقييمات",
  "accounting-costs": "المحاسبة — التكاليف",
  "accounting-expenses": "المحاسبة — المصاريف",
  "accounting-reports": "المحاسبة — التقارير المالية",
  "accounting-periods": "المحاسبة — الإقفال الشهري",
  inventory: "إدارة المخزون",
};

export const ACTION_LABEL_AR: Record<PermAction, string> = {
  canModifyProducts: "تعديل المنتجات",
  canModifyCoupons: "تعديل الكوبونات",
  canModifyOrders: "تعديل الطلبات",
  canFulfillOrders: "تنفيذ الطلبات (تسليم الاشتراكات)",
  canManageUsers: "إدارة المستخدمين",
  canModifySettings: "تعديل إعدادات المتجر",
  canModifyActivationGuide: "تعديل دليل التفعيل",
  canModifyReviews: "تعديل التقييمات",
  canModifyArticles: "تعديل المقالات",
  canManageInventory: "إدارة المخزون",
};

/** ربط مسار URL بـ AdminRoute (يدعم المسارات الفرعية مثل accounting/*). */
export function routeFromPathname(pathname: string): AdminRoute | null {
  // إزالة الشرطة النهائية
  const p = pathname.replace(/\/+$/, "");
  // مطابقات خاصة بالمسارات الفرعية
  if (p.startsWith("/admin/accounting/costs")) return "accounting-costs";
  if (p.startsWith("/admin/accounting/expenses")) return "accounting-expenses";
  if (p.startsWith("/admin/accounting/reports")) return "accounting-reports";
  if (p.startsWith("/admin/accounting/periods")) return "accounting-periods";
  if (p.startsWith("/admin/activation-guide")) return "activation-guide";
  if (p.startsWith("/admin/inventory")) return "inventory";

  const seg = p.replace(/^\/admin\//, "").split("/")[0];
  if (ROUTE_SET.has(seg)) return seg as AdminRoute;
  return null;
}

/** المسارات المعفاة من حارس RequireAccess (ليست أجزاء صلاحيات). */
export const ACCESS_EXEMPT_PATHS = ["/admin/profile", "/admin/login"];
