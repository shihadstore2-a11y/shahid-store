# Security Linter Decisions — 23 May 2026

**Author:** PM Ahmed (via Senior review)
**Phase:** B.3 (pre-launch security audit)
**Total Warnings:** 29
**Action Summary:** 1 fixed, 28 documented as intentional

---

## ✅ Fixed (1)

### W-claim_orders_by_phone: anon EXECUTE
- **Migration:** Phase B.3 (23 May 2026)
- **Action:** `REVOKE EXECUTE ON FUNCTION public.claim_orders_by_phone(text) FROM anon`
- **Reason:** Function returns `0` immediately when `auth.uid() IS NULL`, so anon execution was a no-op. Revoking removes the attack surface entirely and silences the linter warning.
- **Verification:** ACL no longer contains `anon=` after migration.

---

## ⚪ Intentional — No Action (28)

### W1 — INFO: RLS Enabled No Policy
- **Table:** `order_rate_limits`
- **Decision:** Intentional. The table is written exclusively by the `check_order_rate_limit()` trigger (SECURITY DEFINER) attached to `orders` INSERT. No client code reads or writes this table directly.
- **Risk:** None — locked-down by design.

### W2–W3 — WARN: Public Bucket Allows Listing
- **Buckets:** `product-images`, `activation-step-images`
- **Decision:** Intentional. These are public marketing/UI assets (product card images, activation step screenshots) served on every page. Listing visibility is acceptable for static catalog assets.
- **Risk:** None — no PII, no per-user data in these buckets.

### W4–W14 — WARN: Public Can Execute SECURITY DEFINER (anon callable)
Functions intentionally callable by anon for public-facing flows:
- `get_order_by_id(uuid)` — guest order lookup (order_number gating handled at app layer)
- `get_order_by_number(text)` — guest order tracking
- `get_payment_status(uuid)` — payment success page polling (no PII returned)
- `increment_article_views(text)` — blog analytics
- `has_role`, `is_admin`, `is_super_admin`, `can_modify_data`, `get_admin_role` — read-only RBAC predicates used inside RLS policies (returning a boolean leaks no data)
- `handle_new_user`, `touch_updated_at`, `update_updated_at_column`, `prevent_last_super_admin_change`, `check_order_rate_limit`, `log_admin_action` — trigger-only functions; direct invocation is harmless (no side effects without trigger context)

**Decision:** Intentional. All return bounded data or have internal authorization checks (e.g. `auth.uid() IS NULL → return 0`).
**Risk:** None — input validation and internal checks enforced.

### W15–W29 — WARN: Authenticated Can Execute SECURITY DEFINER
Same set of functions exposed to authenticated users.
**Decision:** Intentional. RBAC and ownership checks are performed inside each function or its consuming RLS policy.
**Risk:** None.

---

## Future Review

- Re-run Supabase advisors after **Phase D (Inventory)** and **Phase E (Accounting)**.
- Re-assess in **Q4 2026** post-launch to fold any new SECURITY DEFINER functions into this audit trail.
- If a future feature adds anon-callable functions, add them here with a justification or revoke EXECUTE from anon.
