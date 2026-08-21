import { format } from "date-fns";
import { toast } from "sonner";

type CSVRow = Record<string, string | number | null | undefined>;

function escapeCell(val: string | number | null | undefined): string {
  const str = val === null || val === undefined ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of objects to CSV and triggers a browser download.
 * Adds a UTF-8 BOM so Arabic characters render correctly in Excel.
 */
export function exportToCSV(data: CSVRow[], filename: string): void {
  if (!data.length) {
    toast.error("لا توجد بيانات للتصدير");
    return;
  }

  const headers = Object.keys(data[0]);
  const headerLine = headers.map(escapeCell).join(",");
  const rows = data.map((row) => headers.map((h) => escapeCell(row[h])).join(","));
  const csv = [headerLine, ...rows].join("\r\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success(`تم تصدير ${data.length} صف`);
}
