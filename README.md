# WorkPay

WorkPay is a Telegram Mini App for freelance jobs, TON escrow and Connects-based applications.

## Product flow

1. The app opens only inside Telegram and authenticates the Telegram WebApp `initData` on the server.
2. A user connects a TON wallet through TON Connect.
3. The wallet page creates a TON transfer with a profile-specific deposit comment.
4. The server checks the sender, escrow destination, value and comment through TON Center before crediting the internal TON balance.
5. Freelancers use one Connect for an application. New Connects are purchased from the verified internal TON balance.
6. Deal funding uses direct TON escrow transfers. A deal is never marked funded from a client-side success state.

## Monetization

- 30 monthly Connects are available to a new freelancer profile.
- Connect packs: 10 for 1 TON, 30 for 2.5 TON, and 100 for 7 TON.
- One application costs one Connect.
- Deal settlement stores the platform fee on the deal record. The release transaction remains server-controlled and must be backed by a configured signing flow before it can be enabled.

## Local setup

Install dependencies and create `.env.local` from `.env.example`. The important server-only values are:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=GetWorkPayBot
BOT_WEBHOOK_SECRET=
ESCROW_WALLET_ADDRESS=
TONCENTER_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Run the app:

```bash
npm install
npm run dev
npm run build
npm run bot:setup
```

Telegram Web Apps require a public HTTPS URL. The deployed app is configured at `https://workpay-ton-fixed.vercel.app`.

## Important routes

- `/wallet`: connect a wallet and deposit TON.
- `/energy`: buy Connects from the verified TON balance.
- `/jobs`: browse jobs and spend Connects to apply.
- `/api/wallet/deposit/scan`: find a recent matching TON transaction.
- `/api/wallet/deposit`: verify and credit a transaction idempotently.
- `/api/payments/create`: build a direct TON escrow transfer.
- `/api/payments/verify`: verify deal funding on-chain.

Never expose `TONCENTER_API_KEY`, Supabase service credentials, or Telegram bot credentials to the browser.
