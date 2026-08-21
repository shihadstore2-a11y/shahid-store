import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatSAR } from "@/lib/format";

const STATUS_AR: Record<string, string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكّد",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

type FoundOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "تتبع الطلب — شاهد ستور" },
      { name: "description", content: "تتبّع حالة طلبك في شاهد ستور برقم الطلب." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoundOrder | null | "notfound">(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.rpc("get_order_by_number", {
      _order_number: orderNumber.trim(),
    });
    setLoading(false);
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setResult("notfound");
      return;
    }
    setResult((Array.isArray(data) ? data[0] : data) as FoundOrder);
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: "var(--gradient-gold)" }}>
            <Package className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">تتبع طلبك</h1>
          <p className="mt-2 text-sm text-muted-foreground">ادخل رقم الطلب لمعرفة الحالة</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-foreground">رقم الطلب</span>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              dir="ltr"
              className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-right outline-none focus:ring-2 focus:ring-ring"
              placeholder="LG-260508-1234"
            />
          </label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 text-base font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? "جارٍ البحث..." : "تتبع الطلب"}
          </button>
        </form>

        {result === "notfound" && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-sm font-bold text-destructive">
            لم نجد طلباً بهذا الرقم. تحقق من الرقم أو تواصل مع الدعم.
          </div>
        )}
        {result && result !== "notfound" && (
          <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">رقم الطلب</span><span className="font-mono font-bold">{result.order_number}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">العميل</span><span className="font-bold">{result.customer_name}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">الإجمالي</span><span className="font-bold text-primary">{formatSAR(result.total)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">الحالة</span><span className="rounded-full bg-secondary px-3 py-1 text-xs font-black">{STATUS_AR[result.status] ?? result.status}</span></div>
            <Link to="/login" search={{ redirect: "/account", force: false }} className="mt-3 block text-center text-xs font-bold text-primary hover:underline">سجّل دخولك لرؤية تفاصيل أكثر عن طلباتك</Link>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
