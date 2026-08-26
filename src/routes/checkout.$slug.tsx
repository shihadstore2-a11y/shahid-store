import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  AlertCircle,
  Check,
  
  ChevronLeft,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Tag,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ErrorFallback } from "@/components/ErrorFallback";
import { SiteLayout } from "@/components/SiteLayout";
import { TrustBar } from "@/components/checkout/TrustBar";
import { PreOrderWarning } from "@/components/checkout/PreOrderWarning";

import { fetchProductBySlug } from "@/lib/queries";
import {
  computeDirectTotalsWithCoupon,
  generateOrderNumber,
  VAT_RATE,
} from "@/lib/order";
import { validateCoupon } from "@/lib/coupons.functions";
import { formatSAR } from "@/lib/format";
import { getProductImage } from "@/lib/productVisuals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createEdfaPayCheckout } from "@/lib/edfapay.functions";
import { PhoneInputIntl } from "@/components/forms/PhoneInputIntl";
import { E164_REGEX, isSaudiE164, toE164, formatE164ForDisplay, detectCountry } from "@/lib/phone-intl";
import { useWhatsappLink } from "@/lib/whatsapp";
import { CheckoutAuthGate, type CheckoutAuthMode } from "@/components/checkout/CheckoutAuthGate";
import { toast } from "sonner";





const QtySchema = z.object({
  qty: z.coerce.number().int().min(1).max(5).optional().default(1),
});

export const Route = createFileRoute("/checkout/$slug")({
  validateSearch: (s) => QtySchema.parse(s),
  loader: async ({ params }) => {
    const data = await fetchProductBySlug(params.slug);
    if (!data.product) throw notFound();
    return { product: data.product, category: data.category };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: p ? `إتمام الطلب — ${p.name_ar} — شاهد ستور` : "إتمام الطلب — شاهد ستور" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black">المنتج غير موجود</h1>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          تصفح الباقات
        </Link>
      </div>
    </SiteLayout>
  ),
  component: CheckoutPage,
  errorComponent: (props) => <ErrorFallback {...props} />,
});

// J.1 ACTIVATED 28 May 2026 — E.164 phone, international support, EdfaPay Saudi-only via UX guard.
const E164Phone = z
  .string()
  .trim()
  .regex(E164_REGEX, "أدخل رقم جوال صحيح بالصيغة الدولية");

const ArabicLatinName = z
  .string()
  .trim()
  .min(5, "الاسم يجب أن يكون 5 حروف على الأقل")
  .max(80, "الاسم طويل جداً")
  .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/u, "الاسم يقبل حروفاً فقط");

const baseSchema = z.object({
  customer_name: ArabicLatinName,
  customer_phone: E164Phone,
  customer_email: z
    .string({ error: "البريد الإلكتروني مطلوب" })
    .trim()
    .toLowerCase()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد غير صحيحة")
    .max(120, "البريد طويل جداً"),
  // Option A: password validated conditionally in superRefine (28 May 2026)
  password: z.string().max(72, "كلمة المرور طويلة جداً").optional().or(z.literal("")),
  notes: z.string().trim().max(400).optional().or(z.literal("")),
  payment_method: z.literal("card"),
  agree: z.boolean().refine((v) => v === true, { message: "يجب الموافقة على الشروط" }),
});

type AuthGateState = { isLoggedIn: boolean; mode: CheckoutAuthMode };

// Schema factory — reads live auth state via ref so the resolver stays stable
// while password requirements adapt to login status + new/returning mode.
function makeCheckoutSchema(authRef: { current: AuthGateState }) {
  return baseSchema.superRefine((data, ctx) => {
    const { isLoggedIn, mode } = authRef.current;
    if (isLoggedIn) return; // logged-in users never need a password here
    const pw = data.password ?? "";
    if (mode === "returning") {
      if (pw.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "أدخل كلمة المرور",
        });
      }
    } else if (pw.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "كلمة المرور 8 أحرف على الأقل",
      });
    }
  });
}

type FormVals = z.infer<typeof baseSchema>;


