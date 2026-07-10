# WorkPay product flow

WorkPay is distributed through Telegram and uses Telegram WebApp authentication for every protected action.

## Marketplace

- Clients publish jobs with a budget, deadline and acceptance criteria.
- Freelancers browse jobs and spend one Connect per application.
- Clients accept an application and a protected deal is created.
- Deliverables move through submitted, approved and completed states.

## Trust model

- Telegram `initData` is verified server-side.
- Wallet addresses are stored only after a Telegram-authenticated wallet connection.
- TON transfers are checked against the expected sender, escrow destination, amount and comment.
- Internal balances are credited only after chain verification.
