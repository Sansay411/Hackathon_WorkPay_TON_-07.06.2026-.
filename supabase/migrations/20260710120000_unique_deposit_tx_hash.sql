-- A chain transaction can credit an internal balance only once.
create unique index if not exists deposit_transactions_tx_hash_unique
  on public.deposit_transactions (tx_hash);
