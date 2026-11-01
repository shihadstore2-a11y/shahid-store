import { normalizePhoneNumber } from "./whatsapp-phone";

export type WhatsappTemplate =
  | "confirmation"
  | "credentials"
  | "delay"
  | "follow_up"
  | "abandoned_recovery"
  | "abandoned_discount"
  | "review_request"
  | "custom";

export const WHATSAPP_TEMPLATE_LABELS: Record<WhatsappTemplate, string> = {
  confirmation: "تأكيد الدفع",
  credentials: "تسليم الاشتراك",
  delay: "إشعار تأخير",
  follow_up: "متابعة",
  abandoned_recovery: "استعادة السلة (مساعدة)",
  abandoned_discount: "استعادة السلة (عرض خصم)",
  review_request: "طلب تقييم الخدمة",
  custom: "رسالة مخصّصة",
};

export type WhatsappTemplateData = {
  customer_name: string;
  product_name?: string;
  product_slug?: string;
  order_number?: string;
  total?: number;
  username?: string;
  password?: string;
  url?: string;
  custom_text?: string;
  time_estimate?: string;
  discount_code?: string;
  discount_percent?: number;
};

const STORE_SIGN = "فريق ديوان البث 🌟";
const STORE_URL = process.env.STORE_URL || "https://ksa-tv.com";

function fmtSAR(n?: number): string {
  if (typeof n !== "number" || !isFinite(n)) return "";
  return `${n} ر.س`;
}

/**
 * يعيد رابط الصورة المرفقة بالقالب عند إرسالها للعميل
 */
export function getWhatsappTemplateImage(
  template: WhatsappTemplate,
  customImageUrl?: string,
): string | undefined {
  if (customImageUrl && customImageUrl.startsWith("http")) return customImageUrl;
  switch (template) {
    case "confirmation":
      return "https://ksa-tv.com/images/new-order.png";
    case "abandoned_recovery":
    case "abandoned_discount":
      return "https://ksa-tv.com/images/abandoned-orders.png";
    case "review_request":
      return "https://ksa-tv.com/images/review-banner.png";
    default:
      return undefined;
  }
}

