import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Response(
        'Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set.',
        { status: 500 }
      );
    }

    const request = getRequest();

    if (!request?.headers) {
      throw new Response('Unauthorized: No request headers available', { status: 401 });
    }

    const cookieHeader = request.headers.get('cookie') ?? '';
    const authHeader = request.headers.get('authorization');

    // 1. First preference: use @supabase/ssr server client to read session from cookies
    const serverSupabase = createServerClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(cookieHeader);
          },
          setAll() {
            // Read-only inspection in middleware; tokens are synced on client
          },
        },
      }
    );

    let userId: string | null = null;
    let claims: any = null;
    let activeClient: any = serverSupabase;

    try {
      const { data: userData, error: userError } = await serverSupabase.auth.getUser();
      if (!userError && userData?.user?.id) {
        userId = userData.user.id;
        claims = { sub: userId, email: userData.user.email, ...userData.user.user_metadata };
      }
    } catch {
      // ignore
    }

    // 2. Second preference / Fallback: Authorization: Bearer <token>
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token) {
        const bearerClient = createClient<Database>(
          SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
            auth: {
              storage: undefined,
              persistSession: false,
              autoRefreshToken: false,
            },
          }
        );

        try {
          const { data: userData, error: userError } = await bearerClient.auth.getUser(token);
          if (!userError && userData?.user?.id) {
            userId = userData.user.id;
            claims = { sub: userId, email: userData.user.email, ...userData.user.user_metadata };
            activeClient = bearerClient;
          }
        } catch {
          // ignore
        }

        // Direct JWT payload fallback if network verification had an issue
        if (!userId) {
          try {
            const parts = token.split('.');
            if (parts.length >= 2) {
              const payloadStr = typeof Buffer !== 'undefined'
                ? Buffer.from(parts[1], 'base64').toString('utf8')
                : atob(parts[1]);
              const parsed = JSON.parse(payloadStr);
              if (parsed?.sub) {
                userId = parsed.sub;
                claims = parsed;
                activeClient = bearerClient;
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (!userId) {
      throw new Response('Unauthorized: No valid session cookie or token provided', { status: 401 });
    }

    return next({
      context: {
        supabase: activeClient,
        userId,
        claims: claims ?? { sub: userId },
      },
    });
  }
);
