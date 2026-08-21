export type RecentActivity = {
  name: string;
  city: string;
  product: string;
  minutesAgo: number;
};

export const recentActivities: RecentActivity[] = [
  { name: "أحمد", city: "جدة", product: "فالكون سنة", minutesAgo: 2 },
  { name: "محمد", city: "الرياض", product: "هولك سنة", minutesAgo: 4 },
  { name: "فهد", city: "الدمام", product: "سمارترز سنة + 3 أشهر", minutesAgo: 6 },
  { name: "عبدالله", city: "مكة", product: "فالكون سنة جهازين", minutesAgo: 9 },
  { name: "سلطان", city: "الطائف", product: "فالكون 6 أشهر", minutesAgo: 12 },
  { name: "خالد", city: "تبوك", product: "هولك 6 أشهر", minutesAgo: 15 },
  { name: "سعود", city: "أبها", product: "سمارترز سنة", minutesAgo: 18 },
  { name: "ناصر", city: "حائل", product: "فالكون سنة", minutesAgo: 22 },
  { name: "تركي", city: "بريدة", product: "هولك سنة", minutesAgo: 26 },
  { name: "بدر", city: "الجبيل", product: "فالكون 3 أشهر", minutesAgo: 30 },
  { name: "ماجد", city: "ينبع", product: "سمارترز سنة + 3 أشهر", minutesAgo: 35 },
  { name: "وليد", city: "الخبر", product: "فالكون سنة", minutesAgo: 40 },
];

export function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return "الآن";
  if (minutes === 1) return "قبل دقيقة";
  if (minutes === 2) return "قبل دقيقتين";
  if (minutes < 11) return `قبل ${minutes} دقائق`;
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "قبل ساعة";
  if (hours === 2) return "قبل ساعتين";
  return `قبل ${hours} ساعات`;
}
