import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { STORE_ID } from "./store-config";

// نوع بيانات التقييم
export type ProductReviewItem = {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  product_name: string;
  customer_city?: string | null;
  is_verified: boolean;
  created_at: string;
};

export type ProductReviewsSummary = {
  reviews: ProductReviewItem[];
  totalCount: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
};

export type ReviewEligibilityResult =
  | { status: "not_logged_in" }
  | { status: "not_purchased" }
  | { status: "already_reviewed"; existingReview: ProductReviewItem }
  | { status: "eligible"; customerName: string; orderNumber?: string };

// تنظيف التعليق من أي بيانات تتبع داخلية
export function cleanReviewComment(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!--\s*uid:[^>]*-->/gi, "")
    .replace(/uid:[a-f0-9-]{36}/gi, "")
    .trim();
}

/**
 * توحيد ومعالجة النصوص العربية
 */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // إزالة التشكيل
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * خريطة منتجات متجر ديوان البث ومطابقتها
 */
export const SHAHID_PRODUCTS_MAP: Record<string, { exactDbNames: string[]; keywords: string[] }> = {
  "falcon-1y": {
    exactDbNames: [
      "فالكون برو — سنة كاملة",
      "اشتراك فالكون سنة",
      "فالكون سنة",
      "فالكون برو سنة",
    ],
    keywords: ["فالكون", "سنة", "falcon"],
  },
  "falcon-1y-2dev": {
    exactDbNames: [
      "فالكون برو — سنة | جهازان",
      "فالكون سنة جهازين",
      "فالكون برو شاشتين",
    ],
    keywords: ["فالكون", "جهازان", "جهازين", "شاشتين"],
  },
  "falcon-6m": {
    exactDbNames: [
      "اشتراك فالكون 6 أشهر",
      "فالكون 6 أشهر",
      "فالكون 6 شهور",
    ],
    keywords: ["فالكون", "6"],
  },
  "falcon-3m": {
    exactDbNames: [
      "فالكون برو — 3 أشهر",
      "فالكون 3 أشهر",
      "فالكون 3 شهور",
    ],
    keywords: ["فالكون", "3"],
  },
  "falcon-1m": {
    exactDbNames: [
      "فالكون برو — شهر واحد",
      "فالكون شهر",
    ],
    keywords: ["فالكون", "شهر"],
  },
  "hulk-1y": {
    exactDbNames: [
      "هولك بلاير — سنة كاملة",
      "اشتراك هولك سنة",
      "هولك سنة",
      "هولك بلاير سنة",
    ],
    keywords: ["هولك", "سنة", "hulk"],
  },
  "hulk-1y-2dev": {
    exactDbNames: [
      "هولك بلاير — سنة | جهازان",
      "هولك سنة جهازين",
      "هولك بلاير جهازين",
    ],
    keywords: ["هولك", "جهازان", "جهازين", "شاشتين"],
  },
  "hulk-6m": {
    exactDbNames: [
      "هولك بلاير — 6 أشهر",
      "هولك 6 أشهر",
      "هولك 6 شهور",
    ],
    keywords: ["هولك", "6"],
  },
  "hulk-3m": {
    exactDbNames: [
      "هولك بلاير — 3 أشهر",
      "هولك 3 أشهر",
      "هولك 3 شهور",
    ],
    keywords: ["هولك", "3"],
  },
  "hulk-1m": {
    exactDbNames: [
      "هولك بلاير — شهر واحد",
      "هولك شهر",
    ],
    keywords: ["هولك", "شهر"],
  },
  "smarters-1y-plus-3": {
    exactDbNames: [
      "سمارترز برو — سنة + 3 أشهر",
      "اشتراك سمارترز 15 شهر",
      "سمارترز سنة + 3",
      "سمارترز برو 15 شهر",
    ],
    keywords: ["سمارترز", "smarters"],
  },
  "smarters-1y-plus-3-solo": {
    exactDbNames: [
      "سمارترز برو — سنة + 3 أشهر (شاشة واحدة)",
      "سمارترز برو شاشة واحدة",
      "سمارترز شاشة واحدة",
    ],
    keywords: ["سمارترز", "شاشة واحدة"],
  },
  "bundle-falcon-hulk-1y": {
    exactDbNames: [
      "الباقة الذهبية السنوية (فالكون + هولك)",
      "الباقة الذهبية السنوية",
      "عرض فالكون وهولك",
      "الباقة المزدوجة",
    ],
    keywords: ["الذهبية", "فالكون + هولك", "هولك + فالكون"],
  },
};

