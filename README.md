# Stellar Cash Flow - Invoice Financing on Soroban

A decentralized invoice financing platform built on Stellar and Soroban. Businesses can tokenize invoices as assets, and investors can fund them via liquidity pools to earn yields.

## Features

- **Invoice Tokenization**: Mint unique assets representing invoices on Stellar Testnet.
- **Compliance**: Built-in asset controls (Auth Required, Revocable, Clawback) using `stellar-issuance.ts`.
- **Risk Scoring**: Real-time risk assessment using Horizon account history (payments/trustlines).
- **Lending Pools**: Soroban smart contracts for pooling funds and earning yields.
- **Secondary Market**: Trade invoice tokens on the Stellar DEX.
- **Investor Dashboard**: Track yields, balances, and investments with real-time charts.
- **India Focus**: INR display and UPI integration hooks.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI
- **Blockchain**: Stellar SDK, Soroban Client, Freighter Wallet
- **Backend**: Supabase (Database & Auth)
- **Charts**: Recharts

## Setup Instructions

### Prerequisites
1. Node.js (v18+)
2. [Freighter Wallet Extension](https://www.freighter.app/)
3. Supabase Project

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd stellar-cash-flow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Blockchain Setup (Testnet)

1. **Fund Wallet**: Open Freighter, switch to "Testnet", and fund your account using the built-in Friendbot or [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test).
2. **Soroban**: The app uses a simulated contract ID (`CURRENT_POOL_CONTRACT_ID`) in `src/lib/soroban.ts`. For full functionality, deploy the Rust contract to Testnet and update this ID.

## Deployment

### Vercel
1. Push to GitHub.
2. Import project to Vercel.
3. Add Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Deploy!

## Disclaimer
**TESTNET ONLY**. This application is for demonstration purposes on the Stellar Testnet. Do not use real funds.
