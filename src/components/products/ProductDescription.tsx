import { AlertCircle, Sparkles } from "lucide-react";

interface ProductDescriptionProps {
  text?: string | null;
  className?: string;
}

export function stripHtmlAndFormat(input: string): string {
  if (!input) return "";

  let text = input;

  // Replace block tags and breaks with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  text = text.replace(/<li[^>]*>/gi, "• ");

  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  return text;
}

export function formatRawTextToLines(text: string): string[] {
  if (!text) return [];

  // Strip HTML first if any HTML tags are present
  let formatted = stripHtmlAndFormat(text);

  // Replace non-breaking spaces with normal spaces
  formatted = formatted.replace(/\u00a0/g, " ");

  // Collapse duplicate consecutive bullet emojis: "✔️ ✔️" -> "✔️"
  formatted = formatted.replace(/(✔️|✅|⚡|🔹|•)\s*(✔️|✅|⚡|🔹|•)+/g, "$1 ");

  // Break on multiple spaces (3 or more)
  formatted = formatted.replace(/[ \t]{3,}/g, "\n");

  // Insert newline before bullet emojis if preceded by text without a newline
  formatted = formatted.replace(/([^\n])\s*(✔️|✅|⚡|🔹|•)/g, "$1\n$2");

  // Insert newline before keywords like "تنبيه :", "تنويه هام :", "ملاحظة :"
  formatted = formatted.replace(/([^\n])\s*(تنبيه\s*:|تنويه\s*هام\s*:|ملاحظة\s*:)/g, "$1\n$2");
  formatted = formatted.replace(/([^\n])\s*(\[[^\]]+\])/g, "$1\n$2");

  return formatted
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter((l) => l.length > 0 && !/^(✔️|✅|⚡|🔹|•)$/.test(l));
}

export function autoFormatDescriptionText(text: string): string {
  return formatRawTextToLines(text).join("\n");
}

export function ProductDescription({
  text,
  className = "",
}: ProductDescriptionProps) {
  if (!text) return null;

  const lines = formatRawTextToLines(text);

  return (
    <div className={`space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base ${className}`}>
      {lines.map((line, idx) => {
        const isAlert = /^(تنبيه|تنويه\s*هام|هام)\s*:/i.test(line) || line.includes("لايوجد ارجاع");
        const isNote = /^ملاحظة\s*:/i.test(line);
        const isHeader = /^\[.*\]$/.test(line) || /^(المميزات|الباقات|باقات VIP|طريقة التفعيل|شروط)/i.test(line);
        const isBullet = /^[✔️✅⚡🔹•\-*]/.test(line);

        // تنبيه
        if (isAlert) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-200 text-sm font-medium my-2 shadow-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span className="leading-normal">{line}</span>
            </div>
          );
        }

        // ملاحظة
        if (isNote) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-sky-200 text-sm font-medium my-2 shadow-sm"
            >
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-sky-400" />
              <span className="leading-normal">{line}</span>
            </div>
          );
        }

        // ترويسة [قسم]
        if (isHeader) {
          return (
            <div key={idx} className="pt-2 pb-1">
              <h4 className="inline-block text-base sm:text-lg font-black text-[#cda105] border-b border-[#cda105]/30 pb-1">
                {line.replace(/^\[|\]$/g, "")}
              </h4>
            </div>
          );
        }

        // نقطة تعداد
        if (isBullet) {
          return (
            <p key={idx} className="font-medium text-foreground/95 flex items-start gap-2 py-0.5">
              {line.startsWith("✅") ? (
                <span className="text-emerald-400 shrink-0 select-none">✅</span>
              ) : line.startsWith("✔️") ? (
                <span className="text-emerald-400 shrink-0 select-none">✔️</span>
              ) : null}
              <span>{line.replace(/^[✔️✅⚡🔹•\-*]\s*/, "")}</span>
            </p>
          );
        }

        // نص عادي (أي نص أو رابط يظهر كنص عادي طبيعي تماماً بدون أي بطاقات أو مربعات)
        return (
          <p key={idx} className="text-gray-300 py-0.5 leading-relaxed break-words" dir="auto">
            {line}
          </p>
        );
      })}
    </div>
  );
}