/**
 * مطابقة التقييم مع المنتج المحدد
 */
export function matchReviewToProduct(
  reviewProductLabel: string,
  targetProductName: string,
  targetProductSlug?: string
): boolean {
  if (!reviewProductLabel) return false;
  const normReview = normalizeArabic(reviewProductLabel);
  const normTarget = normalizeArabic(targetProductName);

  if (normReview === normTarget) return true;

  if (targetProductSlug && SHAHID_PRODUCTS_MAP[targetProductSlug]) {
    const map = SHAHID_PRODUCTS_MAP[targetProductSlug];
    if (map.exactDbNames.some((n) => normalizeArabic(n) === normReview)) return true;
    if (map.exactDbNames.some((n) => normReview.includes(normalizeArabic(n)))) return true;
  }

  if (normReview.includes(normTarget) || normTarget.includes(normReview)) return true;

  return false;
}

const GetProductReviewsSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1),
  productSlug: z.string().optional(),
});

/**
 * جلب جميع التقييمات المعتمدة لمنتج معين
 */
export const getProductReviews = createServerFn({ method: "POST" })
  .validator((input: unknown) => GetProductReviewsSchema.parse(input))
  .handler(async ({ data }): Promise<ProductReviewsSummary> => {
    const { productName, productSlug } = data;

    // جلب التقييمات النشطة للمتجر
    const { data: rows, error } = await supabaseAdmin
      .from("store_reviews")
      .select("id, author_name, customer_name, rating, comment_ar, review_text, product_label, customer_city, is_active, is_approved, created_at")
      .eq("store_id", STORE_ID)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("[getProductReviews] Error fetching reviews:", error?.message);
    }

    const allRows = rows || [];

    // مطابقة التقييمات التابعة للمنتج
    let matched = allRows.filter((r: any) => {
      const pLabel = r.product_label || "";
      return matchReviewToProduct(pLabel, productName, productSlug);
    });

    // إذا لم تكن هناك تقييمات مطابقة بالاسم الدقيق، نبحث بالمجموعة (فالكون، هولك، سمارترز، أو الباقة الذهبية)
    if (matched.length === 0) {
      const normTarget = normalizeArabic(productName);
      matched = allRows.filter((r: any) => {
        const pLabel = normalizeArabic(r.product_label || "");
        if (normTarget.includes("فالكون") && pLabel.includes("فالكون")) return true;
        if (normTarget.includes("هولك") && pLabel.includes("هولك")) return true;
        if (normTarget.includes("سمارترز") && pLabel.includes("سمارترز")) return true;
        if (normTarget.includes("ذهبي") && (pLabel.includes("ذهب") || pLabel.includes("فالكون"))) return true;
        return false;
      });
    }

    const reviews: ProductReviewItem[] = matched.map((r: any) => ({
      id: String(r.id),
      author_name: String(r.author_name || r.customer_name || "عميل موثق"),
      rating: Math.min(5, Math.max(1, Number(r.rating || 5))),
      comment: cleanReviewComment(String(r.comment_ar || r.review_text || "")),
      product_name: String(r.product_label || productName),
      customer_city: r.customer_city || null,
      is_verified: true,
      created_at: String(r.created_at || new Date().toISOString()),
    }));

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      const star = r.rating as 1 | 2 | 3 | 4 | 5;
      if (distribution[star] !== undefined) {
        distribution[star] += 1;
      }
      sum += r.rating;
    });

    const totalCount = reviews.length;
    const averageRating = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 5;

    return {
      reviews,
      totalCount,
      averageRating,
      ratingDistribution: distribution,
    };
  });

const CheckEligibilitySchema = z.object({
  productName: z.string().min(1),
  productSlug: z.string().min(1),
  productId: z.string().optional(),
  userId: z.string().optional().nullable(),
  userEmail: z.string().optional().nullable(),
  userPhone: z.string().optional().nullable(),
  userName: z.string().optional().nullable(),
});

/**
 * التحقق من أحقية العميل في تقييم المنتج
 */
