-- Migration: Create deposit_transactions table to log user custodial balance deposits
CREATE TABLE IF NOT EXISTS public.deposit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(36, 9) NOT NULL CHECK (amount > 0),
    tx_hash TEXT NOT NULL UNIQUE,
    network TEXT NOT NULL DEFAULT 'testnet',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;

-- Select policy: users can view their own deposits
CREATE POLICY select_own_deposits ON public.deposit_transactions
    FOR SELECT
    TO authenticated
    USING (profile_id = (SELECT id FROM public.profiles WHERE telegram_id = auth.jwt()->>'sub' OR id = profile_id LIMIT 1));

-- Grant access to service_role only for mutation
ALTER TABLE public.deposit_transactions OWNER TO postgres;
GRANT ALL ON TABLE public.deposit_transactions TO service_role;
