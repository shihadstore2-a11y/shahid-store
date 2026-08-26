import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  createAdminUserServerFn,
  adminResetPasswordServerFn,
  deleteAdminUserServerFn,
} from "@/lib/admin-users.functions";

export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type AdminUserRow = Database["public"]["Tables"]["admin_users"]["Row"];

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export const adminUsersQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
    staleTime: 30_000,
  });

export type CreateAdminPayload = {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: AdminRole;
};

export async function createAdminUser(payload: CreateAdminPayload): Promise<void> {
  // 1. محاولة استدعاء دالة RPC في قاعدة البيانات مباشرة (سلس وموثوق 100%)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "create_admin_user_rpc",
      {
        _email: payload.email.trim(),
        _password: payload.password,
        _full_name: payload.full_name.trim(),
        _phone: payload.phone?.trim() || null,
        _role: payload.role,
      },
    );

    if (!rpcErr && rpcData && typeof rpcData === "object") {
      const res = rpcData as Record<string, unknown>;
      if (res.success) {
        return;
      }
      if (res.error) {
        throw new Error(String(res.error));
      }
    }

    if (rpcErr) {
      console.warn("[createAdminUser] RPC error, trying server function fallback:", rpcErr);
    }
  } catch (rpcEx: any) {
    if (rpcEx.message && !rpcEx.message.includes("does not exist") && !rpcEx.message.includes("schema")) {
      throw rpcEx;
    }
    console.warn("[createAdminUser] RPC exception, using server fn fallback:", rpcEx);
  }

  // 2. Fallback: استدعاء دالة السيرفر
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await createAdminUserServerFn({
      data: {
        ...payload,
        authToken: token,
      },
    });

    if (!res || !res.ok) {
      throw new Error("فشل إنشاء المستخدم الإداري");
    }
  } catch (err: any) {
    console.error("[createAdminUser fallback error]", err);
    throw new Error(err.message || "فشل إنشاء المستخدم");
  }
}

export type UpdateAdminPayload = {
  id: string;
  full_name?: string;
  phone?: string | null;
  role?: AdminRole;
  password?: string;
};

export async function updateAdminUser(payload: UpdateAdminPayload): Promise<void> {
  const { id, password, ...rest } = payload;
  
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id, email")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("admin_users")
    .update({
      ...rest,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // تحديث كلمة المرور في حال إدخالها
  if (password && password.trim().length >= 6 && adminRow?.email) {
    let resetSucceeded = false;
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc("admin_reset_user_password_rpc", {
        _target_email: adminRow.email,
        _new_password: password.trim(),
      });

      if (!rpcErr && (!rpcRes || (rpcRes as any).success !== false)) {
        resetSucceeded = true;
      }
    } catch (rpcEx) {
      console.warn("[updateAdminUser] RPC exception, falling back to serverFn:", rpcEx);
    }

    // إذا فشل الـ RPC أو لم تكن الدالة موجودة بعد في الـ cache، نستخدم دالة السيرفر فوراً
    if (!resetSucceeded) {
      try {
        const { data: authSession } = await supabase.auth.getSession();
        const token = authSession.session?.access_token;
        await adminResetPasswordServerFn({
          data: {
            email: adminRow.email,
            password: password.trim(),
            authToken: token,
          },
        });
      } catch (fnErr: any) {
        throw new Error(fnErr.message || "تعذّر تغيير كلمة المرور");
      }
    }
  }

  if (adminRow?.user_id) {
    try {
      await supabase.from("profiles").upsert(
        {
          id: adminRow.user_id,
          user_id: adminRow.user_id,
          full_name: rest.full_name,
          phone: rest.phone ?? null,
          email: adminRow.email,
        },
        { onConflict: "user_id" },
      );
    } catch (e) {
      console.warn("[updateAdminUser] profiles upsert error:", e);
    }
  }
}

export async function deleteAdminUser(id: string): Promise<void> {
  // 1. محاولة الحذف عبر Supabase مباشرة
  try {
    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (!error) return;
  } catch (clientErr) {
    console.warn("[deleteAdminUser] client delete failed, trying serverFn:", clientErr);
  }

  // 2. Fallback إلى دالة السيرفر
  const { data: authSession } = await supabase.auth.getSession();
  const token = authSession.session?.access_token;

  const res = await deleteAdminUserServerFn({
    data: {
      id,
      authToken: token,
    },
  });

  if (!res || !res.ok) {
    throw new Error("فشل حذف المستخدم من الإدارة");
  }
}

export async function setAdminActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("admin_users")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// مولّد كلمة سر مؤقتة قوية (12 خانة، أحرف+أرقام+رموز)
export function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%*";
  const all = upper + lower + digits + symbols;
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

import type { PermissionOverrides } from "@/lib/admin-rbac";

// تحديث الصلاحيات الإضافية لحساب إدارة (إضافية فقط — JSONB).
export async function updateAdminPermissions(
  id: string,
  overrides: PermissionOverrides,
): Promise<void> {
  const { error } = await supabase
    .from("admin_users")
    .update({ permission_overrides: overrides as unknown as never })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