export const checkReviewEligibility = createServerFn({ method: "POST" })
  .validator((input: unknown) => CheckEligibilitySchema.parse(input))
  .handler(async ({ data }): Promise<ReviewEligibilityResult> => {
    const { productName, productSlug, productId, userId, userEmail, userPhone, userName } = data;

    const cleanUserId = userId ? String(userId).trim() : null;
    const cleanEmail = userEmail ? String(userEmail).toLowerCase().trim() : null;
    const cleanPhone = userPhone ? String(userPhone).replace(/\D/g, "") : "";

    // 1. إذا لم يكن المستخدم مسجلاً
    if (!cleanUserId && !cleanEmail && !cleanPhone) {
      return { status: "not_logged_in" };
    }

    // 2. فحص ما إذا كان قد قيّم هذا المنتج مسبقاً
    const { data: existingReviews } = await supabaseAdmin
      .from("store_reviews")
      .select("id, author_name, customer_name, rating, comment_ar, review_text, product_label, customer_city, created_at")
      .eq("store_id", STORE_ID);

    if (existingReviews && existingReviews.length > 0) {
      const userAlreadyReviewed = existingReviews.find((r: any) => {
        const comment = String(r.comment_ar || r.review_text || "");
        // فحص المعرف المخفي
        if (cleanUserId && comment.includes(`uid:${cleanUserId}`)) {
          return true;
        }
        // أو فحص الاسم والمنتج
        const author = r.author_name || r.customer_name;
        if (
          userName &&
          author === userName &&
          matchReviewToProduct(r.product_label || "", productName, productSlug)
        ) {
          return true;
        }
        return false;
      });

      if (userAlreadyReviewed) {
        return {
          status: "already_reviewed",
          existingReview: {
            id: String(userAlreadyReviewed.id),
            author_name: String(userAlreadyReviewed.author_name || userAlreadyReviewed.customer_name || "عميل موثق"),
            rating: Number(userAlreadyReviewed.rating || 5),
            comment: cleanReviewComment(String(userAlreadyReviewed.comment_ar || userAlreadyReviewed.review_text || "")),
            product_name: String(userAlreadyReviewed.product_label || productName),
            customer_city: userAlreadyReviewed.customer_city || null,
            is_verified: true,
            created_at: String(userAlreadyReviewed.created_at || new Date().toISOString()),
          },
        };
      }
    }

    // 3. البحث في الطلبات عن شراء موثق لهذا المنتج
    let q = supabaseAdmin
      .from("orders")
      .select("id, order_number, status, items, notes, user_id, customer_email, customer_phone, customer_name")
      .eq("store_id", STORE_ID);

    const conditions: string[] = [];
    if (cleanUserId) conditions.push(`user_id.eq.${cleanUserId}`);
    if (cleanEmail) conditions.push(`customer_email.ilike.${cleanEmail}`);
    if (cleanPhone.length >= 9) {
      conditions.push(`customer_phone.ilike.%${cleanPhone.slice(-9)}%`);
    }

    if (conditions.length === 0) {
      return { status: "not_purchased" };
    }

    q = q.or(conditions.join(","));
    const { data: userOrders, error: orderErr } = await q;

    if (orderErr || !userOrders || userOrders.length === 0) {
      return { status: "not_purchased" };
    }

    // التحقق من حالة الطلب وأن المنتج متضمن في الطلب
    const successfulStatuses = ["completed", "fulfilled", "delivered", "paid"];

    const matchingOrder = userOrders.find((order: any) => {
      const status = String(order.status || "").toLowerCase();
      const isCompleted =
        successfulStatuses.includes(status) ||
        (order.notes && typeof order.notes === "string" && order.notes.includes("subscription_"));

      if (!isCompleted) return false;

      // فحص المنتجات داخل الطلب
      const items = Array.isArray(order.items) ? order.items : [];

      return items.some((it: any) => {
        if (!it) return false;
        if (productId && (it.product_id === productId || it.id === productId)) return true;
        if (productSlug && (it.product_slug === productSlug || it.slug === productSlug)) return true;

        const itName = (it.product_name || it.name_ar || it.title || "").toLowerCase();
        const targetName = productName.toLowerCase();

        if (itName && (itName.includes(targetName) || targetName.includes(itName))) return true;

        if (targetName.includes("فالكون") && itName.includes("فالكون")) return true;
        if (targetName.includes("هولك") && itName.includes("هولك")) return true;
        if (targetName.includes("سمارترز") && itName.includes("سمارترز")) return true;

        return false;
      });
    });

    if (!matchingOrder) {
      return { status: "not_purchased" };
    }

    const customerName =
      userName ||
      matchingOrder.customer_name ||
      cleanEmail?.split("@")[0] ||
      "عميل موثق";

    return {
      status: "eligible",
      customerName,
      orderNumber: matchingOrder.order_number,
    };
  });

