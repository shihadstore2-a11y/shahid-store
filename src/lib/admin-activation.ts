import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { validateImageFile } from "./admin-product-images";
import { STORE_ID } from "./store-config";

export const ACTIVATION_STEPS_KEY = "activation_guide_steps";

export type ActivationStep = {
  id: string;
  device_type: string;
  step_order: number;
  title_ar: string;
  description_ar: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const DEVICE_TYPES = [
  { id: "android", label: "أندرويد / شاومي" },
  { id: "ios", label: "آيفون / آيباد" },
  { id: "samsung-tv", label: "Samsung TV" },
  { id: "lg-tv", label: "LG TV" },
  { id: "windows", label: "ويندوز" },
  { id: "mac", label: "ماك" },
] as const;

export type DeviceId = (typeof DEVICE_TYPES)[number]["id"];

export const INITIAL_DEFAULT_STEPS: ActivationStep[] = [
  // Android
  { id: "step-android-1", device_type: "android", step_order: 1, title_ar: "استلم بيانات اشتراكك", description_ar: "تصلك بيانات الدخول ورابط التحميل عبر البريد الإلكتروني والواتساب فور إتمام الطلب.", image_url: "/activation/android/step-1.jpg", is_active: true },
  { id: "step-android-2", device_type: "android", step_order: 2, title_ar: "افتح متجر التطبيقات", description_ar: "ثبّت تطبيق Downloader من Google Play أو Mi Store على جهازك.", image_url: "/activation/android/step-2.jpg", is_active: true },
  { id: "step-android-3", device_type: "android", step_order: 3, title_ar: "ثبّت تطبيق المشغّل عبر Downloader", description_ar: "افتح Downloader وأدخل الكود المرسل لك ثم اضغط GO ليبدأ تنزيل التطبيق.", image_url: "/activation/android/step-3.jpg", is_active: true },
  { id: "step-android-4", device_type: "android", step_order: 4, title_ar: "سجّل دخولك بالبيانات", description_ar: "افتح المشغّل وأدخل اسم المستخدم وكلمة المرور ورمز الخادم المرسلين لك.", image_url: "/activation/android/step-4.jpg", is_active: true },
  { id: "step-android-5", device_type: "android", step_order: 5, title_ar: "ابدأ المشاهدة", description_ar: "تظهر مكتبتك جاهزة بكامل الأقسام والقنوات.", image_url: "/activation/android/step-5.jpg", is_active: true },

  // iOS
  { id: "step-ios-1", device_type: "ios", step_order: 1, title_ar: "استلم بيانات اشتراكك", description_ar: "بعد إتمام طلبك من ديوان البث، تصلك بيانات التفعيل عبر البريد الإلكتروني والواتساب خلال دقائق.", image_url: "/activation/ios/step-1.jpg", is_active: true },
  { id: "step-ios-2", device_type: "ios", step_order: 2, title_ar: "افتح App Store على جهازك", description_ar: "ابحث عن تطبيق المشغّل الذي يصلك ضمن بيانات اشتراكك.", image_url: "/activation/ios/step-2.jpg", is_active: true },
  { id: "step-ios-3", device_type: "ios", step_order: 3, title_ar: "ثبّت تطبيق المشغّل", description_ar: "اضغط Get وانتظر التثبيت ثم افتح التطبيق.", image_url: "/activation/ios/step-3.jpg", is_active: true },
  { id: "step-ios-4", device_type: "ios", step_order: 4, title_ar: "سجّل دخولك بالبيانات", description_ar: "أدخل اسم المستخدم وكلمة المرور ورمز الخادم ثم اضغط تسجيل الدخول.", image_url: "/activation/ios/step-4.jpg", is_active: true },
  { id: "step-ios-5", device_type: "ios", step_order: 5, title_ar: "ابدأ المشاهدة", description_ar: "تظهر مكتبتك الكاملة جاهزة للمشاهدة بجودة عالية.", image_url: "/activation/ios/step-5.jpg", is_active: true },

  // Samsung TV
  { id: "step-samsung-1", device_type: "samsung-tv", step_order: 1, title_ar: "استلم بيانات اشتراكك", description_ar: "تصلك تعليمات التفعيل المخصصة لشاشات سامسونج.", image_url: "/activation/samsung-tv/step-1.jpg", is_active: true },
  { id: "step-samsung-2", device_type: "samsung-tv", step_order: 2, title_ar: "افتح Samsung Apps", description_ar: "ابحث عن تطبيق المشغّل المرسل لك وثبّته.", image_url: "/activation/samsung-tv/step-2.jpg", is_active: true },
  { id: "step-samsung-3", device_type: "samsung-tv", step_order: 3, title_ar: "افتح التطبيق", description_ar: "افتح التطبيق من قائمة تطبيقاتك على الشاشة.", image_url: "/activation/samsung-tv/step-3.jpg", is_active: true },
  { id: "step-samsung-4", device_type: "samsung-tv", step_order: 4, title_ar: "أرسل بيانات الجهاز للدعم", description_ar: "صوّر شاشة Device ID + Device Key وأرسلها على الواتساب.", image_url: "/activation/samsung-tv/step-4.jpg", is_active: true },
  { id: "step-samsung-5", device_type: "samsung-tv", step_order: 5, title_ar: "يُفعَّل اشتراكك تلقائياً", description_ar: "نربط اشتراكك خلال دقائق دون أي إعدادات منك.", image_url: "/activation/samsung-tv/step-5.jpg", is_active: true },

  // LG TV
  { id: "step-lg-1", device_type: "lg-tv", step_order: 1, title_ar: "استلم بيانات اشتراكك", description_ar: "تصلك تعليمات التفعيل المخصصة لشاشات LG.", image_url: null, is_active: true },
  { id: "step-lg-2", device_type: "lg-tv", step_order: 2, title_ar: "افتح LG Content Store", description_ar: "ابحث عن تطبيق المشغّل المرسل لك وثبّته.", image_url: null, is_active: true },
  { id: "step-lg-3", device_type: "lg-tv", step_order: 3, title_ar: "افتح التطبيق", description_ar: "افتح التطبيق من قائمة تطبيقاتك على الشاشة.", image_url: null, is_active: true },
  { id: "step-lg-4", device_type: "lg-tv", step_order: 4, title_ar: "أرسل بيانات الجهاز للدعم", description_ar: "صوّر شاشة Device ID + Device Key وأرسلها على الواتساب.", image_url: null, is_active: true },
  { id: "step-lg-5", device_type: "lg-tv", step_order: 5, title_ar: "يُفعَّل اشتراكك تلقائياً", description_ar: "نربط اشتراكك خلال دقائق دون أي إعدادات منك.", image_url: null, is_active: true },

  // Windows
  { id: "step-win-1", device_type: "windows", step_order: 1, title_ar: "استلم بيانات اشتراكك", description_ar: "تصلك البيانات ورابط التحميل عبر البريد والواتساب.", image_url: null, is_active: true },
  { id: "step-win-2", device_type: "windows", step_order: 2, title_ar: "حمّل المشغّل", description_ar: "افتح الرابط المرسل لك وحمّل ملف التثبيت.", image_url: null, is_active: true },
  { id: "step-win-3", device_type: "windows", step_order: 3, title_ar: "ثبّت البرنامج وافتحه", description_ar: "اتبع خطوات المُثبِّت حتى تظهر شاشة المشغّل.", image_url: null, is_active: true },
  { id: "step-win-4", device_type: "windows", step_order: 4, title_ar: "سجّل دخولك بالبيانات", description_ar: "أدخل اسم المستخدم وكلمة المرور.", image_url: null, is_active: true },
  { id: "step-win-5", device_type: "windows", step_order: 5, title_ar: "ابدأ المشاهدة", description_ar: "تظهر مكتبتك الكاملة جاهزة.", image_url: null, is_active: true },

  // Mac
  { id: "step-mac-1", device_type: "mac", step_order: 1, title_ar: "استلم بيانات اشتراكك", description_ar: "تصلك البيانات ورابط التحميل عبر البريد والواتساب.", image_url: null, is_active: true },
  { id: "step-mac-2", device_type: "mac", step_order: 2, title_ar: "حمّل المشغّل المتوافق مع macOS", description_ar: "حمّل ملف dmg من الرابط المرسل لك.", image_url: null, is_active: true },
  { id: "step-mac-3", device_type: "mac", step_order: 3, title_ar: "اسحب التطبيق إلى Applications", description_ar: "افتح dmg واسحب التطبيق إلى مجلد Applications.", image_url: null, is_active: true },
  { id: "step-mac-4", device_type: "mac", step_order: 4, title_ar: "سجّل دخولك بالبيانات", description_ar: "أدخل اسم المستخدم وكلمة المرور.", image_url: null, is_active: true },
  { id: "step-mac-5", device_type: "mac", step_order: 5, title_ar: "ابدأ المشاهدة", description_ar: "تظهر مكتبتك الكاملة جاهزة.", image_url: null, is_active: true },
];

export async function fetchAllActivationSteps(): Promise<ActivationStep[]> {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", ACTIVATION_STEPS_KEY)
      .eq("store_id", STORE_ID)
      .maybeSingle();

    if (error) {
      console.warn("[activation] fetchAllActivationSteps note:", error.message);
      return INITIAL_DEFAULT_STEPS;
    }

    if (!data?.value) {
      return INITIAL_DEFAULT_STEPS;
    }

    const parsed = JSON.parse(data.value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => a.step_order - b.step_order);
    }

    return INITIAL_DEFAULT_STEPS;
  } catch (err) {
    console.warn("[activation] fetchAllActivationSteps catch:", err);
    return INITIAL_DEFAULT_STEPS;
  }
}

