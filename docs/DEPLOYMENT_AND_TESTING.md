# Pioneer — Deployment & Testing Guide (Full)

This document walks through deploying Pioneer to the Sepolia testnet end-to-end, including contract deployment, frontend configuration, and functional test checklists.

---

## Table of contents

1. [Environment setup](#1-environment-setup)
2. [Run frontend only (simulation mode)](#2-run-frontend-only-simulation-mode)
3. [Compile & deploy contracts](#3-compile--deploy-contracts)
4. [Chainlink service setup](#4-chainlink-service-setup)
5. [Connect frontend to deployed contracts](#5-connect-frontend-to-deployed-contracts)
6. [Functional test checklist](#6-functional-test-checklist)
7. [Contract verification (Etherscan)](#7-contract-verification-etherscan)
8. [Production notes](#8-production-notes)

---

## 1. Environment setup

### 1.1 System requirements

| Tool | Version | Purpose |
|------|------|------|
| Node.js | >= 18.x | Run frontend & Hardhat |
| npm | >= 9.x | Package management |
| Git | any | Clone the repo |
| MetaMask | latest | Browser wallet |

### 1.2 Get testnet funds

```
Sepolia ETH:  https://sepoliafaucet.com/
              https://www.alchemy.com/faucets/ethereum-sepolia
Sepolia LINK: https://faucets.chain.link/sepolia
```

Suggested balances:
- **Sepolia ETH**: >= 0.5 ETH (deployment + testing transactions)
- **Sepolia LINK**: >= 25 LINK (VRF + Automation)

### 1.3 API keys

| Service | URL | Purpose |
|------|------|------|
| WalletConnect Cloud | https://cloud.walletconnect.com/ | RainbowKit wallet modal |
| Alchemy / Infura | https://alchemy.com / https://infura.io | Sepolia RPC |
| Etherscan | https://etherscan.io/apis | Contract verification (optional) |

---

## 2. Run frontend only (simulation mode)

You can run the frontend without deploying any contracts (UI + simulation features):

```bash
# 1) Clone
git clone https://github.com/jbqvibecoding/cyberpunk-fortune.git
cd cyberpunk-fortune

# 2) Install
npm install

# 3) Create env file
cp .env.example .env

# 4) Edit .env — minimum required is WalletConnect Project ID
#    VITE_WALLETCONNECT_PROJECT_ID=your_ID

# 5) Start dev server
npm run dev
```

Open http://localhost:8080:

- **Powerball**: pick numbers, buy tickets, simulated draws
- **Poker**: choose stake/buy-in, start game, play vs AI (simulated)
- **Wallet**: MetaMask connects; UI shows "SIMULATION MODE"

In simulation mode all contract addresses are `0x000...000`; the frontend automatically falls back to local logic.

---

## 3. Compile & deploy contracts

### 3.1 Compile

```bash
npx hardhat compile
```

The first compile can take ~2–3 minutes (IR pipeline enabled). On success:
```
Compiled 43 Solidity files successfully (with 1 warning).
```

### 3.2 Configure deployment environment variables

Edit your `.env` file:

```dotenv
# Deployer private key (see below for how to export)
DEPLOYER_PRIVATE_KEY=0xabc123...

# Sepolia RPC URL
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_API_key

# Chainlink subscription IDs (create them first; see Section 4)
VRF_SUBSCRIPTION_ID=12345
FUNCTIONS_SUBSCRIPTION_ID=67890
```

**How to export a MetaMask private key:**
1. MetaMask → account menu → "Account details" → "Show private key"
2. Enter password and copy
3. ⚠️ **Never commit `.env` to git.**

### 3.3 Deploy CyberPowerball

```bash
npx hardhat run scripts/deploy-powerball.ts --network sepolia
```

Example output:
```
Deploying CyberPowerball with account: 0xYourAddress
Balance: 0.49 ETH

✅ CyberPowerball deployed to: 0xABC123...DEF

📋 Next steps:
   1. Add 0xABC123...DEF as a consumer to your VRF Subscription
   2. Register Chainlink Automation upkeep for scheduled draws
   3. Set VITE_CYBERPOWERBALL_ADDRESS=0xABC123...DEF in your .env
   4. Restart the frontend: npm run dev
```

**Immediately write the address into `.env`:**
```dotenv
VITE_CYBERPOWERBALL_ADDRESS=0xABC123...DEF
```

### 3.4 Deploy TexasHoldemAIDuel

```bash
npx hardhat run scripts/deploy-poker.ts --network sepolia
```

**Write the address into `.env`:**
```dotenv
VITE_TEXASHOLDEM_ADDRESS=0x789XYZ...
```

---

## 4. Chainlink service setup

After deployment, configure Chainlink services. See [docs/CHAINLINK_SETUP.md](CHAINLINK_SETUP.md).

### Quick checklist

```
1. VRF Subscription (https://vrf.chain.link)
   ├── Create a subscription
   ├── Fund with 10 LINK
   ├── Add consumer: CyberPowerball address
   └── Add consumer: TexasHoldemAIDuel address

2. Automation Upkeep (https://automation.chain.link)
   ├── Register New Upkeep → Custom Logic
   ├── Target: CyberPowerball address
   ├── Gas limit: 750000
   └── Fund with 5 LINK

3. Functions Subscription (https://functions.chain.link)
   ├── Create a subscription
   ├── Fund with 5 LINK
   └── Add consumer: TexasHoldemAIDuel address
```

---

## 5. Connect frontend to deployed contracts

After deploying and configuring Chainlink:

```bash
# Ensure `.env` contains deployed contract addresses
npm run dev
```

Open http://localhost:8080 → connect MetaMask → switch to Sepolia:

- Powerball and Poker sections should show the green **"ON-CHAIN · SEPOLIA"** badge
- Buying a ticket / starting a game should trigger MetaMask confirmations

---

## 6. Functional test checklist

### 6.1 Powerball (lottery) tests

| # | Test | Steps | Expected |
|---|--------|------|---------|
| 1 | Pick numbers | Select 5 main + 1 powerball | Numbers highlight, "BUY" enabled |
| 2 | Quick pick | Click "QUICK PICK" | Auto selects 6 numbers |
| 3 | Simulated purchase | Wallet disconnected or contracts not set | "SIMULATION MODE" badge; ticket added locally |
| 4 | On-chain purchase | Wallet connected + contracts set | MetaMask pops up; tx hash link shown |
| 5 | Simulated draw | In simulation mode, wait for timer | Draw animation; results shown |
| 6 | On-chain draw | Automation triggers | `DrawCompleted` updates UI |
| 7 | History | Switch to "HISTORY" tab | Past draws displayed |

### 6.2 Poker tests

| # | Test | Steps | Expected |
|---|--------|------|---------|
| 1 | Enter game | Select stake/buy-in → "ENTER GAME" | Enter the table view |
| 2 | Deal | Click "DEAL" | Deal animation; player gets 2 hole cards |
| 3 | Player actions | Fold/Check/Call/Raise/All-In | Action executes; AI responds |
| 4 | AI response | Wait | AI shows thinking then acts |
| 5 | Full hand | Play to showdown | Winner/hand/chip changes shown |
| 6 | On-chain interaction | After deployment → start game | MetaMask confirmation |
| 7 | Next hand | End hand → "NEXT HAND" | Dealer rotates; new hand starts |

### 6.3 Wallet tests

| # | Test | Steps | Expected |
|---|--------|------|---------|
| 1 | Connect | Navbar "Connect Wallet" | RainbowKit modal; choose MetaMask |
| 2 | Network switch | If not on Sepolia | Prompt to switch networks |
| 3 | Address | After connect | Truncated address shown |
| 4 | Disconnect | Click address → "Disconnect" | Returns to disconnected state |

### 6.4 On-chain verification

Use Etherscan to verify transactions:

```
https://sepolia.etherscan.io/address/<contract_address>

Replace `<contract_address>` with your deployed address.
```

Check:
- **Transactions**: calls like `buyTicket`, `startGame`
- **Events**: `TicketPurchased`, `DrawCompleted`, etc.
- **Internal Txns**: VRF callbacks (if applicable)

### 6.5 Manual VRF testing (Hardhat Console)

```bash
npx hardhat console --network sepolia
```

```javascript
// Test CyberPowerball
const pb = await ethers.getContractAt("CyberPowerball", "0x<POWERBALL_ADDRESS>");

// Current round
const roundId = await pb.currentRoundId();
console.log("Current Round:", roundId.toString());

// Ticket price
const price = await pb.ticketPrice();
console.log("Ticket Price:", ethers.formatEther(price), "ETH");

// Buy one ticket
const tx = await pb.buyTicket([1, 2, 3, 4, 5], 10, { value: price });
await tx.wait();
console.log("Ticket purchased! TX:", tx.hash);

// Check if upkeep is needed
const [needed, data] = await pb.checkUpkeep("0x");
console.log("Upkeep needed:", needed);
```

```javascript
// Test TexasHoldemAIDuel
const poker = await ethers.getContractAt("TexasHoldemAIDuel", "0x<POKER_ADDRESS>");

// Min buy-in
const minBuy = await poker.minBuyIn();
console.log("Min buy-in:", ethers.formatEther(minBuy), "ETH");

// Start game
const tx = await poker.startGame({ value: minBuy });
await tx.wait();
console.log("Game started! TX:", tx.hash);

// Active game id
const [signer] = await ethers.getSigners();
const gameId = await poker.activeGame(signer.address);
console.log("Active game ID:", gameId.toString());
```

---

## 7. Contract verification (Etherscan)

After verifying a contract, you can browse source code and call functions via Etherscan.

```bash
# CyberPowerball
npx hardhat verify --network sepolia \
  <POWERBALL_ADDRESS> \
  0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625 \
  <VRF_SUBSCRIPTION_ID> \
  0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c

# TexasHoldemAIDuel
npx hardhat verify --network sepolia \
  <POKER_ADDRESS> \
  0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625 \
  <VRF_SUBSCRIPTION_ID> \
  0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c \
  0xb83E47C2bC239B3bf370bc41e1459A34b41238D0 \
  <FUNCTIONS_SUBSCRIPTION_ID>
```

---

## 8. Production notes

### Security

- **Private key management**: use a hardware wallet or managed signing (e.g., KMS)
- **Contract ownership**: consider transferring ownership to a multisig (e.g., Gnosis Safe)
- **Gas/LINK monitoring**: monitor Chainlink subscription balances and top up
- **Emergency controls**: ensure you can pause/unpause in emergencies

### Performance

- **RPC provider**: use a paid RPC tier (Alchemy/Infura) to avoid public rate limits
- **Frontend deployment**: run `npm run build` and deploy static assets to Vercel/Netlify
- **CDN**: serve static assets via a CDN

### Monitoring

- **Chainlink Automation**: periodically check upkeep balance and execution status
- **Contract events**: index events using The Graph or Moralis
- **Frontend errors**: integrate an error tracker such as Sentry
