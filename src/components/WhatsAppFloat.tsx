import { useWhatsappLink } from "@/lib/whatsapp";

export function WhatsAppFloat({ liftAboveSticky = false }: { liftAboveSticky?: boolean }) {
  const href = useWhatsappLink("مرحباً، أرغب بالاستفسار عن باقات شاهد ستور");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل"
      className={[
        "group fixed left-3 z-fab md:left-6",
        liftAboveSticky
          ? "bottom-[calc(env(safe-area-inset-bottom)+5rem)] md:bottom-6"
          : "bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-6",
      ].join(" ")}
    >
      <span
        className="relative flex h-12 w-12 items-center justify-center rounded-full text-white ring-2 ring-[oklch(0.78_0.16_85/0.55)] shadow-[0_10px_28px_-6px_oklch(0.78_0.16_85/0.45)] transition-transform duration-200 group-hover:scale-110 md:h-14 md:w-14"
        style={{
          background: "linear-gradient(135deg, oklch(0.34 0 0) 0%, oklch(0.22 0 0) 100%)",
        }}
      >
        {/* أيقونة الواتساب البيضاء — تباين عالٍ على الخلفية الفحمية */}
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current md:h-7 md:w-7" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        {/* مؤشر "متاح الآن" أخضر — يحفظ التعرّف البصري على واتساب دون كسر هوية المتجر */}
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-[oklch(0.22_0_0)] md:h-4 md:w-4"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#25D366] md:h-2.5 md:w-2.5" />
        </span>
      </span>
    </a>
  );
}
