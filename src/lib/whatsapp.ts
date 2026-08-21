import { useEffect, useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fallback نهائي — يضمن أن الموقع لا ينكسر لو فشل DB
export const WHATSAPP_NUMBER = "966500451602";
export const WHATSAPP_CHANNEL =
  "https://www.whatsapp.com/channel/0029ValAr2UADTOEDz1RAB2V";
export const TELEGRAM_URL = "https://t.me/+TuJE0FyqUpgyOTA0";

/**
 * يبني رابط واتساب مُحسَّن حسب الجهاز:
 * - على الموبايل: wa.me (يفتح التطبيق مباشرة)
 * - على الديسكتوب: web.whatsapp.com/send (يتفادى تحويلات api.whatsapp.com
 *   التي تحجبها بعض الإضافات / DNS Filters / Edge Strict Tracking)
 * يعمل بأمان أثناء SSR (يعود لـ wa.me كافتراضي).
 */
type WhatsAppLinkTarget = "auto" | "mobile" | "desktop";

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);
}

export function whatsappLink(
  message?: string,
  number?: string,
  target: WhatsAppLinkTarget = "auto",
): string {
  const n = number || WHATSAPP_NUMBER;
  const text = message ? `&text=${encodeURIComponent(message)}` : "";
  const textShort = message ? `?text=${encodeURIComponent(message)}` : "";

  if (target === "mobile") {
    return `https://wa.me/${n}${textShort}`;
  }

  if (target === "desktop") {
    return `https://web.whatsapp.com/send?phone=${n}${text}`;
  }

  // SSR-safe: لو ما في window نستخدم wa.me حتى لا يحدث اختلاف Hydration بين السيرفر والعميل.
  if (typeof window === "undefined" || isMobileUserAgent()) {
    return `https://wa.me/${n}${textShort}`;
  }

  // ديسكتوب: web.whatsapp.com مباشرة — لا يمر بـ api.whatsapp.com
  return `https://web.whatsapp.com/send?phone=${n}${text}`;
}

export function buildOrderMessage(opts: {
  productName: string;
  durationLabel?: string;
  price?: number;
  productUrl?: string;
}): string {
  const lines = [
    "السلام عليكم 👋",
    "أرغب في طلب الباقة التالية:",
    "",
    `📦 الباقة: ${opts.productName}`,
  ];
  if (opts.durationLabel) lines.push(`⏳ المدة: ${opts.durationLabel}`);
  if (typeof opts.price === "number") lines.push(`💰 السعر: ${opts.price} ر.س`);
  if (opts.productUrl) {
    lines.push("");
    lines.push(`🔗 ${opts.productUrl}`);
  }
  lines.push("");
  lines.push("شكراً لكم 🌟");
  return lines.join("\n");
}

// ============= Phone validation =============

export type PhoneValidation =
  | { valid: true; cleaned: string }
  | { valid: false; cleaned: ""; error: string };

export function validateSaudiPhone(input: string): PhoneValidation {
  const cleaned = (input || "").replace(/[\s\-+()]/g, "");
  if (/^966[0-9]{9}$/.test(cleaned)) return { valid: true, cleaned };
  if (/^05[0-9]{8}$/.test(cleaned)) return { valid: true, cleaned: "966" + cleaned.substring(1) };
  if (/^5[0-9]{8}$/.test(cleaned)) return { valid: true, cleaned: "966" + cleaned };
  return {
    valid: false,
    cleaned: "",
    error: "رقم سعودي غير صحيح. مثال صحيح: 966500451602 أو 0500451602",
  };
}

export function formatPhoneForDisplay(phone: string): string {
  if (phone && phone.length === 12 && phone.startsWith("966")) {
    return `+966 ${phone.substring(3, 5)} ${phone.substring(5, 8)} ${phone.substring(8)}`;
  }
  return phone;
}

// ============= Store Settings query =============

export type StoreSettingsMap = Record<string, string | null>;

export const storeSettingsQueryOptions = () =>
  queryOptions({
    queryKey: ["store-settings"],
    queryFn: async (): Promise<StoreSettingsMap> => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("key, value");
      if (error) throw error;
      const map: StoreSettingsMap = {};
      (data ?? []).forEach((row) => {
        map[row.key] = row.value;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

export function useStoreSettings() {
  return useQuery(storeSettingsQueryOptions());
}

export function useWhatsappNumber(): string {
  const { data } = useStoreSettings();
  return data?.whatsapp_number || WHATSAPP_NUMBER;
}

export function useWhatsappLink(message?: string): string {
  const number = useWhatsappNumber();
  const [target, setTarget] = useState<WhatsAppLinkTarget>("mobile");

  useEffect(() => {
    setTarget(isMobileUserAgent() ? "mobile" : "desktop");
  }, []);

  return whatsappLink(message, number, target);
}
