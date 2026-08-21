// أيقونات منصات/أجهزة — SVG inline موحّدة الأسلوب
// stroke موحّد 1.75 + currentColor ذهبي
type Props = { size?: number; className?: string };

const baseProps = {
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SmartTVIcon = ({ size = 22, className }: Props) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...baseProps} aria-hidden>
    <rect x="2.5" y="4.5" width="19" height="12" rx="2" />
    <path d="M8.5 20.5h7M12 16.5v4" />
  </svg>
);

export const AppleTVIcon = ({ size = 22, className }: Props) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...baseProps} aria-hidden>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M14 14.5c-.3.5-.7 1-1.3 1-.7 0-.9-.4-1.7-.4s-1 .4-1.7.4c-.6 0-1-.5-1.3-1-.7-1-1.2-2.8-.5-4 .5-.8 1.4-1.3 2.2-1.3.7 0 1.1.4 1.7.4.5 0 .9-.4 1.7-.4.4 0 1.1.1 1.7.6-.3.2-1 .8-1 1.7 0 1 .8 1.5 1 1.6-.2.3-.4.6-.8 1.4z" fill="currentColor" stroke="none" />
  </svg>
);

export const IOSIcon = ({ size = 22, className }: Props) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...baseProps} aria-hidden>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10.5 5h3" opacity="0.6" />
    <circle cx="12" cy="18.5" r=".7" fill="currentColor" stroke="none" />
  </svg>
);

export const AndroidIcon = ({ size = 22, className }: Props) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...baseProps} aria-hidden>
    <path d="M5 11a7 7 0 0 1 14 0v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
    <path d="M7 7l-1.3-1.8M17 7l1.3-1.8" />
    <circle cx="9" cy="11" r=".8" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11" r=".8" fill="currentColor" stroke="none" />
  </svg>
);

export const FirestickIcon = ({ size = 22, className }: Props) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...baseProps} aria-hidden>
    <rect x="3" y="9.5" width="13" height="5" rx="1.5" />
    <path d="M16 12h5" />
    <circle cx="6" cy="12" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

export const WebIcon = ({ size = 22, className }: Props) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...baseProps} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a13 13 0 0 1 0 18" />
    <path d="M12 3a13 13 0 0 0 0 18" />
  </svg>
);

export const PLATFORMS = [
  { key: "smart-tv", label: "Smart TV", Icon: SmartTVIcon },
  { key: "apple-tv", label: "Apple TV", Icon: AppleTVIcon },
  { key: "ios", label: "iOS", Icon: IOSIcon },
  { key: "android", label: "Android", Icon: AndroidIcon },
  { key: "firestick", label: "Firestick", Icon: FirestickIcon },
  { key: "web", label: "Web", Icon: WebIcon },
] as const;
