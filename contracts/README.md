# Pioneer Web3 Gaming Platform - Smart Contracts

## Overview

This repository contains the core smart contracts for the Pioneer decentralized gaming platform, featuring:

1. **CyberPowerball** - A decentralized lottery with Chainlink VRF
2. **TexasHoldemAIDuel** - 1v1 Texas Hold'em against an LLM-powered AI

## Architecture

```
contracts/
├── CyberPowerball.sol        # Main lottery contract
├── TexasHoldemAIDuel.sol     # Poker game contract
├── interfaces/
│   └── IVRFConsumer.sol      # VRF interface
├── libraries/
│   └── PokerHandEvaluator.sol # Hand evaluation library
└── README.md
```

## Dependencies

- **OpenZeppelin Contracts** - Access control, reentrancy protection
- **Chainlink VRF v2** - Verifiable random number generation
- **Chainlink Functions** - AI integration (OpenAI API calls)
- **Chainlink Automation** - Scheduled lottery draws

## Contract Details

### CyberPowerball.sol

**Features:**
- Pick 5 main numbers (1-69) + 1 Powerball (1-26)
- Automated daily draws via Chainlink Automation
- 9 prize tiers matching Powerball rules
- Jackpot rollover mechanism
- Quick Pick random number generation

**Key Functions:**
- `buyTicket(uint8[5] mainNumbers, uint8 powerball)` - Purchase a ticket
- `buyQuickPick()` - Auto-generate random numbers
- `claimPrize(uint256 ticketId)` - Claim winnings
- `performUpkeep()` - Trigger scheduled draw (Chainlink Automation)

**Prize Tiers:**
| Tier | Match | Prize % |
|------|-------|---------|
| 0 | 5 + PB | 40% (Jackpot) |
| 1 | 5 | 10% |
| 2 | 4 + PB | 5% |
| 3 | 4 | 2% |
| 4 | 3 + PB | 1% |
| 5 | 3 | 0.5% |
| 6 | 2 + PB | 0.3% |
| 7 | 1 + PB | 0.1% |
| 8 | PB only | 0.05% |

### TexasHoldemAIDuel.sol

**Features:**
- 1v1 player vs AI
- Full Texas Hold'em rules
- Chainlink VRF for provably fair card dealing
- AI strategy powered by LLM (via Chainlink Functions)
- Commit-reveal mechanism for anti-cheat
- Automatic chip management

**Key Functions:**
- `startGame()` - Begin a new game session (with ETH buy-in)
- `fold()` / `check()` / `call()` / `raise(amount)` / `allIn()` - Player actions
- `cashOut()` - End session and withdraw winnings
- `claimAITimeout()` - Claim pot if AI times out

**Game Flow:**
1. Player connects wallet and buys in
2. Cards dealt via Chainlink VRF
3. Standard betting rounds (pre-flop, flop, turn, river)
4. AI decisions via Chainlink Functions → OpenAI API
5. Showdown and automatic pot distribution
6. Dealer rotates, next hand begins
7. Game ends when one side runs out of chips

## Deployment

### Prerequisites

1. Install dependencies:
```bash
npm install @openzeppelin/contracts @chainlink/contracts
```

2. Configure environment:
```env
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_key
VRF_COORDINATOR=0x...
VRF_SUBSCRIPTION_ID=123
VRF_KEY_HASH=0x...
FUNCTIONS_ROUTER=0x...
FUNCTIONS_SUBSCRIPTION_ID=456
```

### Testnet Deployment (Sepolia)

```bash
# Deploy CyberPowerball
npx hardhat run scripts/deploy-powerball.js --network sepolia

# Deploy TexasHoldemAIDuel
npx hardhat run scripts/deploy-poker.js --network sepolia
```

### Chainlink Setup

1. **VRF v2:**
   - Create subscription at [vrf.chain.link](https://vrf.chain.link)
   - Fund subscription with LINK
   - Add contract addresses as consumers

2. **Automation:**
   - Register upkeep at [automation.chain.link](https://automation.chain.link)
   - Point to CyberPowerball contract
   - Fund with LINK

3. **Functions:**
   - Create subscription at [functions.chain.link](https://functions.chain.link)
   - Deploy and encrypt OpenAI API key
   - Add TexasHoldemAIDuel as consumer

## Network Addresses

### Sepolia Testnet

| Contract | Address |
|----------|---------|
| CyberPowerball | `TBD` |
| TexasHoldemAIDuel | `TBD` |

### Ethereum Mainnet

| Contract | Address |
|----------|---------|
| CyberPowerball | `TBD` |
| TexasHoldemAIDuel | `TBD` |

## Security Considerations

1. **Randomness**: All randomness comes from Chainlink VRF - verifiable on-chain
2. **Reentrancy**: Protected via OpenZeppelin's ReentrancyGuard
3. **Access Control**: Admin functions restricted to owner
4. **Commit-Reveal**: AI decisions use commitment scheme
5. **Timeouts**: AI has maximum response time to prevent griefing

## Gas Estimates

| Function | Est. Gas |
|----------|----------|
| buyTicket | ~120,000 |
| buyQuickPick | ~150,000 |
| claimPrize | ~80,000 |
| startGame | ~200,000 |
| fold/check/call | ~60,000 |
| raise | ~80,000 |

## Testing

```bash
npx hardhat test
npx hardhat coverage
```

## License

MIT License
