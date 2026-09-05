# 🔐 GigChain — Detailed Solution Report

### Decentralized Freelance Escrow dApp

---

## 1. Executive Summary

The problem is a structural one: **Upwork and Fiverr are banks that also act as judges**. They hold your money, take ~20% in fees, and make final calls on disputes with no transparency. Our solution — **GigChain** — eliminates all three roles by replacing the centralized company with a **Solidity smart contract** living on Ethereum (Sepolia testnet). Code is the escrow agent, code is the dispute engine, and code enforces payment rules. No middleman, no fee extraction, no black-box decisions.

---

## 2. Problem Decomposition

| Pain Point                | Web2 Cause                    | Web3 Fix                                                  |
| ------------------------- | ----------------------------- | --------------------------------------------------------- |
| Platform takes 5–20% fee  | Centralized payment processor | Peer-to-peer ETH/ERC-20 transfers via smart contract      |
| Funds held by third party | Company custody               | Smart contract self-custody — only released on condition  |
| Opaque dispute resolution | Centralized arbiter           | On-chain arbitrator role with transparent resolution data |
| No milestone granularity  | All-or-nothing payout         | Per-milestone lockup and independent release              |
| No verifiable reputation  | Proprietary star ratings      | On-chain NFT badges tied to objective completed-gig data  |

---

## 3. Full Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                       │
│  React + Vite + TypeScript                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  MetaMask /  │  │   Ethers.js  │  │  React Context   │  │
│  │  WalletConnect│  │   (on-chain  │  │  (Wallet State)  │  │
│  └──────────────┘  │   reads/tx)  │  └──────────────────┘  │
│                    └──────────────┘                          │
└─────────────────────┬───────────────────┬───────────────────┘
                      │ REST API           │ Blockchain RPC
                      ▼                   ▼
        ┌─────────────────────┐   ┌──────────────────────────┐
        │  Node.js + Express  │   │   Sepolia Testnet (EVM)   │
        │  Backend API        │   │                           │
        │  ┌───────────────┐  │   │  ┌────────────────────┐  │
        │  │  Supabase     │  │   │  │   GigEscrow.sol     │  │
        │  │  (PostgreSQL  │  │   │  │   (core contract)   │  │
        │  │  off-chain)   │  │   │  └────────────────────┘  │
        │  └───────────────┘  │   │  ┌────────────────────┐  │
        │  ┌───────────────┐  │   │  │ ReputationBadge.sol │  │
        │  │  AI Dispute   │  │   │  │ (ERC-721 GCRB)      │  │
        │  │  Analysis     │  │   │  └────────────────────┘  │
        │  └───────────────┘  │   └──────────────────────────┘
        │  ┌───────────────┐  │
        │  │  IPFS Pinata  │  │
        │  │  Integration  │  │
        │  └───────────────┘  │
        └─────────────────────┘
```

---

## 4. Smart Contract Layer — `GigEscrow.sol`

This is the **core trust engine** of the platform. Here's a precise breakdown of every mechanism:

### 4.1 State Machine

Every gig travels through a strict state machine:

```
Open → InProgress → Completed
                  ↘ Disputed → (Arbitrator resolves) → Completed / CancelledByClient
       ↘ CancelledByClient
       ↘ CancelledByFreelancer
```

**Why a state machine?** It prevents replay attacks, double-spending, and race conditions. Functions are guarded by `inState()` modifiers so milestones can't be released during a dispute, and disputes can't be raised on completed gigs.

### 4.2 Gig Data Structure

```solidity
struct Gig {
    uint gigId;
    address payable client;
    address payable freelancer;
    uint totalBudget;
    string description;       // Or IPFS hash
    State state;
    bool exists;
    Milestone[] milestones;   // Dynamic array — 2 to N milestones
    uint completedMilestoneCount;
    address token;            // address(0) = ETH, else ERC-20
}

