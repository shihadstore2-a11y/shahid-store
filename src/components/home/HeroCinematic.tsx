

/**
 * HeroCinematic — Responsive Artwork
 * - وضع الهاتف: /hero-mobile.webp
 * - وضع الكمبيوتر/الشاشات الكبيرة: /hero-pc.webp
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
        <picture className="block w-full">
          {/* شاشات الجوال والهواتف */}
          <source media="(max-width: 767px)" srcSet="/hero-mobile.webp" />
          {/* شاشات الكمبيوتر والأجهزة اللوحية */}
          <source media="(min-width: 768px)" srcSet="/hero-pc.webp" />
          {/* الصورة الافتراضية */}
          <img
            src="/hero-pc.webp"
            alt="شاهد ستور — اشتراكات رسمية بجودة 4K وتفعيل سريع"
            className="block h-auto w-full select-none"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable={false}
            width={1440}
            height={900}
          />
        </picture>
      </a>

      {/* fade لطيف للدمج مع باقي الصفحة على الشاشات الكبيرة */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-16 bg-gradient-to-b from-transparent to-background md:block"
      />
    </section>
  );
}
