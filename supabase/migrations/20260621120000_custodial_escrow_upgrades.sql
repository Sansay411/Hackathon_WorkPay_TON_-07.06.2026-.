-- 1. Extend Deals Table to track hot wallet reference state
ALTER TABLE public.deals 
  ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(36, 9) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_token TEXT NOT NULL DEFAULT 'USDT',
  ADD COLUMN IF NOT EXISTS refund_tx_hash TEXT UNIQUE;

-- 2. Payout logs to track platform payouts to freelancers or refunds to clients
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  recipient_wallet TEXT NOT NULL,
  amount NUMERIC(36, 9) NOT NULL CHECK (amount > 0),
  asset TEXT NOT NULL DEFAULT 'TON',
  fee_deducted NUMERIC(36, 9) NOT NULL DEFAULT 0,
  tx_hash TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;

-- Simple select policy matching foundation style
CREATE POLICY "payouts are readable by authenticated users"
ON public.payouts FOR SELECT TO authenticated
USING (true);
