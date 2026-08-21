import type { Customer } from "@/lib/admin-customers";
import { CustomerRow } from "./CustomerRow";

export function CustomersTable({
  rows,
  onOpen,
}: {
  rows: Customer[];
  onOpen: (phone: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full">
        <thead className="bg-muted/40 text-right text-xs font-black text-muted-foreground">
          <tr>
            <th className="px-4 py-3">الاسم</th>
            <th className="px-4 py-3">الجوال</th>
            <th className="px-4 py-3">الطلبات</th>
            <th className="px-4 py-3">إجمالي المشتريات</th>
            <th className="px-4 py-3">آخر طلب</th>
            <th className="px-4 py-3">أول طلب</th>
            <th className="px-4 py-3 text-left">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <CustomerRow key={c.customer_phone} customer={c} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
