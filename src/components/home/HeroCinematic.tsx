

const HERO_SRCSET = [
  "/hero-worldcup-768.webp 768w",
  "/hero-worldcup-1366.webp 1366w",
  "/hero-worldcup-1920.webp 1920w",
].join(", ");
const HERO_SIZES = "100vw";
const HERO_FALLBACK = "/hero-worldcup-1366.webp";

/**
 * HeroCinematic — Full-bleed كأس العالم artwork.
 * - الصورة الكاملة هي البطل على كل المقاسات (النص مرسوم داخل الصورة).
 * - الصورة قابلة للنقر بالكامل وتنقل المستخدم إلى #catalog.
 */
export function HeroCinematic() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate w-full overflow-hidden bg-background"
    >
      <h1 id="hero-title" className="sr-only">
        شاهد ستور — اشتراكات IPTV رسمية بجودة 4K وتفعيل سريع
      </h1>

      <a
        href="#catalog"
        aria-label="ابدأ الاشتراك — تصفّح الباقات"
        className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <img
          src={HERO_FALLBACK}
          srcSet={HERO_SRCSET}
          sizes={HERO_SIZES}
          alt="كأس العالم على شاشتك مع شاهد ستور — اشتراكات رسمية بجودة 4K"
          className="block h-auto w-full select-none"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
          width={1440}
          height={900}
        />
      </a>

      {/* fade لطيف للدمج مع باقي الصفحة */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-16 bg-gradient-to-b from-transparent to-background md:block"
      />
    </section>
  );
}
