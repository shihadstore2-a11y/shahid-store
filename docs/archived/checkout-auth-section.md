# CheckoutAuthSection (F.4) — Archived 27 May 2026

## Why removed
- Visual prominence caused pre-pay friction
- Duplicated SaveInfoCTA post-pay functionality
- Industry best practice: no pre-checkout auth offers
- PM Ahmed decision after Senior 16y UX analysis

## Replaced by
- Logged-in confirmation banner inside `src/routes/checkout.$slug.tsx`
  (emerald card, only visible when `user` exists)
- Enhanced `SaveInfoCTA` on `/order-success/$id` (post-pay primary path)
- F.2 `claim_orders_by_email` + F.5 `useAuth.onAuthStateChange`
  + F.7 Magic Link logic — unchanged (business logic intact)

## Original component
- File: `src/components/checkout/CheckoutAuthSection.tsx` (266 lines)
- 3 states: logged-in / magic-sent / guest
- Magic Link via `supabase.auth.signInWithOtp`
- 60s cooldown protection
- H.5 prefill `/register` link
- Can be revived from git history if needed.
