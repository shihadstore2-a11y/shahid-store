// إنشاء مستخدم admin جديد بـ SERVICE_ROLE (محصور على super_admin)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. تحقّق من JWT — مرّر التوكن صراحةً لتفادي مشاكل ES256
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supaAuth = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await supaAuth.auth.getUser(token);
    if (userErr || !userData.user) {
      console.error("getUser failed:", userErr?.message, "tokenLen:", token.length);
      return json({ error: "unauthorized", detail: userErr?.message }, 401);
    }

    // 2. تأكّد أن المستدعي super_admin نشط
    const { data: caller } = await supaAuth
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!caller || caller.role !== "super_admin" || !caller.is_active) {
      return json({ error: "forbidden" }, 403);
    }

    // 3. validate body
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "invalid_body" }, 400);
    const { email, password, full_name, phone, role } = body as Record<string, string>;

    if (!email || !password || !full_name || !role) {
      return json({ error: "missing_fields" }, 400);
    }
    if (!["super_admin", "admin", "staff", "developer"].includes(role)) {
      return json({ error: "invalid_role" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "weak_password" }, 400);
    }

    // 4. SERVICE_ROLE client
    const admin = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr) {
      const msg = createErr.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return json({ error: "email_exists" }, 409);
      }
      return json({ error: "auth_creation_failed", detail: createErr.message }, 500);
    }

    // 5. ربط في admin_users
    const { error: linkErr } = await admin.from("admin_users").insert({
      user_id: created.user.id,
      role,
      full_name,
      email,
      phone: phone || null,
      is_active: true,
    });

    if (linkErr) {
      // rollback
      await admin.auth.admin.deleteUser(created.user.id).catch(() => null);
      return json({ error: "link_failed", detail: linkErr.message }, 500);
    }

    return json({ success: true, user_id: created.user.id, email: created.user.email });
  } catch (err) {
    return json({ error: "internal_error", detail: String(err) }, 500);
  }
});
