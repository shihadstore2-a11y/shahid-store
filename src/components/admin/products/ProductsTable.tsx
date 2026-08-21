import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductRow } from "./ProductRow";
import type { AdminProductRow, AdminProductUpdate } from "@/lib/admin-products";

export function ProductsTable({
  rows,
  onUpdate,
  onOpenImages,
  onOpenDescription,
  onOpenFeatures,
}: {
  rows: AdminProductRow[];
  onUpdate: (id: string, updates: AdminProductUpdate) => Promise<void>;
  onOpenImages: (id: string) => void;
  onOpenDescription: (id: string) => void;
  onOpenFeatures: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">الصورة</TableHead>
            <TableHead>الاسم</TableHead>
            <TableHead>الفئة</TableHead>
            <TableHead>السعر الأصلي</TableHead>
            <TableHead>سعر العرض</TableHead>
            <TableHead>الخصم</TableHead>
            <TableHead>نشط</TableHead>
            <TableHead>نظام المخزون</TableHead>
            <TableHead>الأكثر طلباً</TableHead>
            <TableHead className="w-[160px]">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              onUpdate={onUpdate}
              onOpenImages={onOpenImages}
              onOpenDescription={onOpenDescription}
              onOpenFeatures={onOpenFeatures}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
