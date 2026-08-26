import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const AdminRoleSchema = z.enum([
  "super_admin",
  "admin",
  "developer",
  "staff",
  "orders_coupons_viewer",
]);

const CreateAdminInput = z.object({
  email: z.string().email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  full_name: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل"),
  phone: z.string().optional(),
  role: AdminRoleSchema,
});

export const createAdminUserServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateAdminInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // 1. التحقق من صلاحيات المشرف الحالي الطالب للعملية
    const { data: currentAdmin, error: adminErr } = await supabaseAdmin
      .from("admin_users")
      .select("id, role, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (adminErr || !currentAdmin) {
      throw new Error("غير مصرّح — تتطلب صلاحية المشرف العام أو المدير");
    }

    // السماح فقط للمشرف العام والمدير بإضافة مستخدمين جدد
    if (currentAdmin.role !== "super_admin" && currentAdmin.role !== "admin") {
      throw new Error("غير مصرّح — فقط المشرف العام أو المدير يمكنه إضافة مشرفين للمتجر");
    }

    const cleanEmail = data.email.toLowerCase().trim();
    const cleanPhone = data.phone ? data.phone.trim() : null;
    const cleanName = data.full_name.trim();

    // 2. إنشاء المستخدم في Supabase Auth مباشرة
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          phone: cleanPhone,
          role: data.role,
        },
      });

    let targetUserId = authUser?.user?.id;

    // إذا كان البريد مسجلاً مسبقاً في auth.users
    if (authError) {
      const errMsg = authError.message.toLowerCase();
      if (
        errMsg.includes("already registered") ||
        errMsg.includes("already exists") ||
        errMsg.includes("unique constraint") ||
        errMsg.includes("exists")
      ) {
        // جلب المستخدم الموجود وتحديث كلمة مروره وبياناته
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail,
        );

        if (existingUser) {
          targetUserId = existingUser.id;
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: data.password,
            email_confirm: true,
            user_metadata: {
              full_name: cleanName,
              phone: cleanPhone,
              role: data.role,
            },
          });
        } else {
          throw new Error("البريد الإلكتروني مسجل مسبقاً في النظام");
        }
      } else {
        throw new Error(`فشل إنشاء المستخدم: ${authError.message}`);
      }
    }

    if (!targetUserId) {
      throw new Error("تعذّر استخراج معرّف المستخدم الجديد");
    }

    // 3. إضافة أو تحديث السجل في جدول admin_users
    const { error: adminInsertErr } = await supabaseAdmin
      .from("admin_users")
      .upsert(
        {
          user_id: targetUserId,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone,
          role: data.role,
          is_active: true,
          permission_overrides: {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (adminInsertErr) {
      console.error(
        "[createAdminUserServerFn] admin_users insert error:",
        adminInsertErr,
      );
      throw new Error(
        `فشل تسجيل المشرف في قاعدة البيانات: ${adminInsertErr.message}`,
      );
    }

    // 4. تحديث جدول profiles بالتوازي
    try {
      await supabaseAdmin.from("profiles").upsert(
        {
          user_id: targetUserId,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone,
          role: data.role,
        },
        { onConflict: "user_id" },
      );
    } catch (e) {
      console.warn("[createAdminUserServerFn] profiles upsert warning:", e);
    }

    return {
      ok: true as const,
      user_id: targetUserId,
    };
  });
