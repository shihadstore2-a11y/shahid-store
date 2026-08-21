import { normalizePhoneNumber } from "./whatsapp-phone";

export type WhatsappTemplate =
  | "confirmation"
  | "credentials"
  | "delay"
  | "follow_up"
  | "custom";

export const WHATSAPP_TEMPLATE_LABELS: Record<WhatsappTemplate, string> = {
  confirmation: "تأكيد الدفع",
  credentials: "تسليم الاشتراك",
  delay: "إشعار تأخير",
  follow_up: "متابعة",
  custom: "رسالة مخصّصة",
};

export type WhatsappTemplateData = {
  customer_name: string;
  product_name?: string;
  order_number?: string;
  total?: number;
  username?: string;
  password?: string;
  url?: string;
  custom_text?: string;
  time_estimate?: string;
};

const STORE_SIGN = "فريق شاهد ستور 🌟";

function fmtSAR(n?: number): string {
  if (typeof n !== "number" || !isFinite(n)) return "";
  return n.toLocaleString("ar-SA", { maximumFractionDigits: 2 }) + " ر.س";
}

export function buildOrderMessage(
  template: WhatsappTemplate,
  data: WhatsappTemplateData,
): string {
  const name = (data.customer_name || "عميلنا الكريم").trim();
  const eta = data.time_estimate?.trim() || "15-30 دقيقة";

  switch (template) {
    case "confirmation": {
      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        "تم استلام دفعتك بنجاح ✅",
        "",
      ];
      if (data.order_number) lines.push(`📦 الطلب: #${data.order_number}`);
      if (data.product_name) lines.push(`🛒 المنتج: ${data.product_name}`);
      if (typeof data.total === "number") lines.push(`💰 المبلغ: ${fmtSAR(data.total)}`);
      lines.push("");
      lines.push(`سنبدأ بتجهيز اشتراكك خلال ${eta}.`);
      lines.push("شكراً لثقتك بـ شاهد ستور 🌟");
      return lines.join("\n");
    }

    case "credentials": {
      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        "تم تجهيز اشتراكك ✅",
        "",
      ];
      if (data.product_name) lines.push(`🛒 ${data.product_name}`);
      if (data.username) lines.push(`🔑 اسم المستخدم: ${data.username}`);
      if (data.password) lines.push(`🔐 كلمة المرور: ${data.password}`);
      if (data.url) lines.push(`🔗 الرابط: ${data.url}`);
      lines.push("");
      lines.push("📘 دليل التفعيل: shahidstore.net/activation-guide");
      lines.push("");
      lines.push("للدعم: راسلنا في أي وقت 💬");
      lines.push(STORE_SIGN);
      return lines.join("\n");
    }

    case "delay": {
      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        `نعتذر — الطلب${data.order_number ? ` #${data.order_number}` : ""} يحتاج وقتاً إضافياً.`,
        `⏰ الوقت المتوقّع: ${eta}`,
        "",
        "شكراً لصبرك 🙏",
        STORE_SIGN,
      ];
      return lines.join("\n");
    }

    case "follow_up": {
      const lines = [
        `السلام عليكم ${name} 👋`,
        "",
        `نتابع معك بخصوص الطلب${data.order_number ? ` #${data.order_number}` : ""}.`,
        "هل كل شيء يعمل بشكل سليم؟",
        "",
        `في خدمتك 💬 — ${STORE_SIGN}`,
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
