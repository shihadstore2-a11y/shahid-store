/**
 * J.1 — Shared international phone input with country selector.
 *
 * - Storage value (onChange): always E.164 (e.g. "+966512345678") or "" if invalid.
 * - Display value: AsYouType national format inside the selected country.
 * - Default country: Saudi (🇸🇦).
 * - Backward compatible: if `defaultValue` is a legacy local "05XXXXXXXX"
 *   we convert it to "+966..." on mount.
 */
import * as React from "react";
import { Check, ChevronDown, Phone, Search } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  type CountryEntry,
  detectCountry,
  findCountry,
  formatAsYouType,
  isValidPhone,
  toE164,
} from "@/lib/phone-intl";

export type PhoneInputIntlProps = {
  value?: string; // E.164 or legacy local
  defaultValue?: string;
  onChange: (e164OrEmpty: string, meta: { country: CountryCode; valid: boolean }) => void;
  onBlur?: () => void;
  defaultCountry?: CountryCode;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
};

function legacyToE164(v: string): string {
  if (!v) return "";
  // Legacy Saudi local: 05XXXXXXXX → +9665XXXXXXXX
  if (/^05[0-9]{8}$/.test(v)) return "+966" + v.slice(1);
  return v;
}

export const PhoneInputIntl = React.forwardRef<HTMLInputElement, PhoneInputIntlProps>(
  function PhoneInputIntl(
    {
      value,
      defaultValue,
      onChange,
      onBlur,
      defaultCountry = DEFAULT_COUNTRY,
      placeholder,
      disabled,
      invalid,
      className,
      inputClassName,
      id,
      name,
      ariaLabel,
    },
    ref,
  ) {
    const initialValue = legacyToE164(value ?? defaultValue ?? "");
    const initialCountry: CountryCode = initialValue
      ? detectCountry(initialValue)
      : defaultCountry;

    const [country, setCountry] = React.useState<CountryCode>(initialCountry);
    const [display, setDisplay] = React.useState<string>(() => {
      if (!initialValue) return "";
      return formatAsYouType(initialValue, initialCountry);
    });
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    // مزامنة القيمة عند تغيرها من الخارج (مثل تحميل بيانات المستخدم المسجل)
    React.useEffect(() => {
      if (value !== undefined) {
        const val = legacyToE164(value);
        if (val) {
          const c = detectCountry(val);
          setCountry(c);
          setDisplay(formatAsYouType(val, c));
        } else if (!value) {
          setDisplay("");
        }
      }
    }, [value]);

    const selected = findCountry(country);

    const emit = React.useCallback(
      (raw: string, c: CountryCode) => {
        const e164 = toE164(raw, c);
        const valid = e164 ? isValidPhone(e164, c) : false;
        onChange(valid && e164 ? e164 : "", { country: c, valid });
      },
      [onChange],
    );

    const handleChange = (raw: string) => {
      // Keep raw input only digits/+/space — let AsYouType pretty-print
      const cleaned = raw.replace(/[^\d+\s().-]/g, "");
      const formatted = formatAsYouType(cleaned, country);
      setDisplay(formatted);
      emit(cleaned || formatted, country);
    };

    const handleCountrySelect = (c: CountryEntry) => {
      setCountry(c.code);
      setOpen(false);
      setSearch("");
      // Re-emit with new country context using whatever the user has typed
      emit(display, c.code);
    };

    const filtered = React.useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return COUNTRIES;
      return COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.dial.includes(q),
      );
    }, [search]);

    return (
      <div
        dir="ltr"
        className={cn(
          "flex h-12 items-stretch overflow-hidden rounded-lg border bg-background transition focus-within:ring-2 focus-within:ring-ring",
          invalid ? "border-destructive/60" : "border-input",
          disabled && "opacity-60",
          className,
        )}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="اختر الدولة"
              className="flex shrink-0 items-center gap-1.5 border-e border-input bg-secondary/40 px-3 text-sm font-bold tabular-nums text-muted-foreground transition hover:bg-secondary/70"
            >
              <span aria-hidden className="text-base leading-none">
                {selected.flag}
              </span>
              <span>{selected.dial}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-72 p-0"
            dir="rtl"
          >
            <div className="border-b border-border p-2">
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن دولة…"
                  className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                  لا توجد نتائج
                </li>
              )}
              {filtered.map((c) => {
                const active = c.code === country;
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-right text-sm transition hover:bg-secondary",
                        active && "bg-accent/10 font-bold text-accent",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="text-base leading-none">
                          {c.flag}
                        </span>
                        <span>{c.name}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground" dir="ltr">
                          {c.dial}
                        </span>
                        {active && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Phone className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            ref={ref}
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            value={display}
            disabled={disabled}
            aria-label={ariaLabel ?? "رقم الجوال"}
            aria-invalid={invalid || undefined}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder ?? (country === "SA" ? "5XX XXX XXX" : "XXX XXX XXX")}
            className={cn(
              "h-full w-full bg-transparent ps-9 pe-3 text-base font-bold tabular-nums tracking-wide text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/60",
              inputClassName,
            )}
          />
        </div>
      </div>
    );
  },
);
