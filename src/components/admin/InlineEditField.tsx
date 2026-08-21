import { Check, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string | number | null;
  type?: "text" | "number";
  suffix?: string;
  placeholder?: string;
  nullable?: boolean;
  min?: number;
  ariaLabel?: string;
  onSave: (newValue: string | number | null) => Promise<void>;
  className?: string;
  inputClassName?: string;
  formatDisplay?: (v: string | number | null) => string;
};

export function InlineEditField({
  value,
  type = "text",
  suffix,
  placeholder = "—",
  nullable,
  min,
  ariaLabel,
  onSave,
  className,
  inputClassName,
  formatDisplay,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value == null ? "" : String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value == null ? "" : String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [isEditing]);

  const handleSave = async () => {
    let next: string | number | null;
    if (type === "number") {
      if (draft.trim() === "") {
        if (nullable) next = null;
        else {
          setIsEditing(false);
          return;
        }
      } else {
        const n = Number(draft);
        if (!Number.isFinite(n)) return;
        next = n;
      }
    } else {
      next = draft.trim();
      if (!next) return;
    }
    if (next === value) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setIsEditing(false);
    } catch {
      setDraft(value == null ? "" : String(value));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value == null ? "" : String(value));
    setIsEditing(false);
  };

  if (!isEditing) {
    const display =
      formatDisplay ? formatDisplay(value) : value == null || value === "" ? placeholder : `${value}`;
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label={ariaLabel ?? "تعديل"}
        className={cn(
          "group inline-flex items-center gap-1 rounded-md px-2 py-1 text-right transition-colors hover:bg-accent/10",
          className,
        )}
      >
        <span>{display}</span>
        {suffix && value != null && value !== "" && (
          <span className="text-xs text-muted-foreground">{suffix}</span>
        )}
        <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Input
        ref={inputRef}
        value={draft}
        type={type === "number" ? "number" : "text"}
        inputMode={type === "number" ? "decimal" : "text"}
        min={min}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          } else if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
          }
        }}
        disabled={saving}
        aria-label={ariaLabel ?? "تعديل القيمة"}
        className={cn("h-8 w-28 text-right", inputClassName)}
      />
      <Button
        size="icon"
        variant="default"
        onClick={handleSave}
        disabled={saving}
        aria-label="حفظ"
        className="h-8 w-8"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleCancel}
        disabled={saving}
        aria-label="إلغاء"
        className="h-8 w-8"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
