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
  const src =
    resolved === "full" ? "/shahid-store-logo.webp" : "/shahid-store-mark.webp";

  // logo PNG natural ratio ~ 1098x1365 (0.8). mark is 512x512 (1.0).
  const dims =
    resolved === "full"
      ? { width: 220, height: 274 }
      : { width: 110, height: 110 };

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
