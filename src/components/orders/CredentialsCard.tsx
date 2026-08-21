import { useState } from "react";
import { Check, Copy, Eye, EyeOff, ExternalLink, Gift, KeyRound, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";
import type { CustomerExtraInfo } from "@/lib/customer-order.functions";
import { useWhatsappLink } from "@/lib/whatsapp";

type Props = {
  username: string | null;
  password: string | null;
  url?: string | null;
  extraInfo?: CustomerExtraInfo | null;
  fulfilledAt?: string | null;
};

export function CredentialsCard({ username, password, url, extraInfo, fulfilledAt }: Props) {
  // الحماية: إن لم تصل بيانات، لا نعرض البطاقة (مثلاً قبل التسليم)
  if (!username && !password && !url && !extraInfo) return null;

  const hasCreds = Boolean(username || password);
  const showUrlFallback = !url && hasCreds;

  return (
    <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 to-emerald-500/[0.02] p-5 text-right shadow-[var(--shadow-card)]">
      <header className="flex items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground">بيانات الاشتراك</h2>
            {fulfilledAt && (
              <p className="text-[11px] text-muted-foreground">
                تم التسليم: {new Date(fulfilledAt).toLocaleString("ar-SA")}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="mt-4 space-y-3">
        {username && (
          <CredentialField
            icon={<User className="h-4 w-4" />}
            label="اسم المستخدم"
            value={username}
            copyLabel="اسم المستخدم"
          />
        )}
        {password && (
          <PasswordField value={password} />
        )}
        {url && (
          <UrlField value={url} />
        )}
        {showUrlFallback && <UrlFallback />}
        {extraInfo && Object.keys(extraInfo).length > 0 && (
          <ExtraInfoTable data={extraInfo} />
        )}
      </div>

      <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200/90">
        ⚠️ احتفظ بهذه البيانات في مكان آمن. لا تشاركها مع أحد. لأي مشكلة، تواصل مع الدعم.
      </p>
    </div>
  );
}

function UrlFallback() {
  const waUrl = useWhatsappLink(
    "السلام عليكم، استلمت بيانات اشتراكي لكن أحتاج رابط التفعيل. شكراً.",
  );
  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-3 text-right">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-accent">
        <ExternalLink className="h-4 w-4" />
        <span>رابط التفعيل</span>
      </div>
      <p className="text-xs leading-relaxed text-foreground">
        📱 سيُرسل لك رابط التفعيل عبر واتساب خلال ساعة واحدة، أو تواصل معنا الآن للحصول عليه فوراً.
      </p>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-xs font-black text-white hover:bg-[#1FAD55]"
      >
        <MessageCircle className="h-4 w-4" />
        طلب الرابط عبر واتساب
      </a>
    </div>
  );
}

function CredentialField({
  icon,
  label,
  value,
  copyLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <code
          dir="ltr"
          className="flex-1 break-all rounded-lg bg-muted/40 px-3 py-2 text-left font-mono text-sm font-bold text-foreground"
        >
          {value}
        </code>
        <CopyButton value={value} label={copyLabel} />
      </div>
    </div>
  );
}

function PasswordField({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
        <KeyRound className="h-4 w-4" />
        <span>كلمة السر</span>
      </div>
      <div className="flex items-center gap-2">
        <code
          dir="ltr"
          className="flex-1 break-all rounded-lg bg-muted/40 px-3 py-2 text-left font-mono text-sm font-bold text-foreground"
        >
          {show ? value : "•".repeat(Math.min(value.length, 12))}
        </code>
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
          aria-label={show ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <CopyButton value={value} label="كلمة السر" />
      </div>
    </div>
  );
}

function UrlField({ value }: { value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
        <ExternalLink className="h-4 w-4" />
        <span>رابط التفعيل</span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="flex-1 break-all rounded-lg bg-muted/40 px-3 py-2 text-left font-mono text-sm font-bold text-primary underline-offset-2 hover:underline"
        >
          {value}
        </a>
        <CopyButton value={value} label="الرابط" />
      </div>
    </div>
  );
}

function ExtraInfoTable({ data }: { data: CustomerExtraInfo }) {
  const entries = Object.entries(data);
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3">
      <div className="mb-2 text-[11px] font-bold text-muted-foreground">📋 بيانات إضافية</div>
      <div className="space-y-1.5">
        {entries.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 text-xs"
          >
            <span className="text-muted-foreground">{k}</span>
            <code dir="ltr" className="text-left font-mono font-bold text-foreground">
              {String(v)}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast.success(`تم نسخ ${label}`);
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error("تعذّر النسخ");
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
      aria-label={`نسخ ${label}`}
    >
      {done ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