function CheckoutPage() {
  const { product, category } = Route.useLoaderData();
  const { qty: qtyParam = 1 } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();


  const [qty, setQty] = useState<number>(Math.min(5, Math.max(1, qtyParam)));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createCheckoutFn = useServerFn(createEdfaPayCheckout);
  const validateCouponFn = useServerFn(validateCoupon);

  // Option A — auth gate state (28 May 2026)
  const [authMode, setAuthMode] = useState<CheckoutAuthMode>("new");
  const authRef = useRef<AuthGateState>({ isLoggedIn: !!user, mode: authMode });
  authRef.current = { isLoggedIn: !!user, mode: authMode };
  const checkoutResolver = useMemo(() => zodResolver(makeCheckoutSchema(authRef)), []);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_percent: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const unitPrice = product.sale_price ?? product.base_price;
  const hasDiscount = product.sale_price !== null && product.sale_price < product.base_price;
  const totals = useMemo(
    () => computeDirectTotalsWithCoupon(unitPrice, qty, appliedCoupon?.discount_percent ?? 0),
    [unitPrice, qty, appliedCoupon],
  );
  const cardImage = getProductImage(product.slug, category?.slug, product.image_urls);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    setCouponError(null);
    if (!code) return;
    if (!/^[A-Z0-9_-]{1,50}$/.test(code)) {
      setCouponError("الكود يقبل حروفاً إنجليزية وأرقاماً فقط");
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await validateCouponFn({
        data: {
          code,
          durationMonths: product.duration_months ?? 1,
          subtotalIncl: unitPrice * qty,
        },
      });
      if (!res.valid) {
        setAppliedCoupon(null);
        setCouponError(res.error);
        return;
      }
      setAppliedCoupon({
        code: res.coupon.code,
        discount_percent: res.coupon.discount_percent,
      });
      toast.success(`تم تطبيق خصم ${res.coupon.discount_percent}%`);
    } catch (err) {
      console.error("validateCoupon failed", err);
      setCouponError("تعذّر التحقّق من الكود حالياً. حاول لاحقاً.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, touchedFields },
    setValue,
    watch,
    trigger,
  } = useForm<FormVals>({
    resolver: checkoutResolver,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_email: user?.email ?? "",
      password: "",
      notes: "",
      payment_method: "card",
      agree: false,
    },
  });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneInitial, setPhoneInitial] = useState<string>("");
  // H.2.1: Track name fill source to resolve F.4 vs H.2 precedence (DB > Google metadata > user typing wins)
  const [nameSource, setNameSource] = useState<"empty" | "f4" | "h2" | "user">("empty");

  // Prefill customer name, phone, and email immediately when logged in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    // 1. التعبئة المباشرة الأولية من بيانات الجلسة والميتاداتا
    if (user.email && !watch("customer_email")) {
      setValue("customer_email", user.email, { shouldValidate: true });
    }

    const metaName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined);
    if (metaName && !watch("customer_name")) {
      setValue("customer_name", metaName, { shouldValidate: true });
      setNameSource("f4");
    }

    const metaPhone =
      (user.user_metadata?.phone as string | undefined) ||
      (user.phone as string | undefined);
    if (metaPhone && !watch("customer_phone")) {
      const e164 = toE164(metaPhone) || (metaPhone.startsWith("+") ? metaPhone : "+" + metaPhone.replace(/\D/g, ""));
      if (e164) {
        setValue("customer_phone", e164, { shouldValidate: true, shouldDirty: true });
        setPhoneInitial(e164);
      }
    }

    // 2. التحقق من جدول profiles وجدول المشرفين admin_users لجلب أحدث البيانات بدقة
    (async () => {
      try {
        const [profileRes, adminRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, phone, email")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("admin_users")
            .select("full_name, phone, email")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const pData = profileRes.data;
        const aData = adminRes.data;

        const finalName =
          pData?.full_name ||
          aData?.full_name ||
          metaName ||
          "";

        const finalPhone =
          pData?.phone ||
          aData?.phone ||
          metaPhone ||
          "";

        const finalEmail =
          pData?.email ||
          aData?.email ||
          user.email ||
          "";

        if (finalName) {
          setValue("customer_name", finalName, { shouldValidate: true });
          setNameSource("h2");
        }
        if (finalEmail && !watch("customer_email")) {
          setValue("customer_email", finalEmail, { shouldValidate: true });
        }
        if (finalPhone) {
          const e164 = toE164(finalPhone) || (finalPhone.startsWith("+") ? finalPhone : "+" + finalPhone.replace(/\D/g, ""));
          if (e164) {
            setValue("customer_phone", e164, { shouldValidate: true, shouldDirty: true });
            setPhoneInitial(e164);
          }
        }
      } catch (err) {
        console.warn("[checkout] profiles/admin_users fetch error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email, user?.phone, user?.user_metadata]);

  const paymentMethod = watch("payment_method");
  const phoneRaw = watch("customer_phone");
  const nameRaw = watch("customer_name");
  const emailRaw = watch("customer_email");
  const passwordRaw = watch("password") ?? "";
  const phoneValid = !!phoneRaw && E164_REGEX.test(phoneRaw);
  const isSaudi = !!phoneRaw && isSaudiE164(phoneRaw);
  const nameValid = !errors.customer_name && !!nameRaw && nameRaw.trim().length >= 5;
  const emailValid =
    !errors.customer_email && !!emailRaw && /.+@.+\..+/.test(emailRaw);

  // Option A — switch new/returning mode: clear password + re-validate
  const handleAuthModeChange = (m: CheckoutAuthMode) => {
    setAuthMode(m);
    setValue("password", "", { shouldValidate: false });
  };
  // Re-run password validation whenever the auth mode flips (ref-based schema)
  useEffect(() => {
    void trigger("password");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode]);


  // J.1: WhatsApp fallback for international customers (EdfaPay Saudi-only).
  const whatsappMessage = useMemo(() => {
    const lines = [
      "السلام عليكم 👋",
      "أحتاج إكمال طلب يدوياً:",
      "",
      `📦 المنتج: ${product.name_ar}`,
      `🔢 الكمية: ${qty}`,
      `👤 الاسم: ${nameRaw || "-"}`,
      `📱 الهاتف: ${phoneRaw ? formatE164ForDisplay(phoneRaw) : "-"}`,
      `✉️ البريد: ${emailRaw || "-"}`,
      "",
      "شكراً 🌟",
    ];
    return lines.join("\n");
  }, [product.name_ar, qty, nameRaw, phoneRaw, emailRaw]);
  const whatsappHref = useWhatsappLink(whatsappMessage);

  const onInvalid = (errs: typeof errors) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    const el = document.querySelector(`[name="${first}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLInputElement | null)?.focus?.();
  };

  const onSubmit = async (data: FormVals) => {
    setErrorMessage(null);

    // ─── STEP 1 — Auth integration (سلس وغير مانع لإتمام الشراء) ───
    let finalUserId: string | null = user?.id ?? null;
    if (!user && data.customer_email) {
      const email = data.customer_email;
      const pw = data.password ?? "";

      if (pw.length >= 6) {
        try {
          if (authMode === "returning") {
            const { data: signInData, error: signInErr } =
              await supabase.auth.signInWithPassword({
                email,
                password: pw,
              });
            if (!signInErr && signInData?.user) {
              finalUserId = signInData.user.id;
            }
          } else {
            const { data: signUpData, error: signUpErr } =
              await supabase.auth.signUp({
                email,
                password: pw,
                options: {
                  emailRedirectTo: window.location.origin + "/account",
                  data: {
                    full_name: data.customer_name,
                    phone: data.customer_phone,
                  },
                },
              });
            if (!signUpErr && signUpData?.user) {
              finalUserId = signUpData.user.id;
            }
          }
        } catch (authErr) {
          console.warn("[Checkout] Auth attempt non-blocking error:", authErr);
        }
      }
    }

    // Anti-tamper: إعادة تحقّق الكوبون من السيرفر قبل الإدراج

    let finalCouponCode: string | null = null;
    let finalDiscountPercent = 0;
    if (appliedCoupon) {
      try {
        const r = await validateCouponFn({
          data: {
            code: appliedCoupon.code,
            durationMonths: product.duration_months ?? 1,
            subtotalIncl: unitPrice * qty,
          },
        });
        if (!r.valid) {
          setAppliedCoupon(null);
          setCouponError(r.error);
          setErrorMessage("لم يعد كود الخصم صالحاً. أزِلْه أو جرّب كوداً آخر.");
          toast.error("كود الخصم غير صالح");
          return;
        }
        finalCouponCode = r.coupon.code;
        finalDiscountPercent = r.coupon.discount_percent;
      } catch (err) {
        console.error("re-validate coupon failed", err);
        setErrorMessage("تعذّر التحقّق من كود الخصم. حاول لاحقاً.");
        return;
      }
    }

    const finalTotals = computeDirectTotalsWithCoupon(unitPrice, qty, finalDiscountPercent);

    const orderNumber = generateOrderNumber();
    const orderId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const payload = {
      id: orderId,
      order_number: orderNumber,
      user_id: finalUserId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      city: null,
      notes: data.notes || null,
      items: [
        {
          product_id: product.id,
          product_slug: product.slug,
          product_name: product.name_ar,
          duration_months: product.duration_months,
          unit_price: unitPrice,
          qty,
        },
      ],
      subtotal: finalTotals.subtotalExcl,
      discount: finalTotals.discountIncl,
      vat: finalTotals.vat,
      total: finalTotals.totalIncl,
      coupon_code: finalCouponCode,
      payment_method: data.payment_method,
      status: "pending",
    };


    try {
      const { error } = await supabase.from("orders").insert(payload);
      if (error) {
        console.error("[Checkout] Order insert error:", error);
        if ((error as { code?: string })?.code === "P0001") {
          setErrorMessage(
            "يرجى الانتظار بضع ثوانٍ قبل إعادة إرسال طلب جديد.",
          );
        } else {
          setErrorMessage(
            error.message || "تعذّر إنشاء الطلب الآن. يرجى مراجعة البيانات والمحاولة مرة أخرى.",
          );
        }
        toast.error("لم يتم إرسال الطلب: " + (error.message || ""));
        return;
      }
    } catch (err: any) {
      console.error("[Checkout] Unexpected error:", err);
      setErrorMessage("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
      toast.error("لم يتم إرسال الطلب");
      return;
    }

    // H.3: Persist checkout data to profile (authenticated only).
    if (finalUserId) {
      try {
        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: finalUserId,
              full_name: data.customer_name.trim(),
              phone: data.customer_phone.trim(),
              email: data.customer_email.toLowerCase().trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

        await supabase.auth.updateUser({
          data: {
            full_name: data.customer_name.trim(),
            phone: data.customer_phone.trim(),
          },
        });
      } catch (e) {
        console.warn("[H.3] profile write failed (non-blocking)", e);
      }
    }

    // مسار الدفع البطاقي — EdfaPay (إنشاء الطلب وحفظه في السيرفر فوراً)
    if (data.payment_method === "card") {
      try {
        const customerEmail = data.customer_email;
        const res = await createCheckoutFn({
          data: {
            orderId,
            orderNumber,
            userId: finalUserId,
            amount: finalTotals.totalIncl,
            subtotal: finalTotals.subtotalExcl,
            discount: finalTotals.discountIncl,
            vat: finalTotals.vat,
            couponCode: finalCouponCode,
            notes: data.notes || null,
            items: [
              {
                product_id: product.id,
                product_slug: product.slug,
                product_name: product.name_ar,
                duration_months: product.duration_months,
                unit_price: unitPrice,
                qty,
              },
            ],
            description: `${product.name_ar} × ${qty}${finalCouponCode ? ` [${finalCouponCode}]` : ""}`.slice(0, 100),
            customerName: data.customer_name,
            customerPhone: data.customerPhone,
            customerCountry: detectCountry(data.customer_phone),
            customerEmail,
            origin: window.location.origin,
          },
        });

        if (!res.ok) {
          const msg = res.error || "تعذّر فتح صفحة الدفع. يرجى المحاولة لاحقاً.";
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }

        // توجيه المتصفح إلى صفحة الدفع المستضافة في EdfaPay
        if (typeof window !== "undefined") {
          window.location.href = res.redirectUrl;
        }
        return;
      } catch (err: any) {
        console.error("EdfaPay checkout failed", err);
        const errMsg = err?.message || "تعذّر الاتصال ببوابة الدفع. يرجى المحاولة لاحقاً.";
        setErrorMessage(errMsg);
        toast.error("خطأ في بوابة الدفع: " + errMsg);
        return;
      }
    }
  };




  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-6 lg:py-10">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4" />
          رجوع للمنتج
        </Link>

        <h1 className="mb-6 text-2xl font-black md:text-3xl">إتمام الطلب</h1>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {/* Product summary card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="flex gap-4 p-4 md:p-5">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-background md:h-28 md:w-28">
                  <img
                    src={cardImage}
                    alt={product.name_ar}
                    width={224}
                    height={224}
                    loading="eager"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    <h2 className="line-clamp-2 text-base font-black text-card-foreground md:text-lg">
                      {product.name_ar}
                    </h2>
                    {product.duration_months && (
                      <span className="mt-1.5 inline-flex items-center rounded-md border border-accent/30 bg-accent/5 px-2 py-0.5 text-[11px] font-bold text-accent">
                        {durationLabel(product.duration_months, product.slug)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="whitespace-nowrap text-xl font-black tabular-nums text-accent md:text-2xl">
                      {formatSAR(unitPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs tabular-nums text-muted-foreground line-through md:text-sm">
                        {formatSAR(product.base_price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border bg-background/40 px-4 py-3 md:px-5">
                <span className="text-sm font-bold text-foreground">الكمية</span>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-secondary disabled:opacity-40"
                    aria-label="تقليل الكمية"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-base font-black tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(5, q + 1))}
                    disabled={qty >= 5}
                    className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-secondary disabled:opacity-40"
                    aria-label="زيادة الكمية"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>



            {/* Customer */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] md:p-5 lg:p-6">
              <h2 className="mb-4 text-base font-black">بياناتك</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}
                <Field
                  label="الاسم الكامل"
                  required
                  icon={<User className="h-3.5 w-3.5 text-accent" />}
                  error={errors.customer_name?.message}
                  valid={nameValid}
                >
                  <input
                    {...register("customer_name", {
                      onChange: () => {
                        if (nameSource !== "user") setNameSource("user");
                      },
                    })}
                    autoComplete="name"
                    className={cn(
                      "input pe-10",
                      nameValid && "border-emerald-500/50",
                      errors.customer_name && "border-destructive/60",
                    )}
                    placeholder="مثال: محمد عبدالله"
                  />
                </Field>

                {/* Phone — International (J.1 activated 28 May 2026) */}
                <div className="block">
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Phone className="h-3.5 w-3.5 text-accent" />
                    رقم الجوال <span className="text-destructive">*</span>
                  </span>
                  <PhoneInputIntl
                    value={phoneInitial || phoneRaw}
                    onChange={(e164) => {
                      setValue("customer_phone", e164, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onBlur={() => setPhoneTouched(true)}
                    invalid={!!errors.customer_phone && (phoneTouched || touchedFields.customer_phone)}
                  />
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MessageSquare className="h-3 w-3 text-accent" />
                    سنستخدمه لإرسال بيانات التفعيل عبر واتساب
                  </p>
                  {errors.customer_phone && (phoneTouched || touchedFields.customer_phone) && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.customer_phone.message}
                    </p>
                  )}
                </div>


                {/* Email */}
                <div>
                  <Field
                    label="البريد الإلكتروني *"
                    icon={<Mail className="h-3.5 w-3.5 text-accent" />}
                    error={errors.customer_email?.message}
                    valid={emailValid}
                  >
                    <input
                      {...register("customer_email")}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      dir="ltr"
                      className={cn(
                        "input pe-10 text-right",
                        emailValid && "border-emerald-500/50",
                        errors.customer_email && "border-destructive/60",
                      )}
                      placeholder="ahmed@gmail.com"
                    />
                  </Field>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Mail className="h-3 w-3 text-accent" />
                    نُرسل تأكيد الطلب وبيانات الاشتراك على هذا البريد
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Field
                    label="ملاحظات (اختياري)"
                    icon={<MessageSquare className="h-3.5 w-3.5 text-accent" />}
                    error={errors.notes?.message}
                  >
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input resize-none"
                      placeholder="ملاحظات إضافية تساعدنا في تجهيز طلبك"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Option A — Auth gate (28 May 2026): مسجّل / جديد / عائد */}
            <CheckoutAuthGate
              isLoggedIn={!!user}
              loggedInEmail={user?.email}
              emailValid={emailValid}
              password={passwordRaw}
              onPasswordChange={(v) =>
                setValue("password", v, { shouldValidate: true, shouldDirty: true })
              }
              passwordError={errors.password?.message}
              mode={authMode}
              onModeChange={handleAuthModeChange}
            />


            {/* Coupon */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-3 flex items-center gap-2 text-base font-black">
                <Tag className="h-4 w-4 text-accent" /> كود الخصم
                <span className="text-xs font-normal text-muted-foreground">(اختياري)</span>
              </h2>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-success">
                    <Check className="h-4 w-4" />
                    <span>
                      تم تطبيق خصم {appliedCoupon.discount_percent}% — كود{" "}
                      <span className="font-mono tabular-nums">{appliedCoupon.code}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="flex items-center gap-1 text-xs font-bold text-muted-foreground transition hover:text-destructive"
                    aria-label="إزالة الكود"
                  >
                    <X className="h-3.5 w-3.5" /> إزالة
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ""));
                        if (couponError) setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="ادخل الكود هنا"
                      maxLength={50}
                      dir="ltr"
                      className="input flex-1 text-right font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim() || validatingCoupon}
                      className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-black text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                      {validatingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "تطبيق"
                      )}
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-2 text-xs font-bold text-destructive">{couponError}</p>
                  )}
                </>
              )}
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-black">
                  <Lock className="h-4 w-4 text-accent" /> طريقة الدفع
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-black text-success">
                  <ShieldCheck className="h-3 w-3" /> اتصال آمن
                </span>
              </div>

              <button
                type="button"
                onClick={() => setValue("payment_method", "card")}
                className={`group relative block w-full overflow-hidden rounded-xl border-2 p-4 text-right transition ${
                  paymentMethod === "card"
                    ? "border-accent bg-accent/5 shadow-[0_0_0_3px_rgba(212,175,55,0.08)]"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 text-accent ring-1 ring-accent/30">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black">بطاقة بنكية أو محفظة رقمية</span>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-black text-success">
                        مُوصى
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      ادفع بأمان عبر بوابة دفع معتمدة — تحقّق 3D Secure
                    </div>
                  </div>
                </div>

                {/* شريط الشعارات — مرتّب على كل المقاسات */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-border/60 pt-3 sm:justify-end sm:gap-2.5">
                  <PayLogo src="/payment-logos/mada.svg" alt="مدى" />
                  <PayLogo src="/payment-logos/visa.svg" alt="Visa" />
                  <PayLogo src="/payment-logos/mastercard.svg" alt="Mastercard" />
                  <PayLogo src="/payment-logos/apple-pay.svg" alt="Apple Pay" />
                </div>
              </button>

              {/* الدفع بالبطاقة متاح عالمياً — تنبيه FX للأرقام الدولية */}
              {phoneRaw && phoneValid && !isSaudi && (
                <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-foreground">
                        الدفع بالبطاقة متاح من السعودية وجميع أنحاء العالم 🌍
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        💱 المبلغ بالريال السعودي، ويُحوَّل تلقائياً بسعر صرف بنكك.
                      </p>
                    </div>
                  </div>
                </div>
              )}








              <label className="mt-4 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register("agree")}
                  className="mt-1 h-4 w-4"
                />
                <span className="text-muted-foreground">
                  أوافق على{" "}
                  <Link to="/terms" className="font-bold text-accent hover:underline">
                    الشروط والأحكام
                  </Link>{" "}
                  و{" "}
                  <Link to="/refund-policy" className="font-bold text-accent hover:underline">
                    سياسة الاسترجاع
                  </Link>
                  .
                </span>
              </label>
              {errors.agree && (
                <p className="mt-1 text-xs font-bold text-destructive">
                  {errors.agree.message}
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="h-fit space-y-4 rounded-2xl border border-accent/40 bg-card p-5 shadow-[var(--shadow-card)] ring-1 ring-accent/15 lg:sticky lg:top-24">
            <h2 className="text-lg font-black">ملخص الطلب</h2>
            <div className="space-y-2 text-sm">
              <Row
                label={`${product.name_ar.split("—")[0].trim()} × ${qty}`}
                value={formatSAR(unitPrice * qty)}
              />
              {appliedCoupon && totals.discountIncl > 0 && (
                <Row
                  label={`الخصم (${appliedCoupon.discount_percent}%)`}
                  value={`−${formatSAR(totals.discountIncl)}`}
                  className="text-success"
                />
              )}
              <div className="my-2 border-t border-border" />
              <Row label="المجموع الفرعي" value={formatSAR(totals.subtotalExcl)} />
              <Row
                label={`ضريبة القيمة المضافة (${Math.round(VAT_RATE * 100)}%)`}
                value={formatSAR(totals.vat)}
              />
              <div className="my-2 border-t border-border" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-black">الإجمالي</span>
                <span className="shrink-0 whitespace-nowrap text-xl font-black tabular-nums text-accent">
                  {formatSAR(totals.totalIncl)}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <p className="text-sm font-bold text-destructive">{errorMessage}</p>
              </div>
            )}

            <PreOrderWarning slug={product.slug} duration={product.duration_months ?? 1} />

            <TrustBar />

            {/* زر الدفع — متاح للجميع (سعودي + دولي) عبر EdfaPay */}
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-black text-accent-foreground shadow-[var(--shadow-gold)] transition hover:opacity-95 disabled:opacity-60"
              style={{ background: "var(--gradient-gold)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {user ? "جارٍ التوجيه للدفع..." : "جارٍ التحقق والتوجيه للدفع..."}
                </>
              ) : (
                <>إكمال الدفع — {formatSAR(totals.totalIncl)}</>
              )}
            </button>

            <p className="text-center text-[11px] text-muted-foreground">
              دفع آمن عبر بوابة معتمدة — تحقّق 3D Secure
            </p>

            {/* خيار ثانوي — الإكمال يدوياً عبر واتساب (غير إجباري) */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground transition hover:text-accent"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              تفضّل الإكمال يدوياً عبر واتساب؟
            </a>

          </aside>
        </form>
      </section>
    </SiteLayout>
  );
}

function durationLabel(months: number, slug: string): string {
  if (slug.endsWith("-2dev")) {
    if (months === 12) return "سنة كاملة · جهازان";
  }
  if (slug.includes("1y-plus-3-solo")) return "15 شهراً · شاشة فردية";
  if (slug.includes("1y-plus-3")) return "15 شهراً · شاشتان";
  if (months === 1) return "شهر واحد";
  if (months === 3) return "3 أشهر";
  if (months === 6) return "6 أشهر";
  if (months === 12) return "سنة كاملة";
  return `${months} شهراً`;
}

function Field({
  label,
  required,
  error,
  icon,
  valid,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  valid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-bold text-foreground">
        {icon}
        <span>
          {label} {required && <span className="text-destructive">*</span>}
        </span>
      </span>
      <span className="relative block">
        {children}
        {valid && (
          <Check className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
        )}
        {error && !valid && (
          <X className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
        )}
      </span>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      <style>{`.input{display:block;width:100%;border-radius:0.5rem;border:1px solid var(--input);background:var(--background);padding:0.625rem 0.75rem;font-size:1rem;line-height:1.25rem;color:var(--foreground);outline:none;height:3rem}.input:focus{box-shadow:0 0 0 2px var(--ring)}textarea.input{height:auto;min-height:5.5rem}`}</style>
    </label>
  );
}

function PayOption({
  value,
  current,
  onSelect,
  icon,
  title,
  desc,
  disabled,
  recommended,
  footer,
}: {
  value: "card";
  current: string;
  onSelect: (v: "card") => void;
  icon: React.ReactNode;
  title: string;

  desc: string;
  disabled?: boolean;
  recommended?: boolean;
  footer?: React.ReactNode;
}) {
  const sel = current === value;
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(value)}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-xl border-2 p-3 text-right transition ${
        sel
          ? "border-accent bg-accent/5"
          : "border-border bg-card hover:border-accent/40"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black">{title}</span>
          {recommended && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-black text-success">
              مُوصى
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </button>
  );
}

function PayLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <span
      title={alt}
      className="inline-flex h-7 items-center justify-center rounded-md bg-white px-1.5 ring-1 ring-border/60 shadow-sm"
    >
      <img src={src} alt={alt} loading="lazy" className="h-4 w-auto" />
    </span>
  );
}


function Row({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`shrink-0 whitespace-nowrap font-bold tabular-nums ${className}`}>
        {value}
      </span>
    </div>
  );
}
