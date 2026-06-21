-- Миграция: 20260621140000_two_role_monetization_limits.sql
-- Описание: Добавление поддержки ролевой модели, платных подписок, баланса коннектов фрилансера
--            и создание таблицы connect_transactions для логирования изменений баланса коннектов.

-- 1. Добавление полей в таблицу public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_role text NOT NULL DEFAULT 'client' CHECK (active_role IN ('client', 'freelancer')),
  ADD COLUMN IF NOT EXISTS subscription_until timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_tier text,
  ADD COLUMN IF NOT EXISTS connects_balance integer NOT NULL DEFAULT 30 CHECK (connects_balance >= 0);

-- 2. Создание таблицы connect_transactions для учета коннектов фрилансеров
CREATE TABLE IF NOT EXISTS public.connect_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- отрицательное при тратах, положительное при покупках/грантах
  type text NOT NULL CHECK (type IN ('grant', 'purchase', 'spend', 'refund')),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Добавляем таблицу в публикацию реального времени Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.connect_transactions;

-- 3. Включение Row Level Security (RLS)
ALTER TABLE public.connect_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Политики безопасности (RLS) для connect_transactions
DROP POLICY IF EXISTS "connect_transactions_select_policy" ON public.connect_transactions;

-- Обычные пользователи могут читать только собственные транзакции коннектов
CREATE POLICY "connect_transactions_select_policy" ON public.connect_transactions
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- Примечание: Политики для INSERT/UPDATE/DELETE для обычных пользователей отсутствуют.
-- Запись доступна только через backend от имени роли service_role, которая обходит RLS.

-- 5. Разграничение привилегий (GRANT / REVOKE)
GRANT SELECT ON public.connect_transactions TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.connect_transactions FROM authenticated;

GRANT ALL ON public.connect_transactions TO service_role;