struct Milestone {
    string description;
    uint value;               // Locked ETH/tokens for this milestone
    bool completed;
}
```

### 4.3 Core Function Flow

#### Step 1 — Client Posts a Gig (`postGig`)

- Client provides milestone descriptions + values
- Contract calculates `totalBudget = sum(milestoneValues)`
- For **ETH gigs**: `msg.value` must exactly match `totalBudget` — funds locked immediately
- For **ERC-20 gigs**: `SafeERC20.safeTransferFrom()` pulls the tokens from client → contract
- Gig state = `Open`, awaiting freelancer bids

#### Step 2 — Freelancers Bid (`bidGig`)

- Freelancers stake a configurable `stakeAmount` of `stakeToken` to show commitment
- This creates a **skin-in-the-game** anti-spam mechanism
- Addresses who staked are stored in `bidders[gigId]`

#### Step 3 — Client Selects Freelancer (`selectFreelancer`)

- Only callable by the client, only on `Open` gigs
- Freelancer must have bid (staked) first
- Sets `gig.state = InProgress`, records `gigStartTime`
- Stake of non-selected bidders can be returned (future improvement)

#### Step 4 — Milestone Release (`releaseMilestonePayment`)

- Client approves each milestone independently
- Per-milestone ETH/token is transferred to freelancer immediately
- When the last milestone is released: gig → `Completed`, reputation stats updated, streak incremented, stake returned to freelancer

#### Step 5 — Dispute Flow (`raiseDispute` + `submitDisputeResolution`)

- Either party raises a dispute with a text reason (stored on-chain + backend)
- Gig state → `Disputed`, freelancer streak resets
- Arbitrator (trusted EOA or future multisig/DAO) calls `submitDisputeResolution`
- **Binary decision**: `_releaseToFreelancer = true` → pays freelancer; `false` → refunds client
- Resolution data (IPFS hash of evidence, AI decision log) stored on-chain as `bytes`

### 4.4 ETH vs ERC-20 Dual Support

```solidity
// ETH path
if (gig.token == address(0)) {
    (bool success, ) = gig.freelancer.call{value: amount}("");
    require(success, "GigEscrow: Failed to send ETH");
}
// ERC-20 path
else {
    IERC20(gig.token).safeTransfer(gig.freelancer, amount);
}
```

All sends use `.call{value}` (ETH) or `SafeERC20.safeTransfer` (tokens) — never `.transfer()` which can run out of gas with complex receiver contracts.

### 4.5 Security Features

- **`ReentrancyGuard`**: All payment functions marked `nonReentrant` — prevents re-entrancy attacks
- **`ERC2771Context`**: Supports gasless meta-transactions (users can transact without holding ETH for gas, a relayer pays)
- **`SafeERC20`**: All token interactions through OpenZeppelin's safe wrapper
- **Role-based modifiers**: `onlyClient`, `onlyFreelancer`, `onlyArbitrator` — strict access control

---

## 5. Reputation System — `ReputationBadge.sol`

### 5.1 Why NFT Badges Instead of Scores?

A simple on-chain integer score is gameable and opaque. NFT badges are:

- **Verifiable** — anyone can query a wallet's badges on Etherscan
- **Composable** — future protocols can check `hasMinLevel(address, BadgeType, 3)` for access gating
- **Evolving** — badges upgrade in-place (same tokenId, updated metadata URI) as freelancers achieve more

### 5.2 Badge Types and Level Thresholds

| Badge                | Trigger                        | Level Thresholds                 |
| -------------------- | ------------------------------ | -------------------------------- |
| `COMPLETED_GIGS`     | On final milestone release     | 5 / 15 / 30 / 50 / 100 gigs      |
| `EARNINGS_MILESTONE` | On final milestone release     | 1 / 5 / 10 / 25 / 50 ETH total   |
| `STREAK`             | Consecutive completions        | 3 / 5 / 10 / 15 / 20 streak      |
| `DISPUTE_FREE`       | No disputes in career          | 5 / 15 / 25 / 40 / 60 clean gigs |
| `INITIATIVE`         | On first wallet connect / bid  | 1 level (participation badge)    |
| `SPECIAL`            | Manually granted by arbitrator | Custom, for exceptional work     |

### 5.3 Upgrade Mechanism

When a milestone is completed, the escrow contract calls `mintBadge()`. If the freelancer already holds that badge type, `_upgradeBadgeIfEligible()` is called:

1. Updates badge `value` to new metric
2. Recalculates level via `_calculateLevel()`
3. If new level > old level: updates `tokenURI` to the higher-tier image URI, emits `BadgeUpgraded`

This means the **NFT itself evolves** — no new token minted, the existing one gets better metadata.

---

## 6. Backend API Layer

The backend is **not** the trust layer (the contract is). It handles:

| Module             | Purpose                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `authRoutes`       | JWT auth, wallet-signature based login (Sign-In with Ethereum)                   |
| `profileRoutes`    | Off-chain profile data (bio, skills, portfolio links)                            |
| `gigRoutes`        | Indexed gig metadata, search, filtering                                          |
| `submissionRoutes` | Freelancer work submissions (file links, descriptions)                           |
| `disputeRoutes`    | Dispute ticket management, evidence submission                                   |
| `aiRoutes`         | AI-powered dispute analysis using LLM (summarizes evidence, suggests resolution) |
| `analyticsRoutes`  | Platform-wide stats, leaderboards                                                |
| `bountyRoutes`     | Optional bug/feature bounty board                                                |
| `onboardingRoutes` | User tutorial step tracking                                                      |

### 6.1 Why a Backend at All?

Smart contracts can't store large blobs cheaply. The backend + PostgreSQL (via Supabase) hold:

- Full freelancer portfolios and skill tags
- Work submission files (or IPFS hashes)
- Dispute evidence (screenshots, messages)
- Platform analytics
- AI dispute analysis results

> **Trust Model**: The backend can lie about metadata, but it **cannot touch funds**. Money is 100% controlled by the smart contract. Even if the backend goes down, all funds are safe and can be claimed directly via contract interaction.

---

## 7. IPFS Integration (Stretch Feature — Implemented)

Job descriptions and deliverable hashes are stored on IPFS via **Pinata**, with the CID referenced on-chain. This means:

```
Client posts gig → Backend pins JSON to Pinata → Gets CID
→ CID passed as `_description` to `postGig()` → Stored on-chain forever
```

Anyone can independently verify the original job spec by querying the contract's `gig.description` field and fetching from IPFS. Immutable + decentralized job records.

---

## 8. Frontend Architecture

### 8.1 Tech Stack

- **Vite + React + TypeScript** — fast dev server, type safety
- **Ethers.js** — blockchain reads and transaction submission
- **MetaMask** — wallet injection via `window.ethereum`
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible component primitives

### 8.2 Key Pages

| Page                  | Role                                                        |
| --------------------- | ----------------------------------------------------------- |
| `Welcome.tsx`         | Landing page, wallet connect CTA                            |
| `Auth.tsx`            | Sign-In with Ethereum (SIWE) — proves wallet ownership      |
| `PostGig.tsx`         | Client flow: set milestones, values, description, submit tx |
| `BrowseContracts.tsx` | Open gigs marketplace, filter by budget/skills/token        |
| `MyContracts.tsx`     | Gig dashboard for both clients and freelancers              |
| `SubmitWork.tsx`      | Freelancer marks milestone delivered, uploads evidence      |
| `Reputation.tsx`      | NFT badge showcase, leaderboard                             |
| `Profile.tsx`         | Off-chain profile management                                |
| `DisputeDetails.tsx`  | Active dispute view with evidence thread                    |
| `GigsMapPage.tsx`     | Visual geographic distribution of gigs                      |

### 8.3 Wallet Connection Flow

```typescript
// Context provides wallet state app-wide
const { provider, signer, address, connect } = useWallet();

