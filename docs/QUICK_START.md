# Pioneer — Quick Start (New Contributors)

This guide helps **first-time contributors** set up and run Pioneer from scratch.

---

## Prerequisites

| Tool | Download | Notes |
|------|----------|------|
| **Node.js** (>=18) | https://nodejs.org | Use the LTS version |
| **Git** | https://git-scm.com | Clone the repository |
| **VS Code** | https://code.visualstudio.com | Recommended editor |
| **MetaMask** browser extension | https://metamask.io | Ethereum wallet |

---

## Step 1: Get the code

```bash
git clone https://github.com/jbqvibecoding/cyberpunk-fortune.git
cd cyberpunk-fortune
```

---

## Step 2: Install dependencies

```bash
npm install
```

After installation you should see `node_modules/`. This usually takes 1–2 minutes.

---

## Step 3: Configure environment variables

```bash
# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and fill values depending on how much functionality you want:

### Minimal setup (frontend only, simulation mode)

```dotenv
VITE_WALLETCONNECT_PROJECT_ID=your_WalletConnect_Project_ID
```

How to get it:
1. Open https://cloud.walletconnect.com/
2. Sign up / sign in
3. Create a Project
4. Copy the Project ID

### Full setup (deploy contracts to Sepolia)

```dotenv
# Frontend
VITE_WALLETCONNECT_PROJECT_ID=your_ID
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_Key

# Contract deployment
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
VRF_SUBSCRIPTION_ID=your_VRF_subscription_id
FUNCTIONS_SUBSCRIPTION_ID=your_Functions_subscription_id

# Fill after deployment
VITE_CYBERPOWERBALL_ADDRESS=0x...
VITE_TEXASHOLDEM_ADDRESS=0x...

# Optional
ETHERSCAN_API_KEY=your_Etherscan_API_key
```

---

## Step 4: Start the project

```bash
npm run dev
```

You should see something like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.x.x:8080/
```

Open http://localhost:8080 in your browser.

---

## What you can do

### Without deploying contracts (simulation mode)

Even without deploying any smart contracts, you can experience most features:

| Feature | Available | Notes |
|--------|:---------:|------|
| Full UI | ✅ | Cyberpunk-style UI |
| Connect MetaMask | ✅ | RainbowKit wallet modal |
| Powerball pick & buy | ✅ | Local simulation |
| Powerball draw | ✅ | Local randomness simulation |
| Poker full hands | ✅ | Local AI simulation |
| Hand history | ✅ | Stored locally |

The UI shows a yellow **"SIMULATION MODE"** badge.

### After deploying contracts (on-chain mode)

| Feature | Notes |
|--------|------|
| Buy tickets with real ETH | MetaMask confirms the transaction |
| Chainlink VRF draws | Verifiable randomness |
| On-chain poker interactions | Actions recorded on-chain |
| Inspect transactions on Etherscan | Fully transparent |

The UI shows a green **"ON-CHAIN · SEPOLIA"** badge.

---

## Deploy contracts (advanced)

If you need full on-chain functionality, follow these steps:

### Step 1: Get testnet funds

```
Sepolia ETH:  https://sepoliafaucet.com/
Sepolia LINK: https://faucets.chain.link/sepolia
```

### Step 2: Create a Chainlink VRF subscription

1. Open https://vrf.chain.link → connect MetaMask → select Sepolia
2. Click **Create Subscription** → confirm
3. Click **Fund** → fund with 10 LINK
4. Record the **Subscription ID** and set `.env` `VRF_SUBSCRIPTION_ID`

### Step 3: Create a Chainlink Functions subscription

1. Open https://functions.chain.link → connect MetaMask → select Sepolia
2. Click **Create Subscription** → confirm
3. Click **Fund** → fund with 5 LINK
4. Record the **Subscription ID** and set `.env` `FUNCTIONS_SUBSCRIPTION_ID`

### Step 4: Compile & deploy

```bash
# Compile (first run can take ~2–3 minutes)
npx hardhat compile

# Deploy Powerball
npx hardhat run scripts/deploy-powerball.ts --network sepolia

# Deploy Poker
npx hardhat run scripts/deploy-poker.ts --network sepolia
```

