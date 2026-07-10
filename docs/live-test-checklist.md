# Release checklist

- Open the deployed URL outside Telegram and confirm that the Telegram-only gate is shown.
- Open the bot menu button in Telegram and confirm the Mini App loads.
- Connect a TON wallet and confirm the address is saved to the Telegram profile.
- Deposit testnet TON and confirm the balance changes only after TON Center verification.
- Retry the same transaction hash and confirm it is rejected as already credited.
- Buy a Connects pack from the verified TON balance.
- Apply to a job and confirm exactly one Connect is deducted.
- Verify that failed or cancelled wallet actions do not change the internal balance.
- Keep `TONCENTER_API_KEY`, Supabase service credentials and bot credentials server-side.
