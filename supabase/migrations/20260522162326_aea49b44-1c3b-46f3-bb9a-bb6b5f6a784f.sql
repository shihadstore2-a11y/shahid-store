-- Step 2.1: CHECK constraint on orders.status
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'initiated', 'paid', 'payment_failed', 'cancelled', 'failed', 'refunded', 'fulfilled'));

-- Step 2.2: Partial UNIQUE index on payment_transactions.provider_trans_id
CREATE UNIQUE INDEX idx_payment_transactions_provider_trans_id_unique
ON public.payment_transactions (provider_trans_id)
WHERE provider_trans_id IS NOT NULL;