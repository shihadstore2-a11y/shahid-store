ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS whatsapp_messages_sent JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.orders.whatsapp_messages_sent IS
  'Array of {template, sent_at, sent_by} entries logged when admin opens wa.me link from admin panel';