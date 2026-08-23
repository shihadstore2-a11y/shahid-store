type LogoProps = {
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** kept for backward compat — when false, switches to mark variant */
  showText?: boolean;
};

const SIZES = {
  sm: { full: "h-10", mark: "h-9" },
  md: { full: "h-14", mark: "h-11" },
  lg: { full: "h-24", mark: "h-16" },
} as const;

export function Logo({
  variant,
  size = "md",
  className = "",
  showText = true,
}: LogoProps) {
  const resolved: "full" | "mark" = variant ?? (showText ? "full" : "mark");
  const src = "/logo.webp";

  const dims = { width: 220, height: 220 };

  return (
    <img
      src={src}
      alt="شاهد ستور"
      width={dims.width}
      height={dims.height}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      className={`${SIZES[size][resolved]} w-auto select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
