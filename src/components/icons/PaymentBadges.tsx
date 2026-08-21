// شارات دفع — تستخدم HeroTrustChip لتوحيد العائلة البصرية مع المنصات
// ألوان مهدّأة لتنسجم مع لوحة البنفسجي/الذهبي بدون سرقة الانتباه من الـCTA
import { HeroTrustChip } from "@/components/home/HeroTrustChip";

export const MadaBadge = () => (
  <HeroTrustChip label="مدى">
    <span className="flex items-center gap-0.5 text-[11px] font-black tracking-tight">
      <span className="text-[#84BD00]">m</span>
      <span className="text-[#27A2DB]">a</span>
      <span className="text-white">d</span>
      <span className="text-white">a</span>
    </span>
  </HeroTrustChip>
);

export const VisaBadge = () => (
  <HeroTrustChip label="Visa">
    <span
      className="text-[12px] font-black tracking-wider text-white"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      VISA
    </span>
  </HeroTrustChip>
);

export const MastercardBadge = () => (
  <HeroTrustChip label="Mastercard">
    <span className="flex items-center">
      <span className="h-4 w-4 rounded-full bg-[#EB001B] opacity-80" />
      <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#F79E1B] opacity-80 mix-blend-screen" />
    </span>
  </HeroTrustChip>
);

export const PAYMENTS = [
  { key: "mada", label: "مدى", Component: MadaBadge },
  { key: "visa", label: "Visa", Component: VisaBadge },
  { key: "mastercard", label: "Mastercard", Component: MastercardBadge },
] as const;
