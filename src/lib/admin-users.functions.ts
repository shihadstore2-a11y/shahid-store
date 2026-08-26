import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
  authToken: z.string().optional(),
});

export const createAdminUserServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateAdminInput.parse(input))
  .handler(async ({ data }) => {
    // 1. التحقق من هوية وصلاحية المشرف الذي يقوم بإنشاء الحساب
    let isAuthorized = false;

    if (data.authToken) {
      try {
        const { data: authData, error: authVerifyErr } =
          await supabaseAdmin.auth.getUser(data.authToken);

        if (!authVerifyErr && authData?.user) {
          const user = authData.user;
          const userEmail = user.email ? user.email.toLowerCase().trim() : "";

          // فحص هل هو مشرف عام أو مدير نشط في admin_users
          const { data: adminRecord } = await supabaseAdmin
            .from("admin_users")
            .select("id, role, is_active")
            .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
            .eq("is_active", true)
            .maybeSingle();

          if (
            adminRecord &&
            (adminRecord.role === "super_admin" ||
              adminRecord.role === "admin" ||
              adminRecord.role === "developer")
          ) {
            isAuthorized = true;
          }
        }
      } catch (e) {
        console.warn("[createAdminUserServerFn] auth check exception:", e);
      }
    }

    // إذا لم يكن مصرحاً
    if (!isAuthorized) {
      // فحص أخير: إذا كان هناك مشرف مسجل بالفعل يطابق الإيميل
      throw new Error("غير مصرّح — تتطلب صلاحية المشرف العام أو مدير النظام");
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
        throw new Error(`فشل إنشاء حساب المستخدم: ${authError.message}`);
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
        `فشل تعيين الصلاحيات في قاعدة البيانات: ${adminInsertErr.message}`,
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
