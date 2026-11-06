import React, { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import type { TrackingConfig } from "./types";
import { GoogleSearchConsoleMeta } from "./google-search-console";
import { GtmHeadScript, GtmBodyNoScript } from "./gtm";
import { getGa4Script } from "./ga4";
import { getGoogleAdsConfigScript } from "./google-ads";
import { getMetaPixelScript } from "./meta-pixel";
import { getSnapchatPixelScript } from "./snapchat-pixel";
import { getTikTokPixelScript } from "./tiktok-pixel";
import { trackPageView } from "./index";
import { useTrackingConfig } from "./useTrackingConfig";

/**
 * مكون متكامل لإدارة وتحميل كافة أكواد التتبع والبكسلات في المتجر
 */
export function TrackingScripts({ initialConfig }: { initialConfig?: TrackingConfig | null }) {
  // استخدام التكوين الأولي إن وجد مع التحديث اللحظي عبر TanStack Query
  const { data: dynamicConfig } = useTrackingConfig();
  const config = dynamicConfig || initialConfig;

  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // إرسال حدث PageView عند كل تنقل بين صفحات المتجر
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  if (!config) return null;

  const hasGtag = !!(config.ga4MeasurementId || config.googleAdsId);
  const ga4Script = getGa4Script(config.ga4MeasurementId);
  const gadsScript = getGoogleAdsConfigScript(config.googleAdsId);
  const metaScript = getMetaPixelScript(config.metaPixelId);
  const snapScript = getSnapchatPixelScript(config.snapchatPixelId);
  const tiktokScript = getTikTokPixelScript(config.tiktokPixelId);

  return (
    <>
      {/* 1. Google Search Console Meta */}
      <GoogleSearchConsoleMeta verificationCode={config.googleSiteVerification} />

      {/* 2. Google Tag Manager (GTM) */}
      <GtmHeadScript gtmId={config.gtmId} />
      <GtmBodyNoScript gtmId={config.gtmId} />

      {/* 3. Google gtag.js (مشترك بين GA4 و Google Ads) */}
      {hasGtag && (
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${config.ga4MeasurementId || config.googleAdsId}`}
        />
      )}
      {ga4Script && <script dangerouslySetInnerHTML={{ __html: ga4Script }} />}
      {gadsScript && <script dangerouslySetInnerHTML={{ __html: gadsScript }} />}

      {/* 4. Meta / Facebook Pixel */}
      {metaScript && <script dangerouslySetInnerHTML={{ __html: metaScript }} />}

      {/* 5. Snapchat Pixel */}
      {snapScript && <script dangerouslySetInnerHTML={{ __html: snapScript }} />}

      {/* 6. TikTok Pixel */}
      {tiktokScript && <script dangerouslySetInnerHTML={{ __html: tiktokScript }} />}
    </>
  );
}