Each deployment prints a contract address — copy it into your `.env`.

### Step 5: Register Chainlink consumers

1. **VRF**: https://vrf.chain.link → your subscription → **Add Consumer** → add both contract addresses
2. **Automation**: https://automation.chain.link → **Register New Upkeep** → Custom Logic → target CyberPowerball address
3. **Functions**: https://functions.chain.link → your subscription → **Add Consumer** → add TexasHoldemAIDuel address

### Step 6: Restart the frontend

```bash
npm run dev
```

Refresh the page — you should see the green **"ON-CHAIN · SEPOLIA"** badge.

---

## Project structure

```
cyberpunk-fortune/
├── contracts/                    # Solidity smart contracts
│   ├── CyberPowerball.sol       # Lottery (VRF + Automation)
│   ├── TexasHoldemAIDuel.sol    # Poker (VRF + Functions)
│   ├── MultiplayerPokerTable.sol
│   ├── NFTPass.sol
│   ├── PioneerToken.sol
│   ├── PlayerRegistry.sol
│   ├── Referral.sol
│   ├── interfaces/
│   └── libraries/
│
├── scripts/                      # Hardhat deployment scripts
│   ├── deploy-powerball.ts
│   └── deploy-poker.ts
│
├── src/                          # React frontend
│   ├── components/              # UI components
│   │   ├── games/
│   │   │   ├── PowerballGame.tsx
│   │   │   ├── PokerGame.tsx
│   │   │   └── poker/ & powerball/  # sub-components
│   │   └── layout/
│   │       └── Navbar.tsx       # Navbar + wallet connect
│   │
│   ├── hooks/                    # Game logic hooks
│   │   ├── usePowerball.ts      # Powerball (on-chain + simulation)
│   │   ├── usePokerGame.ts      # Poker (on-chain + simulation)
│   │   └── useWalletStatus.ts   # Wallet status
│   │
│   ├── lib/
│   │   ├── contracts/            # ABI + contract addresses
│   │   │   ├── addresses.ts
│   │   │   ├── CyberPowerballABI.ts
│   │   │   └── TexasHoldemABI.ts
│   │   ├── wagmi.ts              # Web3 provider config
│   │   └── poker/                # Poker logic helpers
│   │
│   ├── pages/
│   └── App.tsx                   # Root component (wrapped by WagmiProvider)
│
├── docs/                         # Documentation
│   ├── CHAINLINK_SETUP.md       # Chainlink setup
│   ├── DEPLOYMENT_AND_TESTING.md # Deployment & testing
│   └── QUICK_START.md           # This file
│
├── public/
│   └── NewLogo.png              # Project logo
│
├── hardhat.config.cjs            # Hardhat config
├── .env.example                  # Environment variables template
├── package.json
└── README.md
```

---

## FAQ

### Q: `npm run dev` fails to start

```bash
# Delete caches and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Q: Sepolia is not visible after connecting the wallet

MetaMask hides test networks by default:
1. MetaMask → Settings → Advanced → Show test networks → ON
2. Switch to Sepolia Test Network

### Q: MetaMask does not pop up when buying a ticket

Check:
1. Contracts are deployed (`.env` addresses are not `0x000...`)
2. Wallet is on Sepolia
3. Wallet has enough Sepolia ETH (e.g. >= 0.01 ETH)

### Q: Hardhat compilation fails with "stack too deep"

Make sure `viaIR: true` is enabled in `hardhat.config.cjs`:
```javascript
settings: {
  optimizer: { enabled: true, runs: 200 },
  viaIR: true,   // required for some complex contracts
}
```

### Q: Deployment fails with "insufficient funds"

Your deployer wallet has insufficient Sepolia ETH. Use https://sepoliafaucet.com/ to get more.

### Q: VRF callback does not execute

1. Ensure the contract is added as a VRF consumer
2. Ensure the VRF subscription has enough LINK
3. Check subscription status at https://vrf.chain.link

---

## Contact

If you have questions, please open a GitHub issue.
