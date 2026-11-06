/**
 * نقطة نهاية لمعالجة السلات المتروكة تلقائياً وإرسال رسائل التذكير والتقييمات عبر منصة مؤتمت (Moatmt)
 *
 * يمكن استدعاؤها دورياً بواسطة Cron Job (مثل cron-job.org) كل 5 أو 10 دقائق:
 * GET /api/public/moatmt-cron
 * POST /api/public/moatmt-cron
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  processAbandonedCartsAutomatic,
  processAutomaticReviewRequests,
} from "@/lib/moatmt.server";

const handleCron = async () => {
  try {
    // 1. معالجة السلات المتروكة تلقائياً
    const abandonedResult = await processAbandonedCartsAutomatic({
      maxHours: 24,
      limit: 15,
    });

    // 2. معالجة طلبات التقييم للطلبات المسلّمة تلقائياً
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
    console.error("[Moatmt Cron] Error:", error);
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

export const Route = createFileRoute("/api/public/moatmt-cron")({
  server: {
    handlers: {
      GET: handleCron,
      POST: handleCron,
    },
  },
});

