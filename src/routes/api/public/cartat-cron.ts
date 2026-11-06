/**
 * نقطة نهاية لمعالجة السلات المتروكة تلقائياً وإرسال رسائل التذكير والتقييمات
 * متوافقة مع روابط cartat-cron السابقة وموجهة إلى Moatmt
 *
 * GET /api/public/cartat-cron
 * POST /api/public/cartat-cron
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  processAbandonedCartsAutomatic,
  processAutomaticReviewRequests,
} from "@/lib/moatmt.server";

const handleCron = async () => {
  try {
    const abandonedResult = await processAbandonedCartsAutomatic({
      maxHours: 24,
      limit: 15,
    });

    const reviewsResult = await processAutomaticReviewRequests({
      limit: 15,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: new Date().toISOString(),
        abandoned: abandonedResult,
        reviews: reviewsResult,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("[Cartat/Moatmt Cron] Error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || "Internal error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const Route = createFileRoute("/api/public/cartat-cron")({
  server: {
    handlers: {
      GET: handleCron,
      POST: handleCron,
    },
  },
});

