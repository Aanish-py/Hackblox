# GigChain — Trustless Freelance Escrow

> Decentralized freelance escrow platform on Ethereum. Smart contract-enforced milestone payments, on-chain NFT reputation badges, and AI-assisted dispute resolution. No middleman. No fees. No trust required.

---

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Git

### 1. Install all dependencies

```bash
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. Set up Supabase tables

Open [your Supabase SQL Editor](https://bzazcquvfklqwxrsycyd.supabase.co) → **New Query** → paste the contents of `backend/supabase-schema.sql` → **Run**.

### 3. Deploy contracts to Sepolia Testnet

Add your Sepolia deployer private key to `contracts/.env`:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/alch_5AaiPJss5VsY6dSzxV-Ig
PRIVATE_KEY=0xYourPrivateKeyHere...
```

Then run the Sepolia deployment script:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

This auto-saves deployed contract addresses to `frontend/src/lib/addresses.json`.

### 4. Start the backend

```bash
cd backend
npm start
```

Backend runs on `http://localhost:4000`

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### 7. Configure MetaMask

- Network: **Localhost 8545** (or add manually with Chain ID `31337`)
- Import one of Hardhat's test accounts using the private keys printed by `npx hardhat node`

---

## Deploy to Sepolia Testnet

1. Add your private key to `contracts/.env`:
   ```
   PRIVATE_KEY=0x_your_private_key_here
   ```

2. Deploy:
   ```bash
   cd contracts
   npm run deploy:sepolia
   ```

3. Update `frontend/.env`:
   ```
   VITE_BACKEND_URL=http://localhost:4000
   ```

---

## Add OpenAI for AI Dispute Analysis

Add to `backend/.env`:
```
OPENAI_API_KEY=sk-proj-...
```

Without this, the AI analysis button returns a `503` error explaining what's missing.

---

## Project Structure

```
Hackblox/
├── contracts/              Hardhat — Solidity smart contracts
│   ├── contracts/
│   │   ├── GigEscrow.sol       Core escrow with state machine
│   │   └── ReputationBadge.sol ERC-721 NFT reputation system
│   ├── scripts/deploy.js       Auto-deploys + wires both contracts
│   └── test/GigEscrow.test.js  Full test suite
│
├── backend/                Node.js + Express API
│   ├── routes/             REST API routes
│   ├── middleware/auth.js  SIWE + JWT
│   ├── lib/supabase.js     Supabase client
│   ├── lib/pinata.js       IPFS pinning via Pinata
│   ├── lib/ai.js           OpenAI GPT-4o dispute analysis
│   └── supabase-schema.sql DB schema
│
└── frontend/               Vite + React + TypeScript
    ├── src/
    │   ├── context/        WalletContext (MetaMask)
    │   ├── hooks/          useContract, useGig
    │   ├── pages/          Welcome, PostGig, Browse, Dashboard...
    │   ├── components/     Navbar, MilestoneCard, BadgeCard...
    │   ├── abi/            GigEscrow.json, ReputationBadge.json
    │   └── lib/            types, api client, contract addresses
    └── .env                VITE_BACKEND_URL
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20 + Hardhat + OpenZeppelin 5.x |
| Blockchain | Ethereum Sepolia Testnet / Local Hardhat |
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| Web3 | Ethers.js v6 + MetaMask |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| IPFS | Pinata |
| AI | OpenAI GPT-4o |

---

## Key Features

- **Trustless Escrow** — ETH and ERC-20 locked in smart contract, released on client approval
- **Milestone Payments** — 1-10 independent milestones per gig
- **NFT Badges** — 6 badge types × 5 levels, upgrade in-place on-chain
- **Dispute Resolution** — AI analysis + human arbitrator flow
- **IPFS Storage** — Gig descriptions and deliverables pinned permanently
- **SIWE Auth** — Sign-In with Ethereum, no passwords
- **Zero Fees** — Only gas costs, no platform cut

---

*Built for Hackblox Hackathon — GigChain Team*
