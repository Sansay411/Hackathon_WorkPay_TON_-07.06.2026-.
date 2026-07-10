# TON payment flow

## Deposit

1. The wallet page requests a direct TON transaction from `/api/payments/create` using `deposit:<profileId>` as the comment.
2. TON Connect opens the user's wallet for approval.
3. The client polls `/api/wallet/deposit/scan` while the transaction is indexed.
4. The server calls TON Center, verifies the transaction and then credits `profiles.ton_balance` through `/api/wallet/deposit`.
5. `deposit_transactions.tx_hash` is unique, so the same transaction cannot be credited twice.

## Deal funding

Deal funding uses the same direct TON transfer mechanism with the `workpay:<dealId>` comment. A payment is confirmed only after server-side TON verification.

## Release safety

Escrow release requires a server-side signing policy and an auditable payout record. Until the signing key and operational policy are configured, the release route returns a setup-required response instead of claiming a payout happened.
