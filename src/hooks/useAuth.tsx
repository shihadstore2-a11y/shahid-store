import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: false,
  signOut: async () => {},
});

/**
 * Phase F.5: Claim orphan guest orders by email on SIGNED_IN.
 * Fire-and-forget — never awaited inside the auth listener.
 */
async function handleOrderClaim(email: string, queryClient: QueryClient) {
  try {
    const { data: linkedCount, error } = await supabase.rpc(
      "claim_orders_by_email",
      { _email: email },
    );

    if (error) {
      console.warn("[F.5] claim_orders_by_email failed:", error.message);
      return;
    }

    if (linkedCount && linkedCount > 0) {
      await queryClient.invalidateQueries({ queryKey: ["my-orders"] });

      toast.success(
        linkedCount === 1
          ? "تم ربط طلب سابق بحسابك"
          : `تم ربط ${linkedCount} طلبات سابقة بحسابك`,
        { icon: "🔗", duration: 5000 },
      );
    }
    // Silent if 0 — no orphan orders to claim
  } catch (e) {
    console.error("[F.5] Order claim error (non-fatal):", e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(typeof window !== "undefined");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setLoading(false);

      // F.5 + H.9.2B: claim orphan orders only when inbox access is verified.
      // With email confirmation disabled, a password sign-in does NOT prove
      // ownership of the email → skip auto-claim to prevent hijack.
      // Magic Link (amr.method === 'otp') / OAuth providers prove inbox access.
      if (event === "SIGNED_IN" && sess?.user?.email) {
        const amr = (sess.user.app_metadata as { amr?: Array<{ method?: string }> })?.amr ?? [];
        const providers = (sess.user.app_metadata as { providers?: string[] })?.providers ?? [];
        const usedMagicLink = amr.some((e) => e?.method === "otp");
        const usedOAuth = providers.some((p) => p && p !== "email");
        const inboxVerified = usedMagicLink || usedOAuth;

        if (inboxVerified) {
          void handleOrderClaim(sess.user.email, queryClient);
        } else {
          console.log(
            "[F.5/H.9.2B] Password sign-in: skipping auto-claim (inbox not verified)",
          );
        }
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
