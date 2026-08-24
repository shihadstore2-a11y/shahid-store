import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductRow } from "./ProductRow";
import type { AdminProductRow, AdminProductUpdate, AdminCategory } from "@/lib/admin-products";

export function ProductsTable({
  rows,
  categories = [],
  onUpdate,
  onDelete,
  onOpenImages,
  onOpenDescription,
  onOpenFeatures,
  onOpenCompatibility,
}: {
  rows: AdminProductRow[];
  categories?: AdminCategory[];
  onUpdate: (id: string, updates: AdminProductUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenImages: (id: string) => void;
  onOpenDescription: (id: string) => void;
  onOpenFeatures: (id: string) => void;
  onOpenCompatibility: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px] text-center">الصورة</TableHead>
            <TableHead className="min-w-[180px] text-right">الاسم</TableHead>
            <TableHead className="min-w-[130px] text-right">الفئة</TableHead>
            <TableHead className="min-w-[150px] text-right">التسعير</TableHead>
            <TableHead className="w-[70px] text-center">نشط</TableHead>
            <TableHead className="w-[100px] text-center">نظام المخزون</TableHead>
            <TableHead className="w-[80px] text-center">الأكثر طلباً</TableHead>
            <TableHead className="min-w-[190px] text-center">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              categories={categories}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onOpenImages={onOpenImages}
              onOpenDescription={onOpenDescription}
              onOpenFeatures={onOpenFeatures}
              onOpenCompatibility={onOpenCompatibility}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
