 # Cyberpunk Fortune

This repository contains the Cyberpunk Fortune dApp: a frontend (React + Vite + TypeScript) and several Solidity smart contracts (Hardhat) for a demo lottery & poker platform. The project was simplified for course/demo use and includes four lightweight on-chain contracts deployable via Remix or Hardhat.

## Contents

- `contracts/` — Solidity contracts (including `contracts/simple` demo contracts)
- `src/` — React + TypeScript frontend
- `test/` — Solidity tests (Hardhat)
- `scripts/` — deployment helper scripts

---

## Architecture Design

Overview:

- Frontend: React + Vite + wagmi/viem + RainbowKit for wallet connectivity.
- Smart contracts: Solidity ^0.8.19. Simple, self-contained contracts in `contracts/simple` for easy Remix deployment (no external Chainlink dependencies).
- Deployment: Contracts can be deployed using Remix (recommended for quick demo) or Hardhat for local/full-stack testing.

Data flow and components:

- Wallet → Frontend (wagmi) → Contracts (via ethers/viem)
- `SimpleLottery` and `SimplePoker` implement commit-reveal patterns for randomness simulation
- `GameNFT` is a minimal ERC-721 used to gate premium play modes
- `GameReferral` tracks on-chain referrals and rewards

---

## Security Analysis

This section documents key security considerations and mitigations implemented across contracts.

- Access Control: Owner-only functions are protected with `onlyOwner` modifier. Sensitive functions that update state must be restricted to owner.
- Re-entrancy: Contracts are simple and avoid external calls in critical sections. If external calls are introduced, add `ReentrancyGuard` or pull-over-push pattern.
- Arithmetic Safety: Solidity ^0.8.x has built-in overflow checks. Avoid unchecked blocks unless gas-optimizing and safe.
- Input Validation: Functions validate inputs (e.g., token type ranges, non-zero addresses).
- Randomness: Demo contracts use commit-reveal / simulated VRF. This is NOT production-grade — do not use for real high-value lotteries.
- Refunds & Pull Payments: Prize withdrawals are implemented as pull payments where appropriate to avoid forced transfers.

Audit recommendations (before production):

- Full formal audit for economic attack vectors (front-running, oracle manipulation).
- Use a secure randomness Oracle (Chainlink VRF) for production randomness.
- Penetration testing for all off-chain integrations (OpenAI, ENS resolution, 3rd-party RPC endpoints).

---

## Gas Optimization Report

Summary of gas-related design choices and optimizations applied:

- Use minimal storage writes: prefer mappings and compact types (e.g., `uint8` for enum values).
- Batch operations where possible to avoid multiple transactions.
- Avoid unnecessary events that increase logs cost unless required for monitoring/auditing.
- Use unchecked blocks only where overflow is mathematically impossible (document these spots carefully).

Suggested steps to measure and improve gas further:

- Run `hardhat test` with `hardhat-gas-reporter` or use `forge` (Foundry) to collect gas usage per function.
- Identify hot-paths (e.g., ticket purchase, prize distribution) and reduce storage ops / external calls.

---

## Deployment Guide

Quick deploy (Remix + MetaMask — Sepolia recommended for demo):

1. Open `remix.ethereum.org`, create a new workspace, paste each contract from `contracts/simple/*.sol`.
2. Compile with Solidity `^0.8.19`.
3. In *Deploy & Run* set environment to `Injected Provider - MetaMask` and ensure MetaMask is set to Sepolia.
4. Deploy contracts one by one. Copy deployed addresses.
5. Open `src/lib/contracts/addresses.ts` and replace the `GameNFT`, `SimpleLottery`, `SimplePoker`, and `GameReferral` addresses with the deployed addresses (or set respective `VITE_` env vars and restart dev server).

Hardhat (local testing / scripted deploy):

1. Install dependencies: `npm install`.
2. Compile: `npx hardhat compile`.
3. Run tests: `npm run test:solidity`.
4. To deploy to a network, configure `hardhat.config.cjs` with an RPC key and private key, then run a deploy script.

---

## NatSpec & Documentation

All public functions in Solidity contracts include NatSpec-style comments where appropriate. For production, ensure every externally visible function has a clear `@notice` and `@dev` annotation.

Example:

```solidity
/// @notice Mint a pass NFT (one per address per type)
/// @dev Uses an internal mapping to prevent double-mint
function mintPass(uint8 _type) external { ... }
```

---

## Contact / Contribution

If you need help preparing slides or demo steps for your course, open an issue or contact the maintainer.

# Pioneer — Cyberpunk Web3 Gaming Platform

> 去中心化博彩游戏平台 · Ethereum Sepolia · Chainlink VRF · React 18

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)

## 功能

| 游戏 | 说明 | 链上技术 |
|------|------|---------|
| **Cyber-Powerball** | 选 5 个主球 + 1 个强力球，Chainlink VRF 开奖 | VRF V2 + Automation |
| **Texas Hold'em AI Duel** | 1v1 对战 LLM AI，Chainlink VRF 发牌 | VRF V2 + Functions (预留) |

