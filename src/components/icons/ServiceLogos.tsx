/**
 * ServiceLogos — شعارات خدمات IPTV مستوحاة من تصميمات العميل
 * مرسومة SVG بشكل احترافي مستقل (ليست نسخ pixel-perfect من الشعارات الأصلية)
 */
import type { ReactNode } from "react";

type LogoProps = { size?: number; className?: string };

/* ─────────── FALCON TV — نسر ذهبي بأجنحة ممتدة ─────────── */
export function FalconTVLogo({ size = 120, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Falcon TV"
    >
      <defs>
        <linearGradient id="falcon-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#92722A" />
        </linearGradient>
      </defs>
      {/* أجنحة ممتدة */}
      <path
        d="M100 70 L30 80 Q20 82 28 88 L60 95 Q70 96 75 100 L100 100 L125 100 Q130 96 140 95 L172 88 Q180 82 170 80 Z"
        fill="url(#falcon-gold)"
      />
      {/* رأس وجسم النسر */}
      <path
        d="M100 60 Q90 65 92 75 L95 100 Q97 110 100 112 Q103 110 105 100 L108 75 Q110 65 100 60 Z"
        fill="url(#falcon-gold)"
      />
      {/* منقار */}
      <path d="M100 62 L106 58 L100 65 Z" fill="oklch(0.18 0.07 290)" />
      {/* عين */}
      <circle cx="98" cy="68" r="1.6" fill="oklch(0.18 0.07 290)" />
      {/* ذيل */}
      <path d="M88 105 L100 145 L112 105 Z" fill="url(#falcon-gold)" />
      {/* شريط TV FALCON */}
      <rect
        x="40"
        y="155"
        width="120"
        height="28"
        rx="4"
        fill="url(#falcon-gold)"
      />
      <text
        x="100"
        y="174"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontSize="16"
        fontWeight="900"
        fill="oklch(0.18 0.07 290)"
        letterSpacing="2"
      >
        TV FALCON
      </text>
    </svg>
  );
}

/* ─────────── HULK PLAYER — قبضة ذهبية ─────────── */
export function HulkPlayerLogo({ size = 120, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Hulk Player"
    >
      <defs>
        <linearGradient id="hulk-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="45%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="hulk-gold-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A16207" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#713F12" stopOpacity="0.85" />
        </linearGradient>
        <filter id="hulk-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* ظل سفلي خلفي للقبضة لإيهام العمق */}
      <g fill="url(#hulk-gold-shadow)" opacity="0.7">
        <rect x="58" y="138" width="84" height="14" rx="7" />
      </g>
      {/* قبضة يد مغلقة (شكل مربع مدعوم بأصابع) */}
      <g fill="url(#hulk-gold)" filter="url(#hulk-glow)">
        {/* راحة اليد */}
        <rect x="55" y="80" width="90" height="65" rx="10" />
        {/* أصابع 4 (عمودية أعلى) */}
        <rect x="60" y="55" width="18" height="35" rx="6" />
        <rect x="82" y="48" width="18" height="42" rx="6" />
        <rect x="104" y="48" width="18" height="42" rx="6" />
        <rect x="126" y="55" width="18" height="35" rx="6" />
        {/* إبهام (يمين) */}
        <rect x="138" y="92" width="22" height="32" rx="8" />
      </g>
      {/* لمعان علوي على راحة اليد */}
      <rect
        x="60"
        y="84"
        width="80"
        height="6"
        rx="3"
        fill="#FFFBEB"
        opacity="0.45"
      />
      {/* خطوط مفاصل */}
      <g stroke="#7C2D12" strokeWidth="2" fill="none" opacity="0.65">
        <line x1="60" y1="90" x2="144" y2="90" />
        <line x1="69" y1="65" x2="69" y2="80" />
        <line x1="91" y1="58" x2="91" y2="80" />
        <line x1="113" y1="58" x2="113" y2="80" />
        <line x1="135" y1="65" x2="135" y2="80" />
      </g>
      {/* HULK */}
      <text
        x="100"
        y="172"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontSize="22"
        fontWeight="900"
        fill="url(#hulk-gold)"
        letterSpacing="3"
      >
        HULK
      </text>
      <text
        x="100"
        y="188"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontSize="9"
        fontWeight="700"
        fill="#FDE047"
        letterSpacing="4"
      >
        PLAYER
      </text>
    </svg>
  );
}


