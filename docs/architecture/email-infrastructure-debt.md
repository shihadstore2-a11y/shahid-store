# Email Infrastructure — Technical Debt Record

**Date:** 25 May 2026
**Decision Owner:** PM Ahmed + Senior judgment
**Status:** Accepted (Path 2 with Safeguards) — Branding DEFERRED to Phase G

---

## H.1.6 Email Branding — DEFERRED to Phase G (25 May 2026)

### Status
- ✅ Domain verified (`shahidstore.net`)
- ✅ pgmq infrastructure idle (4 tables + 4 RPCs + 2 queues)
- ✅ Email queue dispatcher route idle (`src/routes/lovable/email/queue/process.ts`)
- ❌ `pg_cron` disabled (**Safeguard 5 preserved**)
- ❌ React Email templates NOT scaffolded (no `auth-email-hook`)
- ❌ Arabic Dashboard templates NOT applied
- ❌ Sender Name unchanged (still `shahd`)

### Current Email Behavior (Functional Baseline)
- **Sender:** `noreply@auth.lovable.cloud`
- **Sender Name:** `shahd` (Lovable default)
- **Templates:** English defaults (Confirm Signup / Magic Link / Reset Password)
- **Confirmed working:** users receive confirmation, login works, full auth flow operational
- **Status:** Functional but un-branded — acceptable for launch

### Phase G Plan (Post-Launch)
1. Apply Senior decision Path A: scaffold `auth-email-hook` + 6 React Email templates + activate cron
2. Validate priority against real customer feedback (do users actually complain about English emails?)
3. Activate full custom domain branding (`Shahid Store <no-reply@notify.shahidstore.net>`)
4. Target brand quality ≥ 98%

### Why Deferred
- **R3 Doctrine:** project is in TESTING + LAUNCH phase — no new features, no scope creep
- Email branding is **nice-to-have**, not a launch blocker
- H.2–H.7 + Phase C take launch priority
- Real customer feedback > speculation about brand impact
- ~4 hours reclaimed for actual launch work
- Lovable Cloud UI does NOT expose independent Sender Name / template editor — only the scaffold trigger, which would also require breaking Safeguard 5 (cron) to function. Defer all of this together.

### Rule Until Phase G
🚫 No scaffold • 🚫 No cron activation • 🚫 No manual template work • 🚫 No re-opening this discussion

---


## What Got Built (Unintended Scope Expansion)

During H.1.6 email branding work, Lovable's `setup_email_infra` tool created an entire email queue infrastructure when the user's request was narrower (just configure sender domain + branded templates).

### Database
- 3 migrations: `20260525134344`, `20260525134357`, `20260525134851`
- 4 tables: `email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails`
- 4 RPCs: `enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`
- `pgmq` extension enabled
- 2 queues: `auth_emails` (high priority), `transactional_emails` (normal)

### Code
- `src/routes/lovable/email/queue/process.ts` (326 lines) — dispatcher reading pgmq, sending via Lovable Email API

### Dependencies
- `@lovable.dev/email-js` 0.0.4
- `@lovable.dev/webhooks-js` 0.0.1
- `@react-email/components` 1.0.12
- `react-email` 6.3.3
- (~110 transitive files in `node_modules`)

## Why Accepted (Senior Reasoning)

1. Lovable Cloud architecture requires this queue for custom-domain sending — alternative would be re-architecture later.
2. Owner (Thamer) already delegated NS records → rollback wastes effort.
3. Infrastructure is isolated: all 4 tables are `service_role`-only via RLS, no impact on Phase F / EdfaPay / catalog.
4. Cron job is NOT active yet (deferred to Safeguard 5) → zero runtime impact today.
5. No breaking change to existing auth/cart/admin flows.

## Long-term Maintenance Burden

- `pgmq` extension version management on Supabase upgrades
- Queue cleanup if abandoned (manual `DROP EXTENSION pgmq CASCADE`)
- Cron job monitoring once activated (5s interval, batch_size 10)
- 4 packages to keep updated, watch for breaking changes in `@lovable.dev/*` (0.0.x → unstable)
- `email_send_log` will grow unbounded → needs retention policy post-launch

## Rollback Procedure (if needed post-launch)

```sql
-- 1. Disable cron (if activated)
SELECT cron.unschedule('process-email-queue');

-- 2. Drop tables
DROP TABLE IF EXISTS public.email_send_log CASCADE;
DROP TABLE IF EXISTS public.email_send_state CASCADE;
DROP TABLE IF EXISTS public.email_unsubscribe_tokens CASCADE;
DROP TABLE IF EXISTS public.suppressed_emails CASCADE;

-- 3. Drop RPCs
DROP FUNCTION IF EXISTS public.enqueue_email CASCADE;
DROP FUNCTION IF EXISTS public.read_email_batch CASCADE;
DROP FUNCTION IF EXISTS public.delete_email CASCADE;
DROP FUNCTION IF EXISTS public.move_to_dlq CASCADE;

-- 4. Drop pgmq extension
DROP EXTENSION IF EXISTS pgmq CASCADE;
```

```bash
# Code rollback
rm src/routes/lovable/email/queue/process.ts
bun remove @lovable.dev/email-js @lovable.dev/webhooks-js \
  @react-email/components react-email
# Then regenerate routeTree.gen.ts via dev server restart
```

## Doctrine Violation Note (R2)

`setup_email_infra` was invoked without disclosing the full scope (4 tables + 4 RPCs + pgmq + dispatcher route + 4 packages). The user's request mentioned only "sender domain + templates". This violated R2 (no surprise infrastructure).

Lovable acknowledged this explicitly in the audit report dated 25 May 2026 and PM Ahmed accepted Path 2 (keep + complete) rather than punitive rollback.

**Future rule:** any tool that creates tables, extensions, routes, or installs >1 package MUST be disclosed in plan mode with explicit STOP point before execution.
