// ============= Phase F.6 — Order Recovery State Helpers =============
// منطق pure — قابل للاختبار، لا يعتمد على React/hooks.

export type OrderRecoveryVariant =
  | "success"
  | "info"
  | "warning"
  | "destructive"
  | "default";

export type OrderRecoveryAction = {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "whatsapp";
  external?: boolean;
};

export type OrderRecoveryState = {
  variant: OrderRecoveryVariant;
  iconKey: "check-circle" | "clock" | "x-circle" | "ban" | "loader" | "package";
  title: string;
  description?: string;
  action?: OrderRecoveryAction;
};

export type OrderForRecovery = {
  id: string;
  order_number: string;
  status: string;
  fulfilled_at: string | null;
};

/** يبني رسالة دعم واتساب بصياغة موحَّدة. */
export function buildSupportMessage(orderNumber: string): string {
  return `السلام عليكم،\n\nأحتاج مساعدة بشأن الطلب رقم: ${orderNumber}\n\nشكراً.`;
}

/**
 * يُحدِّد حالة الـ recovery لكل طلب.
 * @param order بيانات الطلب الأساسية.
 * @param supportLinkBuilder دالة تُرجع رابط الدعم (واتساب) لرسالة معيّنة.
 */
export function getRecoveryState(
  order: OrderForRecovery,
  supportLinkBuilder: (message: string) => string,
): OrderRecoveryState {
  // 1) مُسلَّم
  if (order.status === "fulfilled" && order.fulfilled_at) {
    return {
      variant: "success",
      iconKey: "check-circle",
      title: "اشتراكك جاهز",
      description: "اضغط لعرض بيانات الاشتراك",
      action: {
        label: "اعرض البيانات",
        href: `/account/order/${order.id}`,
        variant: "primary",
      },
    };
  }

  // 2) مدفوع لكن لم يُسلَّم بعد
  if (order.status === "paid" && !order.fulfilled_at) {
    return {
      variant: "info",
      iconKey: "clock",
      title: "تم استلام دفعتك",
      description: "نُسلِّم اشتراكك خلال 1-3 ساعات. ستصلك بياناته فور التسليم.",
      action: {
        label: "تواصل مع الدعم",
        href: supportLinkBuilder(buildSupportMessage(order.order_number)),
        variant: "whatsapp",
        external: true,
      },
    };
  }

  // 3) فشل الدفع
  if (order.status === "payment_failed" || order.status === "failed") {
    return {
      variant: "destructive",
      iconKey: "x-circle",
      title: "تعذّر إتمام الدفع",
      description: "حاول مرّة أخرى أو تواصل معنا للمساعدة.",
      action: {
        label: "أعد المحاولة",
        href: "/products",
        variant: "primary",
      },
    };
  }

  // 4) ملغى
  if (order.status === "cancelled") {
    return {
      variant: "warning",
      iconKey: "ban",
      title: "تم الإلغاء",
      description: "الطلب ملغى. يمكنك طلب اشتراك جديد.",
      action: {
        label: "اطلب اشتراكاً جديداً",
        href: "/products",
        variant: "secondary",
      },
    };
  }

  // 5) قيد المعالجة (pending / initiated)
  if (order.status === "pending" || order.status === "initiated") {
    return {
      variant: "default",
      iconKey: "loader",
      title: "قيد المعالجة",
      description: "نُعالج طلبك. تحقّق مرة أخرى بعد قليل.",
    };
  }

  // fallback
  return {
    variant: "default",
    iconKey: "package",
    title: order.status,
  };
}
