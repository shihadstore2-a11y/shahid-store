// Use Western (Latin) digits for prices/numbers to avoid RTL clipping
// of Arabic-Indic digits at narrow viewports.
export function formatSAR(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(n)) return "0 ر.س";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n)} ر.س`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
