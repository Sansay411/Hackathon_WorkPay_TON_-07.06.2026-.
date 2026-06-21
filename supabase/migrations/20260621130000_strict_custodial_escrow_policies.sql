-- Миграция: 20260621130000_strict_custodial_escrow_policies.sql
-- Описание: Добавление полей для платформенных комиссий и возвратов, пересоздание таблицы payouts
--            с триггером и строгими проверками статуса, и полный пересмотр политик RLS.

-- 1. ДОБАВЛЕНИЕ/ОБНОВЛЕНИЕ ПОЛЕЙ В ТАБЛИЦУ public.deals
-- Добавляем поля, если они еще не созданы
ALTER TABLE public.deals 
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(36, 9) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_token text NOT NULL DEFAULT 'TON',
  ADD COLUMN IF NOT EXISTS refund_tx_hash text UNIQUE;

-- Гарантируем, что значение по умолчанию для platform_fee_token установлено в 'TON'
ALTER TABLE public.deals 
  ALTER COLUMN platform_fee_token SET DEFAULT 'TON';


-- 2. СОЗДАНИЕ/ПЕРЕСОЗДАНИЕ ТАБЛИЦЫ public.payouts
-- Удаляем старую таблицу (если она была создана в предыдущих черновых миграциях), чтобы пересоздать ее с чистой структурой и ограничениями
DROP TABLE IF EXISTS public.payouts CASCADE;

CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_wallet text NOT NULL,
  amount numeric(36, 9) NOT NULL CHECK (amount > 0),
  asset text NOT NULL DEFAULT 'TON',
  fee_deducted numeric(36, 9) NOT NULL DEFAULT 0,
  tx_hash text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Добавляем триггер автоматического обновления времени updated_at для payouts
CREATE TRIGGER payouts_set_updated_at 
  BEFORE UPDATE ON public.payouts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_updated_at();

-- Добавляем таблицу payouts в публикацию реального времени Supabase для отслеживания изменений статусов транзакций
ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;


-- 3. ПОЛНЫЙ ПЕРЕСМОТР ПОЛИТИК ROW LEVEL SECURITY (RLS)

-- Активируем RLS для всех целевых таблиц
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 3.1. Политики для таблицы public.deals
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "deal participants can read deals" ON public.deals;
DROP POLICY IF EXISTS "authenticated users can create deals" ON public.deals;
DROP POLICY IF EXISTS "deal participants can update deals" ON public.deals;
DROP POLICY IF EXISTS "deals_select_policy" ON public.deals;
DROP POLICY IF EXISTS "deals_insert_policy" ON public.deals;
DROP POLICY IF EXISTS "deals_update_policy" ON public.deals;

-- SELECT: Участник сделки (клиент или фрилансер) может просматривать её
CREATE POLICY "deals_select_policy" ON public.deals
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR freelancer_id = auth.uid());

-- INSERT: Пользователь может создавать сделку только в качестве клиента
CREATE POLICY "deals_insert_policy" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

-- UPDATE: Изменять сделку могут только её участники
CREATE POLICY "deals_update_policy" ON public.deals
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid() OR freelancer_id = auth.uid())
  WITH CHECK (client_id = auth.uid() OR freelancer_id = auth.uid());


-- -------------------------------------------------------------
-- 3.2. Политики для таблицы public.payments
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "payments are readable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "payments are writable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;

-- SELECT: Участники сделки могут просматривать платежи по этой сделке
CREATE POLICY "payments_select_policy" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = payments.deal_id
        AND (deals.client_id = auth.uid() OR deals.freelancer_id = auth.uid())
    )
  );

-- Примечание: Политики для INSERT/UPDATE/DELETE для обычных пользователей отсутствуют.
-- Запись доступна только через backend от имени роли service_role, которая обходит RLS.


-- -------------------------------------------------------------
-- 3.3. Политики для таблицы public.payouts
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "payouts are readable by authenticated users" ON public.payouts;
DROP POLICY IF EXISTS "payouts_select_policy" ON public.payouts;

-- SELECT: Участники сделки могут просматривать выплаты по этой сделке
CREATE POLICY "payouts_select_policy" ON public.payouts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = payouts.deal_id
        AND (deals.client_id = auth.uid() OR deals.freelancer_id = auth.uid())
    )
  );

-- Примечание: Запись в payouts разрешена только для service_role. Для authenticated доступен только SELECT.


-- -------------------------------------------------------------
-- 3.4. Политики для таблицы public.deliveries
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "deliveries are readable by authenticated users" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries are writable by authenticated users" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_select_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_insert_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_update_policy" ON public.deliveries;

-- SELECT: Участники сделки могут видеть отправленные файлы/результаты работы (deliveries)
CREATE POLICY "deliveries_select_policy" ON public.deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deliveries.deal_id
        AND (deals.client_id = auth.uid() OR deals.freelancer_id = auth.uid())
    )
  );

-- INSERT: Доставлять работу может только фрилансер, назначенный на сделку
CREATE POLICY "deliveries_insert_policy" ON public.deliveries
  FOR INSERT TO authenticated
  WITH CHECK (
    freelancer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deliveries.deal_id
        AND deals.freelancer_id = auth.uid()
    )
  );

-- UPDATE: Изменять запись о доставке может только исполнитель сделки
CREATE POLICY "deliveries_update_policy" ON public.deliveries
  FOR UPDATE TO authenticated
  USING (
    freelancer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deliveries.deal_id
        AND deals.freelancer_id = auth.uid()
    )
  )
  WITH CHECK (
    freelancer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deliveries.deal_id
        AND deals.freelancer_id = auth.uid()
    )
  );


-- 4. РАЗГРАНИЧЕНИЕ ПРИВИЛЕГИЙ (GRANT / REVOKE)
-- Разрешаем чтение и изменение deals и deliveries для authenticated
GRANT SELECT, INSERT, UPDATE ON public.deals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.deliveries TO authenticated;

-- Разрешаем ТОЛЬКО чтение для payments и payouts для authenticated (запрет записи)
GRANT SELECT ON public.payments TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM authenticated;

GRANT SELECT ON public.payouts TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payouts FROM authenticated;

-- Предоставляем полный доступ к таблицам для роли service_role (backend)
GRANT ALL ON public.deals TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.payouts TO service_role;
GRANT ALL ON public.deliveries TO service_role;
