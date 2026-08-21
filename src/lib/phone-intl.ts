/**
 * J.1 — Phone Lite Global helpers (E.164 single source of truth).
 *
 * Storage format everywhere (DB, RPCs, server fns): E.164 with leading +
 *   مثال: +966512345678
 *
 * Legacy compatibility: Saudi local "05XXXXXXXX" is still accepted by RLS,
 * RPCs (get_email_by_phone / claim_orders_by_phone) and rate limiter — but
 * new writes must always be E.164.
 */
import { parsePhoneNumberFromString, AsYouType, type CountryCode } from "libphonenumber-js/min";

export type CountryEntry = {
  code: CountryCode;
  name: string;
  flag: string;
  dial: string;
};

/** Top picks first (Saudi default), then GCC, then commonly-requested countries. */
export const COUNTRIES: CountryEntry[] = [
  { code: "SA", name: "السعودية", flag: "🇸🇦", dial: "+966" },
  { code: "AE", name: "الإمارات", flag: "🇦🇪", dial: "+971" },
  { code: "KW", name: "الكويت", flag: "🇰🇼", dial: "+965" },
  { code: "BH", name: "البحرين", flag: "🇧🇭", dial: "+973" },
  { code: "QA", name: "قطر", flag: "🇶🇦", dial: "+974" },
  { code: "OM", name: "عُمان", flag: "🇴🇲", dial: "+968" },
  { code: "EG", name: "مصر", flag: "🇪🇬", dial: "+20" },
  { code: "JO", name: "الأردن", flag: "🇯🇴", dial: "+962" },
  { code: "IQ", name: "العراق", flag: "🇮🇶", dial: "+964" },
  { code: "LB", name: "لبنان", flag: "🇱🇧", dial: "+961" },
  { code: "SY", name: "سوريا", flag: "🇸🇾", dial: "+963" },
  { code: "YE", name: "اليمن", flag: "🇾🇪", dial: "+967" },
  { code: "PS", name: "فلسطين", flag: "🇵🇸", dial: "+970" },
  { code: "SD", name: "السودان", flag: "🇸🇩", dial: "+249" },
  { code: "LY", name: "ليبيا", flag: "🇱🇾", dial: "+218" },
  { code: "TN", name: "تونس", flag: "🇹🇳", dial: "+216" },
  { code: "DZ", name: "الجزائر", flag: "🇩🇿", dial: "+213" },
  { code: "MA", name: "المغرب", flag: "🇲🇦", dial: "+212" },
  { code: "TR", name: "تركيا", flag: "🇹🇷", dial: "+90" },
  { code: "GB", name: "المملكة المتحدة", flag: "🇬🇧", dial: "+44" },
  { code: "US", name: "الولايات المتحدة", flag: "🇺🇸", dial: "+1" },
];

export const DEFAULT_COUNTRY: CountryCode = "SA";

export function findCountry(code: CountryCode | string): CountryEntry {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Strict E.164 regex (matches DB constraint shape). */
export const E164_REGEX = /^\+[1-9][0-9]{6,14}$/;

/** Normalize ANY user input to strict E.164 (`+CCC...`) or return null. */
export function toE164(input: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  try {
    const parsed = parsePhoneNumberFromString(trimmed, country);
    if (parsed && parsed.isValid()) {
      const e164 = parsed.number;
      return E164_REGEX.test(e164) ? e164 : null;
    }
  } catch {
    /* fallthrough */
  }
  // Manual fallback: cleanup +/digits only
  const cleaned = "+" + trimmed.replace(/[^\d]/g, "");
  return E164_REGEX.test(cleaned) ? cleaned : null;
}

/** Returns true if value parses as a valid number for the chosen country. */
export function isValidPhone(input: string, country: CountryCode = DEFAULT_COUNTRY): boolean {
  if (!input) return false;
  try {
    const parsed = parsePhoneNumberFromString(input, country);
    return Boolean(parsed?.isValid());
  } catch {
    return false;
  }
}

/** AsYouType formatter for the display value (national format inside the country). */
export function formatAsYouType(input: string, country: CountryCode = DEFAULT_COUNTRY): string {
  try {
    const formatter = new AsYouType(country);
    return formatter.input(input);
  } catch {
    return input;
  }
}

/** Detect country from an existing E.164 string (best-effort). Falls back to default. */
export function detectCountry(e164: string): CountryCode {
  if (!e164) return DEFAULT_COUNTRY;
  try {
    const parsed = parsePhoneNumberFromString(e164);
    if (parsed?.country) return parsed.country;
  } catch {
    /* ignore */
  }
  return DEFAULT_COUNTRY;
}

/** True only for Saudi E.164 mobile (used by EdfaPay guard). */
export function isSaudiE164(e164: string): boolean {
  return /^\+9665[0-9]{8}$/.test(e164);
}

/** Pretty display for a stored E.164 phone (international format). */
export function formatE164ForDisplay(e164: string): string {
  if (!e164) return "";
  try {
    const parsed = parsePhoneNumberFromString(e164);
    if (parsed) return parsed.formatInternational();
  } catch {
    /* ignore */
  }
  return e164;
}
