import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { validateImageFile } from "./admin-product-images";

export type ActivationStep = Database["public"]["Tables"]["activation_steps"]["Row"];

export const DEVICE_TYPES = [
  { id: "ios", label: "آيفون / آيباد" },
  { id: "android", label: "أندرويد" },
  { id: "samsung-tv", label: "Samsung TV" },
  { id: "lg-tv", label: "LG TV" },
  { id: "windows", label: "ويندوز" },
  { id: "mac", label: "ماك" },
] as const;

export type DeviceId = (typeof DEVICE_TYPES)[number]["id"];

export async function fetchAllActivationSteps(): Promise<ActivationStep[]> {
  const { data, error } = await supabase
    .from("activation_steps")
    .select("*")
    .order("device_type", { ascending: true })
    .order("step_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPublicActivationSteps(): Promise<ActivationStep[]> {
  const { data, error } = await supabase
    .from("activation_steps")
    .select("*")
    .eq("is_active", true)
    .order("device_type", { ascending: true })
    .order("step_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const allActivationStepsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "activation-steps"],
    queryFn: fetchAllActivationSteps,
    staleTime: 30_000,
  });

export const publicActivationStepsQueryOptions = () =>
  queryOptions({
    queryKey: ["activation-steps-public", "v2"],
    queryFn: fetchPublicActivationSteps,
    staleTime: 30_000,
    refetchOnMount: "always",
  });

export async function updateStep(
  id: string,
  patch: Partial<Pick<ActivationStep, "title_ar" | "description_ar" | "is_active" | "step_order" | "image_url">>,
): Promise<void> {
  const { error } = await supabase.from("activation_steps").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createStep(payload: {
  device_type: string;
  step_order: number;
  title_ar: string;
  description_ar?: string;
}): Promise<void> {
  const { error } = await supabase.from("activation_steps").insert(payload);
  if (error) throw new Error(error.message);
}

export async function deleteStep(id: string): Promise<void> {
  const { error } = await supabase.from("activation_steps").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Swap order between two steps (atomic via 3-step temp swap to avoid UNIQUE violation)
export async function swapStepOrder(a: ActivationStep, b: ActivationStep): Promise<void> {
  // Use a temp negative value to avoid UNIQUE(device_type, step_order)
  const tmp = -Math.abs(a.step_order) - 1000;
  let { error } = await supabase.from("activation_steps").update({ step_order: tmp }).eq("id", a.id);
  if (error) throw new Error(error.message);
  ({ error } = await supabase.from("activation_steps").update({ step_order: a.step_order }).eq("id", b.id));
  if (error) throw new Error(error.message);
  ({ error } = await supabase.from("activation_steps").update({ step_order: b.step_order }).eq("id", a.id));
  if (error) throw new Error(error.message);
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
  const path = `${step.device_type}/${step.id}/${Date.now()}-${rand}.${ext}`;

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