export function buildOrderMessage(
  template: WhatsappTemplate,
  data: WhatsappTemplateData,
): string {
  const name = (data.customer_name || "عميلنا الكريم").trim();
  const eta = data.time_estimate?.trim() || "15-30 دقيقة";

  switch (template) {
    case "confirmation": {
      const trackUrl = data.order_number
        ? `${STORE_URL}/track-order?orderNumber=${encodeURIComponent(data.order_number)}`
        : `${STORE_URL}/track-order`;
      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        "تم تأكيد الدفع بنجاح في متجر ديوان البث ✅",
      ];
      if (data.order_number) lines.push(`📦 *رقم الطلب:* #${data.order_number}`);
      if (data.product_name) lines.push(`🛒 *المنتج:* ${data.product_name}`);
      if (typeof data.total === "number") lines.push(`💰 *المبلغ:* ${fmtSAR(data.total)}`);
      lines.push("");
      lines.push(`سنبدأ بتجهيز اشتراكك وإرساله فوراً خلال ${eta}.`);
      lines.push(`📘 لمتابعة حالة الطلب: ${trackUrl}`);
      lines.push("");
      lines.push("شكراً لثقتك بـ ديوان البث 🌟");
      return lines.join("\n");
    }

    case "credentials": {
      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        "تم تجهيز اشتراكك بنجاح في ديوان البث ✅",
      ];
      if (data.order_number) lines.push(`📦 *رقم الطلب:* #${data.order_number}`);
      if (data.product_name) lines.push(`🛒 *المنتج:* ${data.product_name}`);
      lines.push("");
      lines.push("بيانات الإشتراك:");
      if (data.username) lines.push(`🔑 *اسم المستخدم / الكود:* ${data.username}`);
      if (data.password) lines.push(`🔐 *كلمة المرور:* ${data.password}`);
      if (data.url) lines.push(`🔗 *الرابط:* ${data.url}`);
      lines.push("");
      lines.push(`📘 *دليل التفعيل والاستخدام:* ${STORE_URL}/activation-guide`);
      lines.push("");
      lines.push("إذا كان لديك أي استفسار أو احتجت مساعدة، يسعدنا الرد عليك هنا في أي وقت 💬");
      lines.push(STORE_SIGN);
      return lines.join("\n");
    }

    case "delay": {
      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        `نعتذر منك — الطلب${data.order_number ? ` #${data.order_number}` : ""} يحتاج وقتاً إضافياً للتجهيز.`,
        `⏰ الوقت المتوقّع: ${eta}`,
        "",
        "شكراً لصبرك وتفهمك 🙏",
        STORE_SIGN,
      ];
      return lines.join("\n");
    }

    case "follow_up": {
      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        `نتابع معك بخصوص الطلب${data.order_number ? ` #${data.order_number}` : ""}.`,
        "هل كل شيء يعمل معك بشكل سليم وممتاز؟",
        "",
        `في خدمتك دائماً 💬 — ${STORE_SIGN}`,
      ];
      return lines.join("\n");
    }

    case "abandoned_recovery":
    case "abandoned_discount": {
      const code = (data.discount_code?.trim() || "DIWAN10").toUpperCase();
      const pct = data.discount_percent ?? 10;
      const url =
        data.url ||
        (data.product_slug
          ? `${STORE_URL}/checkout/${data.product_slug}`
          : `${STORE_URL}/checkout`);

      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        "لاحظنا أنك بدأت طلب اشتراك في متجر ديوان البث ولم تتمكن من إكمال الدفع.",
      ];
      if (data.product_name) lines.push(`🛒 *المنتج:* ${data.product_name}`);
      if (typeof data.total === "number") lines.push(`💰 *المبلغ:* ${fmtSAR(data.total)}`);
      lines.push("");
      lines.push("ولأنك غالي علينا 🫶🏻");
      lines.push(`هذا كود خصم ${pct}٪ لك وللي يعز عليك `);
      lines.push(`الكود هو : *${code}*`);
      lines.push("أكمل طلبك الآن واستفد من الخصم الحصري");
      lines.push("");
      lines.push(`🔗 رابط المتجر: ${url}`);
      lines.push("");
      lines.push("نحن هنا لمساعدتك في أي وقت 💬");
      lines.push(STORE_SIGN);
      return lines.join("\n");
    }

    case "review_request": {
      const productUrl = data.product_slug
        ? `${STORE_URL}/products/${data.product_slug}#reviews`
        : data.order_number
          ? `${STORE_URL}/reviews?order=${encodeURIComponent(data.order_number)}`
          : `${STORE_URL}/reviews`;

      const lines = [
        `مرحباً بك ${name} 🌟`,
        "",
        data.product_name
          ? `نتمنى أن تكون تجربتك مع اشتراك *(${data.product_name})* ممتازة وتليق بتطلعاتك!`
          : "نتمنى أن تكون تجربتك مع اشتراكك تجربة ممتازة وتليق بتطلعاتك!",
        "",
        "رأيك وملاحظاتك تهمنا كثيراً وتساعدنا على تطوير خدماتنا باستمرار.",
        "يسعدنا ويشرفنا مشاركتنا تقييمك للاشتراك عبر الرابط المباشر للمنتج:",
        `⭐ ${productUrl}`,
        "",
        "شكراً لاختيارك ديوان البث، ونحن في خدمتك دائماً في أي وقت 👋",
        STORE_SIGN,
      ];
      return lines.join("\n");
    }

    case "custom": {
      const body = (data.custom_text || "").trim();
      if (!body) return `السلام عليكم ${name} 👋\n\n…\n\n${STORE_SIGN}`;
      return body;
    }
  }
}

/** يبني رابط wa.me من رقم العميل + الرسالة. */
export function buildWhatsappLink(phone: string, message: string): string {
  const n = normalizePhoneNumber(phone);
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_MAX_LEN = 4096;
