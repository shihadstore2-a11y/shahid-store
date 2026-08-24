import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_IMAGES_PER_PRODUCT = 6;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type UploadValidationError = {
  code: "type" | "size";
  message: string;
};

export function validateImageFile(file: File): UploadValidationError | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      code: "type",
      message: `صيغة غير مدعومة (${file.name}) — JPG/PNG/WEBP فقط`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      code: "size",
      message: `حجم الصورة كبير (${file.name}) — الحد الأقصى 2MB`,
    };
  }
  return null;
}

function getExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

/** يرفع ملفاً ويعيد public URL */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const err = validateImageFile(file);
  if (err) throw new Error(err.message);

  const ext = getExtension(file);
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** يستخرج مسار التخزين من publicUrl */
function extractStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

/** حذف صورة من Storage (يتجاهل URLs خارجية) */
export async function deleteProductImageFromStorage(url: string): Promise<void> {
  const path = extractStoragePath(url);
  if (!path) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

/** تحديث مصفوفة image_urls في DB */
export async function updateProductImageUrls(
  productId: string,
  urls: string[],
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ image_urls: urls })
    .eq("id", productId);
  if (error) throw error;
}

export type StoreMediaItem = {
  url: string;
  sourceProductName?: string;
};

/** جلب كافة الصور المرفوعة سابقاً في المتجر لإعادة استخدامها في أي منتج */
export async function fetchStoreMediaLibrary(): Promise<StoreMediaItem[]> {
  const { data, error } = await supabase
    .from("products")
    .select("name_ar, image_urls")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const urlMap = new Map<string, StoreMediaItem>();
  for (const row of data ?? []) {
    const list = Array.isArray(row.image_urls) ? row.image_urls : [];
    for (const url of list) {
      if (typeof url === "string" && url.trim() && !url.includes("/logo.webp")) {
        if (!urlMap.has(url)) {
          urlMap.set(url, {
            url,
            sourceProductName: row.name_ar,
          });
        }
      }
    }
  }

  return Array.from(urlMap.values());
}