// On connect:
// 1. Request accounts from MetaMask
// 2. Create ethers.BrowserProvider from window.ethereum
// 3. Get signer for signing transactions
// 4. Sign SIWE message → backend issues JWT
// 5. All subsequent API calls carry JWT header
```

### 8.4 On-Chain Transaction Pattern

```typescript
// Example: release milestone
const contract = new ethers.Contract(ESCROW_ADDRESS, GigEscrowABI, signer);
const tx = await contract.releaseMilestonePayment(gigId, milestoneIndex);
await tx.wait(); // Wait for block confirmation
// Then refresh UI from contract state
```

---

## 9. Dispute Resolution — Deep Dive

### 9.1 Flow

```
Dispute Raised (by client or freelancer)
    ↓
Backend AI analyzes: reads dispute reason + submission text
    ↓
AI generates recommendation (not binding) → stored in Supabase (PostgreSQL)
    ↓
Arbitrator reviews evidence + AI recommendation
    ↓
Arbitrator calls submitDisputeResolution(gigId, releaseToFreelancer, ipfsEvidenceHash)
    ↓
Contract pays out, records resolution data on-chain
```

### 9.2 What the AI Does

The `aiRoutes` module feeds the dispute reason, freelancer's submission description, and any uploaded evidence to an LLM (e.g., GPT-4o). The AI returns a structured JSON:

```json
{
  "recommendation": "release_to_freelancer",
  "confidence": 0.87,
  "reasoning": "Freelancer provided complete deliverables matching scope. Client delay appears to be the cause of dispute.",
  "suggested_resolution": "Release milestone 2 payment. Client retains ability to dispute milestone 3."
}
```

This **assists** the arbitrator but does not execute anything automatically. Human review is mandatory.

### 9.3 Future: DAO-Based Arbitration

The `arbitrator` address can be replaced with a **multisig** (Gnosis Safe) or a **token-voting DAO** where GCRB badge holders vote on disputes. This is a natural upgrade path.

---

## 10. ERC-20 Stablecoin Support

The `GigEscrow` contract accepts any ERC-20 as payment:

```solidity
function postGig(
    address _token,    // Pass USDC address for stablecoin, address(0) for ETH
    ...
) public payable
```

To use USDC (or any testnet stablecoin):

1. Client approves escrow contract: `USDC.approve(escrowAddress, totalBudget)`
2. Client calls `postGig(usdcAddress, ...)` — contract pulls USDC via `safeTransferFrom`
3. All milestone releases and refunds use `safeTransfer(address, amount)` in USDC

This is production-grade stablecoin support — the same contract handles ETH and any token.

---

## 11. Gas & Security Analysis

### 11.1 Gas Optimization

- **Milestone array in storage**: Pushing to storage arrays is gas-intensive. Max milestone count should be enforced (suggested: 10) to prevent DoS via huge arrays
- **String storage**: `gig.description` stores the IPFS CID string (46 chars) not the full text — dramatically cheaper
- **Packed struct fields**: `bool completed` and `uint value` in `Milestone` — could pack better with `uint128` but readability is prioritized
- **`nonReentrant` gas cost**: Adds ~2,300 gas per call — acceptable for security

### 11.2 Security Considerations

| Risk                      | Mitigation                                      |
| ------------------------- | ----------------------------------------------- |
| Re-entrancy attack        | `ReentrancyGuard` on all payment functions      |
| Integer overflow          | Solidity 0.8.x built-in overflow checks         |
| Token approval griefing   | `SafeERC20` handles non-standard tokens         |
| Arbitrator centralization | Address can be upgraded to multisig/DAO         |
| Front-running bids        | Bids are stake-gated, reducing spam incentive   |
| Stuck funds               | `cancelGigByClient` recovers unspent milestones |

---

## 12. Deployment Strategy

### 12.1 Local Development

```bash
npx hardhat node                    # Spin up local EVM fork
npx hardhat run scripts/deploy.js   # Deploy contracts locally
npm run dev                         # Start Vite frontend
cd backend && node server.js        # Start Express backend
```

### 12.2 Testnet (Sepolia)

```bash
# In hardhat.config.cjs
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}

