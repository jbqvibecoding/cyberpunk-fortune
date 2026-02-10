# Cyberpunk Fortune (Pioneer)

Cyberpunk Fortune is a course/demo full-stack Web3 dApp:

- Frontend: React + Vite + TypeScript + Tailwind/shadcn UI
- Smart contracts: Solidity (Hardhat) covering a lottery and poker flows
- Deployment scripts: Hardhat scripts for Sepolia

This repo intentionally ships two contract “tracks”:

- **Chainlink-enabled track** (more realistic): contracts in `contracts/` (e.g., `CyberPowerball.sol`) integrate with Chainlink VRF/Automation/Functions.
- **Remix-friendly track** (minimal dependencies): contracts in `contracts/simple/` are self-contained so you can deploy quickly for demos.

## Repository checklist (course requirement)

- Contract code: `contracts/`
- Tests (Solidity): `test/`
- Frontend: `src/`
- Deployment scripts: `scripts/`
- Documentation: `README.md`, `TESTING.md`, and `docs/`

## Architecture design

### High-level components

- **UI layer** (`src/`): game pages + wallet connect (wagmi/viem/RainbowKit).
- **Web3 adapter** (`src/lib/` + hooks in `src/hooks/`): reads/writes against contracts; falls back to simulation when contract addresses are unset.
- **On-chain layer** (`contracts/`): lottery, poker, NFT pass, token/registry/referral utilities.
- **Deployment** (`scripts/` + `hardhat.config.cjs`): compile, test, deploy to local Hardhat or Sepolia.

### Data flow

1. User connects wallet (RainbowKit).
2. UI calls hook (e.g., `usePowerball`) which selects simulation vs on-chain mode.
3. On-chain mode uses contract ABIs + addresses to call functions via viem/ethers.
4. Chainlink-enabled contracts request randomness (VRF) and/or scheduled actions (Automation).
5. UI listens for transaction receipts/events and refreshes round state.

## Security analysis

This project is designed for learning; treat it as **not production-ready** without additional hardening.

### Key risks and mitigations

- **Randomness / fairness**
	- Chainlink track uses VRF to provide verifiable randomness.
	- Simple track uses commit-reveal / pseudo-random helper logic for demo only.
- **Reentrancy**
	- Prefer pull-payment accounting for prizes and refunds.
	- Critical paths use `ReentrancyGuard` where applicable.
- **Access control**
	- Administrative functions are `onlyOwner` / restricted.
	- Deployment keys must be kept in `.env` and never committed.
- **Input validation**
	- Lottery number ranges and duplicates are validated.
	- Addresses are checked against `address(0)` where appropriate.
- **Economic attacks / MEV**
	- Lottery-like systems can be sensitive to front-running and timing games.
	- For production, consider commit-reveal for user entries, tighter round boundaries, and formal economic review.

### Recommended next steps before any mainnet use

- Formal audit + threat modeling (reentrancy, oracle usage, MEV, griefing).
- Comprehensive invariant/fuzz testing on all game flows.
- Explicit pausability / emergency controls for external dependency failures.

## Gas optimization report

### What is already enabled

- Solidity optimizer is enabled (`runs: 200`) and `viaIR: true` in `hardhat.config.cjs`.

### Design-level optimizations used or recommended

- Minimize storage writes on hot paths (ticket purchase, claim, state transitions).
- Use smaller integer widths (`uint8`, `uint16`) where it is safe and improves packing.
- Prefer pull payments (`pendingWithdrawals`) instead of push transfers.
- Keep events focused; avoid logging large arrays unless necessary.

### How to measure

- Gas regression tests live in `test/gas/`.
- Enable gas reporter during Hardhat test runs (see Testing section).

## Testing & coverage

Course requirement summary:

- Line coverage target: **>= 80%**
- Must include: **unit**, **integration**, **fuzzing**, and **gas** tests

### Commands

Frontend unit tests:

```bash
npm run test
```

Frontend coverage:

```bash
npm run test -- --coverage
```

Solidity unit/integration tests (Hardhat):

```bash
npm run test:solidity
```

Solidity coverage (Hardhat):

```bash
npm run test:solidity:coverage
```

Gas-focused tests:

```bash
npm run test:gas
```

Fuzzing (Foundry):

```bash
npm run fuzz:foundry
```

See `TESTING.md` for the detailed testing plan.

## Deployment guide

### 1) Install & build

```bash
npm install
npx hardhat compile
```

### 2) Local development (frontend)

```bash
copy .env.example .env
npm run dev
```

If contract addresses are not set, the frontend runs in simulation mode.

### 3) Deploy to Sepolia (Hardhat scripts)

1. Create `.env` from `.env.example` and set at least:

- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_SEPOLIA_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `VRF_SUBSCRIPTION_ID` (if using VRF)
- `FUNCTIONS_SUBSCRIPTION_ID` (if using Functions)

2. Deploy:

```bash
npx hardhat run scripts/deploy-powerball.ts --network sepolia
npx hardhat run scripts/deploy-poker.ts --network sepolia
```

3. Put deployed addresses into `.env`:

- `VITE_CYBERPOWERBALL_ADDRESS=0x...`
- `VITE_TEXASHOLDEM_ADDRESS=0x...`

4. Configure Chainlink services (VRF consumers, Automation upkeep, Functions consumers).

Full walkthroughs:

- `docs/QUICK_START.md`
- `docs/DEPLOYMENT_AND_TESTING.md`
- `docs/CHAINLINK_SETUP.md`

## NatSpec (Solidity documentation)

All externally callable Solidity functions should carry NatSpec comments (`@notice`, `@dev`, and parameter tags where helpful). This improves readability and enables automated documentation tooling.

Example:

```solidity
/// @notice Mint a pass NFT (one per address per type)
/// @dev Prevents double-mint via hasMintedType mapping
/// @param _type Pass type (0=DoublePlayPass, 1=NoLossPass)
function mintPass(uint8 _type) external { /* ... */ }
```

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_WALLETCONNECT_PROJECT_ID` | ✅ | [WalletConnect Cloud](https://cloud.walletconnect.com/) |
| `VITE_SEPOLIA_RPC_URL` | Optional | Alchemy/Infura Sepolia RPC |
| `VITE_CYBERPOWERBALL_ADDRESS` | After deployment | CyberPowerball contract address |
| `VITE_TEXASHOLDEM_ADDRESS` | After deployment | TexasHoldemAIDuel contract address |
| `DEPLOYER_PRIVATE_KEY` | During deployment | Deployer wallet private key |
| `VRF_SUBSCRIPTION_ID` | During deployment | Chainlink VRF subscription ID |
| `FUNCTIONS_SUBSCRIPTION_ID` | During deployment | Chainlink Functions subscription ID |
| `ETHERSCAN_API_KEY` | Optional | For contract verification |

---

## Common Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npx hardhat compile  # Compile contracts
npx hardhat console --network sepolia  # Sepolia interactive console
```

---

## License

MIT
