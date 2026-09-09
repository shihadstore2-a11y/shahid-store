import { supabase } from "@/integrations/supabase/client";
import { STORE_ID } from "./store-config";

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

function sanitizeFileName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "webp";
  const base = name.slice(0, name.lastIndexOf("."));
  const clean = base
    .toLowerCase()
    .replace(/[^\w\u0621-\u064A0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${clean || "product"}.${ext}`;
}

/** 
 * يرفع ملفاً مباشرة داخل مجلد المتجر الموحد STORE_ID بدون إنشاء مجلدات عشوائية
 * ويمنع التكرار باستخدام upsert
 */
export async function uploadProductImage(
  identifier: string, // slug or id
  file: File,
  options?: { customSlug?: string }
): Promise<string> {
  const err = validateImageFile(file);
  if (err) throw new Error(err.message);

  const ext = getExtension(file);

  // تحديد اسم ملف نظيف ومفهوم داخل المتجر بدون مجلدات عشوائية
  let fileName = "";
  const effectiveSlug = (options?.customSlug || identifier || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveSlug);

  if (effectiveSlug && !isUuid && effectiveSlug !== "temp") {
    const cleanSlug = effectiveSlug
      .toLowerCase()
      .replace(/[^\w\u0621-\u064A0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    const origBase = file.name.slice(0, file.name.lastIndexOf("."))
      .toLowerCase()
      .replace(/[^\w\u0621-\u064A0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (origBase && origBase !== "image" && origBase !== "file" && !cleanSlug.includes(origBase)) {
      fileName = `${cleanSlug}-${origBase}.${ext}`;
    } else {
      fileName = `${cleanSlug}.${ext}`;
    }
  } else {
    fileName = sanitizeFileName(file.name);
  }

  // مسار موحد تحت مجلد المتجر STORE_ID بدون أي مجلدات عشوائية
  const path = `${STORE_ID}/${fileName}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: true, // استبدال الملف في حال وجوده لمنع تكرار الملفات
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
    .eq("id", productId)
    .eq("store_id", STORE_ID);
  if (error) throw error;
}

export type StoreMediaItem = {
  url: string;
  sourceProductName?: string;
};

/** جلب كافة الصور المرفوعة سابقاً في المتجر لإعادة استخدامها ومنع تكرار الرفع */
export async function fetchStoreMediaLibrary(): Promise<StoreMediaItem[]> {
  const urlMap = new Map<string, StoreMediaItem>();

  // 1. جلب الملفات من مجلد المتجر في الـ Storage مباشرة
  try {
    const { data: storageFiles } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(STORE_ID, { limit: 100 });

    if (storageFiles && storageFiles.length > 0) {
      for (const sf of storageFiles) {
        if (sf.name && !sf.name.startsWith(".")) {
          const path = `${STORE_ID}/${sf.name}`;
          const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
          if (data?.publicUrl) {
            urlMap.set(data.publicUrl, {
              url: data.publicUrl,
              sourceProductName: sf.name,
            });
          }
        }
      }
    }
  } catch (stErr) {
    console.warn("Storage list fallback to DB:", stErr);
  }

  // 2. جلب الصور المستخدمة في المنتجات
  const { data: prods } = await supabase
    .from("products")
    .select("name_ar, image_urls")
    .eq("store_id", STORE_ID)
    .order("created_at", { ascending: false });

  for (const row of prods ?? []) {
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