npx hardhat run scripts/deploy.js --network sepolia
```

### 12.3 Deployment Order

1. Deploy `ReputationBadge` (owner = deployer)
2. Deploy `GigEscrow` (arbitrator = deployer initially)
3. Call `ReputationBadge.setGigEscrowAddress(escrowAddress)`
4. Call `GigEscrow.setReputationBadgeContract(badgeAddress)`
5. Call `GigEscrow.toggleBadges(true)` to activate badge minting
6. Optionally: `GigEscrow.setStakeParams(stakeTokenAddress, stakeAmount)`
7. Update frontend `.env` with deployed addresses

---

## 13. What Makes GigChain Different

| Feature               | Upwork/Fiverr           | GigChain                         |
| --------------------- | ----------------------- | -------------------------------- |
| Fund custody          | Platform                | Smart contract                   |
| Platform fee          | 5–20%                   | 0% (only gas costs)              |
| Dispute arbitration   | Company employee        | Transparent arbitrator + AI      |
| Reputation system     | Proprietary star rating | On-chain NFT badges (verifiable) |
| Payment options       | Fiat / PayPal           | ETH + any ERC-20 stablecoin      |
| Job record permanence | Platform can delete     | IPFS + on-chain, permanent       |
| Freelancer streak     | Hidden                  | On-chain, queryable              |
| Gasless transactions  | N/A                     | ERC-2771 meta-transactions       |

---

## 14. Roadmap / Stretch Goals

### Phase 1 (Current Implementation ✅)

- [x] GigEscrow with ETH and ERC-20 support
- [x] 2–N milestone system with independent release
- [x] Dispute mechanism with arbitrator role
- [x] NFT reputation badges (6 types, 5 levels)
- [x] Frontend with MetaMask wallet connect
- [x] Backend API + PostgreSQL (Supabase)
- [x] IPFS integration via Pinata
- [x] Freelancer staking/bidding system
- [x] AI-assisted dispute analysis

### Phase 2 (Next Steps)

- [ ] Replace single arbitrator with Gnosis Safe multisig
- [ ] GCRB badge-holder DAO voting on disputes (1 badge = 1 vote, weighted by level)
- [ ] Time-locked milestones (auto-release after deadline if no dispute)
- [ ] Cross-chain support via LayerZero bridge
- [ ] Reputation-gated gig access (client requires Level 3+ badge)
- [ ] Gasless relayer integration (ERC-4337 account abstraction)

---

## 15. Tech Stack Summary

| Layer              | Technology                | Why                                                                             |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------- |
| Smart Contracts    | Solidity 0.8.20 + Hardhat | Industry standard, Hardhat's testing/debug tooling                              |
| Contract Libraries | OpenZeppelin 5.x          | Battle-tested, audited security primitives                                      |
| Blockchain         | Ethereum Sepolia testnet  | Full EVM compatibility, free test ETH                                           |
| Frontend           | React + Vite + TypeScript | Fast DX, type safety, SPA routing                                               |
| Web3 Library       | Ethers.js v6              | Mature, well-documented, compact bundle                                         |
| Wallet             | MetaMask                  | Most widely adopted browser wallet                                              |
| Styling            | Tailwind CSS + shadcn/ui  | Rapid UI dev, accessible components                                             |
| Backend            | Node.js + Express         | Familiar JS stack, easy REST APIs                                               |
| Database           | PostgreSQL via Supabase   | Relational integrity, real-time subscriptions, built-in auth, hosted managed DB |
| Storage            | IPFS via Pinata           | Permanent, content-addressed file storage                                       |
| AI                 | LLM API (GPT-4o)          | Dispute analysis and recommendation                                             |

---

_Report generated for GigChain — Hackblox Hackathon Submission_
