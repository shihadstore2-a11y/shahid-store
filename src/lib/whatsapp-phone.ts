/**
 * تطبيع رقم الهاتف لصيغة wa.me الدولية (بدون + ولا فواصل).
 * - 05XXXXXXXX (سعودي محلي) → 9665XXXXXXXX
 * - 5XXXXXXXX → 9665XXXXXXXX
 * - 966... → بدون تغيير
 * - 00966... → 966...
 * - أرقام دولية أخرى تُترك كما هي بعد إزالة الرموز.
 */
export function normalizePhoneNumber(input: string): string {
  let n = (input || "").replace(/[^0-9]/g, "");
  if (!n) return "";
  if (n.startsWith("00")) n = n.substring(2);
  if (n.startsWith("966")) return n;
  if (n.startsWith("05") && n.length === 10) return "966" + n.substring(1);
  if (n.startsWith("5") && n.length === 9) return "966" + n;
  return n;
}

/** تنسيق الرقم للعرض البشري (+966 5X XXX XXXX). */
export function formatPhoneForDisplay(phone: string): string {
  const n = normalizePhoneNumber(phone);
  if (n.length === 12 && n.startsWith("966")) {
    return `+966 ${n.substring(3, 5)} ${n.substring(5, 8)} ${n.substring(8)}`;
  }
  return phone;
}
