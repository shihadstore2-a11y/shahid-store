import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CouponRow } from "./CouponRow";
import type { AdminCoupon, CouponUpdate } from "@/lib/admin-coupons";

export function CouponsTable({
  rows,
  onUpdate,
  onDelete,
  canModify = true,
}: {
  rows: AdminCoupon[];
  onUpdate: (id: string, updates: CouponUpdate) => Promise<void>;
  onDelete: (coupon: AdminCoupon) => void;
  canModify?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الكود</TableHead>
            <TableHead>نسبة الخصم</TableHead>
            <TableHead>الحد الأدنى للمدة</TableHead>
            <TableHead>تاريخ الانتهاء</TableHead>
            <TableHead>الحالة</TableHead>
            {canModify && <TableHead>نشط</TableHead>}
            {canModify && <TableHead className="w-[60px]">إجراء</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <CouponRow
              key={c.id}
              coupon={c}
              onUpdate={onUpdate}
              onDelete={onDelete}
              canModify={canModify}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
