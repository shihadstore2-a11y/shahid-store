import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STORE_ID } from "@/lib/store-config";
import type { TrackingConfig } from "./types";

export async function fetchTrackingConfig(): Promise<TrackingConfig> {
  try {
    let query = supabase.from("store_settings").select("key, value");
    if (STORE_ID) {
      query = query.eq("store_id", STORE_ID);
    }
    const { data, error } = await query.in("key", [
      "google_site_verification",
      "gtm_id",
      "ga4_measurement_id",
      "google_ads_id",
      "google_ads_purchase_label",
      "meta_pixel_id",
      "snapchat_pixel_id",
      "tiktok_pixel_id",
    ]);

    if (error) {
      console.warn("[Tracking] fetchTrackingConfig error:", error);
      return {};
    }

    const map: Record<string, string> = {};
    (data || []).forEach((r) => {
      if (r.value) map[r.key] = r.value;
    });

    const rawGtm = (map.gtm_id || "").trim();
    const rawGa4 = (map.ga4_measurement_id || "").trim();

    // كشف ذكي: إذا تم لصق كود G- في حقل GTM أو العكس يتعرف عليه تلقائياً
    const gtmId = rawGtm.startsWith("GTM-")
      ? rawGtm
      : rawGa4.startsWith("GTM-")
        ? rawGa4
        : rawGtm || null;

    const ga4MeasurementId = rawGa4.startsWith("G-")
      ? rawGa4
      : rawGtm.startsWith("G-")
        ? rawGtm
        : rawGa4 || null;

    return {
      googleSiteVerification: map.google_site_verification || null,
      gtmId,
      ga4MeasurementId,
      googleAdsId: map.google_ads_id || null,
      googleAdsPurchaseLabel: map.google_ads_purchase_label || null,
      metaPixelId: map.meta_pixel_id || null,
      snapchatPixelId: map.snapchat_pixel_id || null,
      tiktokPixelId: map.tiktok_pixel_id || null,
    };
  } catch (e) {
    console.warn("[Tracking] fetchTrackingConfig exception:", e);
    return {};
  }
}

export function useTrackingConfig() {
  return useQuery({
    queryKey: ["tracking-config", STORE_ID],
    queryFn: fetchTrackingConfig,
    staleTime: 5 * 60 * 1000,
  });
}