/* ─────────── SMARTERS IPTV — تلفزيون أزرق ─────────── */
export function SmartersIPTVLogo({ size = 120, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Smarters IPTV"
    >
      <defs>
        <linearGradient id="smart-blue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
      </defs>
      {/* مربع خلفية app */}
      <rect x="35" y="50" width="130" height="105" rx="22" fill="url(#smart-blue)" />
      {/* antenna */}
      <line x1="80" y1="55" x2="65" y2="35" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <line x1="120" y1="55" x2="135" y2="35" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="65" cy="35" r="4" fill="#FFFFFF" />
      <circle cx="135" cy="35" r="4" fill="#FFFFFF" />
      {/* شاشة TV (دائرة-ish بشكل smile) */}
      <path
        d="M70 90 Q100 75 130 90 Q135 110 130 130 Q100 145 70 130 Q65 110 70 90 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* قاعدة */}
      <rect x="92" y="155" width="16" height="10" fill="url(#smart-blue)" />
      <rect x="80" y="163" width="40" height="5" rx="2" fill="url(#smart-blue)" />
      {/* SMARTERS IPTV */}
      <text
        x="100"
        y="182"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontSize="13"
        fontWeight="900"
        fill="url(#smart-blue)"
        letterSpacing="2"
      >
        SMARTERS IPTV
      </text>
    </svg>
  );
}

/* ─────────── ALFA TV — مثلث/سهم أزرق ─────────── */
export function AlfaTVLogo({ size = 120, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Alfa TV"
    >
      <defs>
        <linearGradient id="alfa-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      {/* دائرة خلفية */}
      <circle cx="100" cy="95" r="55" fill="url(#alfa-blue)" />
      {/* حرف A على شكل مثلث/سهم */}
      <path
        d="M100 55 L130 130 L115 130 L110 118 L90 118 L85 130 L70 130 Z M97 105 L103 105 L100 95 Z"
        fill="#FFFFFF"
      />
      {/* ALFA TV */}
      <text
        x="100"
        y="178"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontSize="20"
        fontWeight="900"
        fill="url(#alfa-blue)"
        letterSpacing="3"
      >
        ALFA TV
      </text>
    </svg>
  );
}

/* ─────────── Helpers ─────────── */

export type ServiceKey =
  | "falcon"
  | "hulk"
  | "smarters"
  | "alfa";

export function getServiceLogo(key: ServiceKey, size = 120): ReactNode {
  switch (key) {
    case "falcon":
      return <FalconTVLogo size={size} />;
    case "hulk":
      return <HulkPlayerLogo size={size} />;
    case "smarters":
      return <SmartersIPTVLogo size={size} />;
    case "alfa":
      return <AlfaTVLogo size={size} />;
  }
}

/**
 * resolveBundleLogos — يحدّد شعارات الحزمة من slug المنتج
 * أمثلة:
 *  - bundle-falcon-hulk-1y     → [falcon, hulk]
 *  - bundle-falcon-hulk-alfa-1y → [falcon, hulk, alfa]
 */
export function resolveBundleLogos(productSlug: string): ServiceKey[] {
  const s = productSlug.toLowerCase();
  const keys: ServiceKey[] = [];
  if (s.includes("falcon")) keys.push("falcon");
  if (s.includes("hulk")) keys.push("hulk");
  if (s.includes("alfa")) keys.push("alfa");
  if (s.includes("smarters")) keys.push("smarters");
  return keys;
}