export async function fetchPublicActivationSteps(): Promise<ActivationStep[]> {
  const steps = await fetchAllActivationSteps();
  return steps.filter((s) => s.is_active !== false);
}

export const allActivationStepsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "activation-steps", STORE_ID],
    queryFn: fetchAllActivationSteps,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

export const publicActivationStepsQueryOptions = () =>
  queryOptions({
    queryKey: ["activation-steps-public", STORE_ID],
    queryFn: fetchPublicActivationSteps,
    staleTime: 30_000,
    retry: false,
    refetchOnMount: "always",
  });

async function saveStepsToStore(steps: ActivationStep[]): Promise<void> {
  const { data: existing } = await supabase
    .from("store_settings")
    .select("id")
    .eq("store_id", STORE_ID)
    .eq("key", ACTIVATION_STEPS_KEY)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("store_settings")
      .update({
        value: JSON.stringify(steps),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("store_settings")
      .upsert(
        [
          {
            key: ACTIVATION_STEPS_KEY,
            value: JSON.stringify(steps),
            store_id: STORE_ID,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "store_id,key" },
      );
    if (error) throw new Error(error.message);
  }
}

export async function updateStep(
  id: string,
  patch: Partial<Pick<ActivationStep, "title_ar" | "description_ar" | "is_active" | "step_order" | "image_url">>,
): Promise<void> {
  const steps = await fetchAllActivationSteps();
  const idx = steps.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("الخطوة غير موجودة");

  steps[idx] = {
    ...steps[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };

  await saveStepsToStore(steps);
}

export async function createStep(payload: {
  device_type: string;
  step_order: number;
  title_ar: string;
  description_ar?: string;
}): Promise<void> {
  const steps = await fetchAllActivationSteps();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `step-${payload.device_type}-${Date.now()}`;

  const newStep: ActivationStep = {
    id,
    device_type: payload.device_type,
    step_order: payload.step_order,
    title_ar: payload.title_ar,
    description_ar: payload.description_ar || null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  steps.push(newStep);
  await saveStepsToStore(steps);
}

export async function deleteStep(id: string): Promise<void> {
  const steps = await fetchAllActivationSteps();
  const target = steps.find((s) => s.id === id);
  const filtered = steps.filter((s) => s.id !== id);

  if (target) {
    let order = 1;
    filtered.forEach((s) => {
      if (s.device_type === target.device_type) {
        s.step_order = order++;
      }
    });
  }

  await saveStepsToStore(filtered);
}

export async function swapStepOrder(a: ActivationStep, b: ActivationStep): Promise<void> {
  const steps = await fetchAllActivationSteps();
  const idxA = steps.findIndex((s) => s.id === a.id);
  const idxB = steps.findIndex((s) => s.id === b.id);
  if (idxA === -1 || idxB === -1) throw new Error("الخطوات المراد تبديلها غير موجودة");

  const orderA = steps[idxA].step_order;
  steps[idxA].step_order = steps[idxB].step_order;
  steps[idxB].step_order = orderA;

  await saveStepsToStore(steps);
}

// ===== Image Upload Helpers =====

export const ACTIVATION_IMAGES_BUCKET = "activation-step-images";

function getExtensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadActivationStepImage(
  step: ActivationStep,
  file: File,
): Promise<string> {
  const err = validateImageFile(file);
  if (err) throw new Error(err.message);

  const ext = getExtensionFromFile(file);
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${STORE_ID}/${step.device_type}/${step.id}/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage
    .from(ACTIVATION_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(ACTIVATION_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function extractActivationStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${ACTIVATION_IMAGES_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export async function deleteActivationStepImageFromStorage(url: string): Promise<void> {
  const path = extractActivationStoragePath(url);
  if (!path) return;
  const { error } = await supabase.storage.from(ACTIVATION_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

export async function updateStepImageUrl(stepId: string, url: string | null): Promise<void> {
  await updateStep(stepId, { image_url: url });
}