**双模式运行**：合约部署前为模拟模式（前端纯本地），部署后自动切换为链上模式。

---

## 快速开始（3 分钟）

```bash
git clone https://github.com/jbqvibecoding/cyberpunk-fortune.git
cd cyberpunk-fortune
npm install
cp .env.example .env        # 编辑 .env，填入 VITE_WALLETCONNECT_PROJECT_ID
npm run dev                  # → http://localhost:8080
```

无需部署合约即可体验全部 UI 和模拟功能。

> 📖 详细搭建步骤见 **[docs/QUICK_START.md](docs/QUICK_START.md)**

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui |
| **Web3** | wagmi v2 · viem · ethers v6 · RainbowKit |
| **合约** | Solidity 0.8.19 · Hardhat · OpenZeppelin 4.9 · Chainlink VRF/Functions/Automation |
| **网络** | Ethereum Sepolia Testnet |

---

## 合约部署（进阶）

### 前置条件

- Sepolia ETH ≥ 0.5 ETH → [领取](https://sepoliafaucet.com/)
- Sepolia LINK ≥ 25 LINK → [领取](https://faucets.chain.link/sepolia)
- Chainlink VRF Subscription → [创建](https://vrf.chain.link)
- Chainlink Functions Subscription → [创建](https://functions.chain.link)

### 部署流程

```bash
# 1. 配置环境变量
cp .env.example .env
# 填入: DEPLOYER_PRIVATE_KEY, VRF_SUBSCRIPTION_ID, FUNCTIONS_SUBSCRIPTION_ID 等

# 2. 编译合约
npx hardhat compile

# 3. 部署 Powerball
npx hardhat run scripts/deploy-powerball.ts --network sepolia

# 4. 部署 Poker
npx hardhat run scripts/deploy-poker.ts --network sepolia

# 5. 将输出的合约地址填入 .env:
#    VITE_CYBERPOWERBALL_ADDRESS=0x...
#    VITE_TEXASHOLDEM_ADDRESS=0x...

# 6. 配置 Chainlink（VRF Consumer + Automation Upkeep + Functions Consumer）

# 7. 重启前端
npm run dev
```

> 📖 完整步骤见 **[docs/DEPLOYMENT_AND_TESTING.md](docs/DEPLOYMENT_AND_TESTING.md)**
>
> 📖 Chainlink 配置详解见 **[docs/CHAINLINK_SETUP.md](docs/CHAINLINK_SETUP.md)**

---

## 项目结构

```
├── contracts/                   Solidity 智能合约
│   ├── CyberPowerball.sol       彩票 (VRF + Automation)
│   ├── TexasHoldemAIDuel.sol    扑克 (VRF + Functions)
│   └── ...                      NFTPass, Token, Registry 等
├── scripts/                     Hardhat 部署脚本
├── src/
│   ├── components/              React UI 组件
│   ├── hooks/                   游戏逻辑 Hooks（链上+模拟混合）
│   ├── lib/contracts/           ABI + 合约地址配置
│   └── lib/wagmi.ts             Web3 Provider 配置
├── docs/                        完整文档
│   ├── QUICK_START.md           新人搭建指南
│   ├── DEPLOYMENT_AND_TESTING.md 部署与测试指南
│   └── CHAINLINK_SETUP.md      Chainlink 服务配置
├── hardhat.config.cjs           Hardhat 配置
└── .env.example                 环境变量模板
```

---

## 文档索引

| 文档 | 内容 | 适合谁 |
|------|------|--------|
| [docs/QUICK_START.md](docs/QUICK_START.md) | 从零搭建项目，含常见问题 | 新成员、初次使用者 |
| [docs/DEPLOYMENT_AND_TESTING.md](docs/DEPLOYMENT_AND_TESTING.md) | 合约部署、功能测试清单、Etherscan 验证 | 开发者、部署者 |
| [docs/CHAINLINK_SETUP.md](docs/CHAINLINK_SETUP.md) | VRF/Automation/Functions 配置详解 | 合约运维、进阶开发 |

---

## 环境变量

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `VITE_WALLETCONNECT_PROJECT_ID` | ✅ | [WalletConnect Cloud](https://cloud.walletconnect.com/) |
| `VITE_SEPOLIA_RPC_URL` | 可选 | Alchemy/Infura Sepolia RPC |
| `VITE_CYBERPOWERBALL_ADDRESS` | 部署后 | CyberPowerball 合约地址 |
| `VITE_TEXASHOLDEM_ADDRESS` | 部署后 | TexasHoldemAIDuel 合约地址 |
| `DEPLOYER_PRIVATE_KEY` | 部署时 | 部署者钱包私钥 |
| `VRF_SUBSCRIPTION_ID` | 部署时 | Chainlink VRF 订阅 ID |
| `FUNCTIONS_SUBSCRIPTION_ID` | 部署时 | Chainlink Functions 订阅 ID |
| `ETHERSCAN_API_KEY` | 可选 | 合约验证用 |

---

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npx hardhat compile  # 编译合约
npx hardhat console --network sepolia  # Sepolia 交互控制台
```

---

## License

MIT
