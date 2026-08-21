import { Badge } from "@/components/ui/badge";
import { getCouponStatus, type AdminCoupon } from "@/lib/admin-coupons";

export function CouponStatusBadge({ coupon }: { coupon: AdminCoupon }) {
  const s = getCouponStatus(coupon);
  if (s === "active")
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">نشط</Badge>;
  if (s === "expired") return <Badge variant="destructive">منتهي</Badge>;
  return <Badge variant="secondary">معطّل</Badge>;
}
