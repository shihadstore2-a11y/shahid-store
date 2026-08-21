/**
 * CategoryIcons — عرض الشعارات الرسمية بلا أي خلفية أو إطار.
 * الشعار يقف بذاته على خلفية الصفحة الفاتحة، مع توهج ذهبي ناعم
 * عبر drop-shadow لإبراز الحدود دون التأثير على ألوان الشعار الأصلي.
 *
 * المقاسات المدعومة: 20px → 96px. الحاوية مربعة، الشعار object-contain
 * يحافظ على نسبه على كل المقاسات.
 */
import falconMark from "@/assets/logos/falcon-mark.webp";
import hulkMark from "@/assets/logos/hulk-mark.webp";
import smartersMark from "@/assets/logos/smarters-mark.webp";

type IconProps = { size?: number; className?: string };

type BareLogoProps = {
  size: number;
  src: string;
  alt: string;
  className?: string;
};

/** شعار عاري بلا خلفية + توهج ذهبي ناعم لإبراز الحدود فوق الخلفية الفاتحة */
function BareLogo({ size, src, alt, className }: BareLogoProps) {
  return (
    <span
      aria-hidden
      className={[
        "relative inline-flex shrink-0 items-center justify-center",
        className ?? "",
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block h-full w-full object-contain"
        style={{
          filter:
            "drop-shadow(0 2px 4px oklch(0 0 0 / 0.12)) drop-shadow(0 4px 12px oklch(0 0 0 / 0.08))",
        }}
      />
    </span>
  );
}

export const FalconIcon = ({ size = 48, className }: IconProps) => (
  <BareLogo size={size} src={falconMark} alt="Falcon TV" className={className} />
);

export const HulkIcon = ({ size = 48, className }: IconProps) => (
  <BareLogo size={size} src={hulkMark} alt="Hulk Player" className={className} />
);

export const SmartersIcon = ({ size = 48, className }: IconProps) => (
  <BareLogo size={size} src={smartersMark} alt="Smarters IPTV" className={className} />
);

/** عروض سنوية — تاج ذهبي SVG مستقل بلا خلفية */
export const AnnualOffersIcon = ({ size = 48, className }: IconProps) => (
  <span
    aria-hidden
    className={["relative inline-flex shrink-0 items-center justify-center", className ?? ""].join(" ")}
    style={{ width: size, height: size }}
  >
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ filter: "drop-shadow(0 1px 3px oklch(0 0 0 / 0.2))" }}
    >
      <defs>
        <linearGradient id="annualGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="55%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      <path
        d="M15 70 L20 30 L38 52 L50 22 L62 52 L80 30 L85 70 Z"
        fill="url(#annualGold)"
        stroke="#7A5A18"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="15" y="72" width="70" height="10" rx="2" fill="url(#annualGold)" stroke="#7A5A18" strokeWidth="2" />
      <circle cx="20" cy="30" r="4" fill="#FFE066" />
      <circle cx="50" cy="22" r="5" fill="#FFE066" />
      <circle cx="80" cy="30" r="4" fill="#FFE066" />
    </svg>
  </span>
);

export type CategoryIconKey = "falcon" | "hulk" | "smarters" | "annual-offers";

export function getCategoryIcon(slug: string, size = 48, className?: string) {
  switch (slug) {
    case "falcon":
      return <FalconIcon size={size} className={className} />;
    case "hulk":
      return <HulkIcon size={size} className={className} />;
    case "smarters":
      return <SmartersIcon size={size} className={className} />;
    case "annual-offers":
      return <AnnualOffersIcon size={size} className={className} />;
    default:
      return <FalconIcon size={size} className={className} />;
  }
}
