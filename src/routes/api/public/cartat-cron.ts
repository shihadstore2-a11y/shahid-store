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

const handleCron = async ({ request }: { request: Request }) => {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("test") === "true") {
      const targetPhone = url.searchParams.get("phone") || "966500451602";
      const { sendMoatmtMessage } = await import("@/lib/moatmt.server");
      const testRes = await sendMoatmtMessage(
        targetPhone,
        "مرحباً بك! 👋 تم ربط بوت واتساب مؤتمت (Moatmt) بنجاح مع متجر ديوان البث 🚀",
      );
      return new Response(
        JSON.stringify({
          ok: testRes.ok,
          message: testRes.ok ? "Test message sent successfully" : "Failed to send test message",
          result: testRes,
          timestamp: new Date().toISOString(),
        }),
        {
          status: testRes.ok ? 200 : 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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

