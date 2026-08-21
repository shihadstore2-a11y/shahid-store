# J.1 — Strategic Pivot: Saudi Launch + International Infrastructure Ready

> Decision date: 27 May 2026 — Authority: PM Ahmed (Senior 16y) + Owner ثامر approval implicit

## Rationale

J.1 "Phone Format Global LITE" was originally scoped as a full frontend + backend rollout (4 RPCs + shared `<PhoneInputIntl>` component + EdfaPay guard + checkout/register UI swap). Mid-implementation it became clear the surface area was wider than estimated and risked the launch window for higher-priority items (D.1, D.2, D.3, D.6).

**Decision:** ship the DB-level infrastructure (zero user-visible risk) and defer the frontend swap to a post-launch sub-task. This gives us:

- A safe Saudi-only checkout/register that works today.
- A DB ready to accept E.164 the moment the frontend flips — no migration churn later.

## What was completed (KEEP — do not remove)

| Layer | Artifact | Status |
|---|---|---|
| DB | `normalize_phone_to_e164()` SQL helper | ✅ live |
| DB | `orders_anon_insert` RLS — dual-format regex `^(\+[1-9]\d{6,14}|05[0-9]{8})$` | ✅ live |
| DB | RPC `get_email_by_phone` — dual-mode lookup | ✅ live |
| DB | RPC `claim_orders_by_phone` — dual-mode match | ✅ live |
| DB | Trigger `check_order_rate_limit` — canonical E.164 storage | ✅ live |
| Frontend | `src/lib/phone-intl.ts` — validation/normalization library | ✅ shipped, unused by app code |
| Frontend | `src/components/forms/PhoneInputIntl.tsx` — international input component | ✅ shipped, unused by app code |
| Dep | `libphonenumber-js` | ✅ installed |

## What was reverted (this commit)

`src/routes/checkout.$slug.tsx` — restored to Saudi-only schema (`/^05[0-9]{8}$/`), original `phoneDisplay` + `normalizePhoneForDB` + `formatPhoneDisplay` helpers, and the `+966` UI split. EdfaPay flow untouched.

## What was never touched

- `src/routes/register.tsx` — Saudi-only schema unchanged.
- `src/lib/edfapay.functions.ts` — Saudi-only regex + `phoneIntl = "+966" + ...` conversion intact.
- `src/lib/whatsapp.ts` / `whatsapp-phone.ts` — unchanged.

## Activation steps (post-launch, ~30–45 min)

When the team is ready to enable international phones in the UI:

1. **checkout.$slug.tsx + register.tsx** — swap `SaudiPhone` schema for `E164Phone` (import `E164_REGEX` from `@/lib/phone-intl`).
2. **Replace phone UI** with `<PhoneInputIntl value={...} onChange={(e164) => setValue("customer_phone", e164)} />`.
3. **EdfaPay UX guard** — when the selected country !== SA, hide the "card" payment button and show a `💳 السعودي فقط` badge (server-side rejection already exists as defense-in-depth via the regex in `edfapay.functions.ts`).
4. **Smoke test** — Saudi `+966...` E.164 + UAE `+971...` rejection on card.

No DB migration is needed at activation — the infrastructure already accepts both formats.

## Reasoning artifact

> "J.1 Full Global = أكثر تعقيداً من المتوقّع. Time invested لم يُهدر — البنية التحتية في DB. Time remaining محدود لـ launch. Pivot to Saudi Launch + International Infrastructure Ready preserves value without blocking."