const SubmitReviewSchema = z.object({
  productName: z.string().min(1, "اسم المنتج مطلوب"),
  productSlug: z.string().min(1, "رابط المنتج مطلوب"),
  productId: z.string().optional(),
  rating: z.number().int().min(1, "يرجى اختيار التقييم بالنجوم").max(5),
  comment: z
    .string()
    .trim()
    .min(3, "نص التقييم يجب ألا يقل عن 3 أحرف")
    .max(500, "نص التقييم طويل جداً (الحد الأقصى 500 حرف)"),
  customerName: z.string().optional(),
  customerCity: z.string().optional(),
  userId: z.string().optional().nullable(),
  userEmail: z.string().optional().nullable(),
  userPhone: z.string().optional().nullable(),
});

/**
 * إرسال تقييم حقيقي للمنتج بعد التحقق الأمني في الخادم
 */
export const submitProductReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const res = SubmitReviewSchema.safeParse(input);
    if (!res.success) {
      const firstIssue = res.error.issues[0];
      throw new Error(firstIssue?.message || "يرجى كتابة نص تقييم لا يقل عن 3 أحرف");
    }
    return res.data;
  })
  .handler(async ({ data }) => {
    const { productName, productSlug, productId, rating, comment, customerName, customerCity, userId, userEmail, userPhone } = data;

    // 1. إعادة التحقق الأمني من الخادم
    const eligibility = await checkReviewEligibility({
      data: {
        productName,
        productSlug,
        productId,
        userId,
        userEmail,
        userPhone,
        userName: customerName,
      },
    });

    if (eligibility.status === "not_logged_in") {
      throw new Error("يجب تسجيل الدخول أولاً لإمكانية التقييم");
    }

    if (eligibility.status === "not_purchased") {
      throw new Error("عذراً، كتابة التقييم مقتصرة حصرياً على العملاء الذين اشتروا هذه الخدمة");
    }

    if (eligibility.status === "already_reviewed") {
      throw new Error("لقد قمت بتقييم هذه الخدمة مسبقاً، شكراً لمشاركتك");
    }

    const cleanUserId = userId ? String(userId).trim() : null;
    const finalAuthorName = customerName || eligibility.customerName || "عميل موثق";
    const taggedComment = cleanUserId ? `${comment.trim()}\n<!-- uid:${cleanUserId} -->` : comment.trim();

    // فحص إعداد النشر التلقائي للتقييمات من إعدادات المتجر (الافتراضي هو إخفاء التقييم للمراجعة)
    let autoPublish = false;
    try {
      const { data: settingRow } = await supabaseAdmin
        .from("store_settings")
        .select("value")
        .eq("store_id", STORE_ID)
        .eq("key", "reviews_settings")
        .maybeSingle();

      if (settingRow?.value) {
        const parsed = typeof settingRow.value === "string" ? JSON.parse(settingRow.value) : settingRow.value;
        if (typeof parsed?.auto_publish === "boolean") {
          autoPublish = parsed.auto_publish;
        }
      }
    } catch (e) {
      console.warn("[submitProductReview] Failed to read auto_publish setting, defaulting to false:", e);
    }

    // 2. الحفظ في جدول store_reviews
    const insertPayload: Record<string, any> = {
      store_id: STORE_ID,
      author_name: finalAuthorName,
      customer_name: finalAuthorName,
      customer_city: customerCity || "الرياض",
      rating,
      comment_ar: taggedComment,
      review_text: taggedComment,
      product_label: productName,
      is_active: autoPublish,
      is_approved: autoPublish,
      display_order: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("store_reviews")
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr || !inserted) {
      console.error("[submitProductReview] Error inserting review:", insertErr);
      throw new Error("تعذر حفظ التقييم، يرجى المحاولة مرة أخرى");
    }

    return {
      success: true,
      autoPublished: autoPublish,
      message: autoPublish
        ? "تم إرسال تقييمك ونشره بنجاح! ⭐️"
        : "شكراً لتقييمك! تم استلام التقييم بنجاح وسيظهر في المتجر بعد مراجعة الإدارة ✨",
      review: {
        id: String(inserted.id),
        author_name: String(inserted.author_name || inserted.customer_name),
        rating: Number(inserted.rating),
        comment: cleanReviewComment(String(inserted.comment_ar || inserted.review_text)),
        product_name: String(inserted.product_label),
        customer_city: inserted.customer_city,
        is_verified: true,
        created_at: String(inserted.created_at),
      },
    };
  });

