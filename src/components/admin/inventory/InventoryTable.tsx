import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryRow } from "./InventoryRow";
import type { InventoryItem } from "@/lib/admin-inventory";

export function InventoryTable({
  rows,
  onEdit,
  onDelete,
  canModify,
}: {
  rows: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  canModify: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المزوّد</TableHead>
            <TableHead>اسم المستخدم</TableHead>
            <TableHead>كلمة السر</TableHead>
            <TableHead>الرابط</TableHead>
            <TableHead>المدة</TableHead>
            <TableHead>الأجهزة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>الانتهاء</TableHead>
            {canModify && <TableHead className="w-[100px]">إجراء</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <InventoryRow
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              canModify={canModify}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
