# Pioneer — 完整部署与测试指南

本文档覆盖从零开始部署整个 Pioneer 项目到 Sepolia 测试网的完整流程，包括合约部署、前端配置和功能测试。

---

## 目录

1. [环境准备](#1-环境准备)
2. [前端独立运行（模拟模式）](#2-前端独立运行模拟模式)
3. [合约编译与部署](#3-合约编译与部署)
4. [Chainlink 服务配置](#4-chainlink-服务配置)
5. [前端连接链上合约](#5-前端连接链上合约)
6. [功能测试清单](#6-功能测试清单)
7. [合约验证（Etherscan）](#7-合约验证etherscan)
8. [生产部署注意事项](#8-生产部署注意事项)

---

## 1. 环境准备

### 1.1 系统要求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 18.x | 运行前端 & Hardhat |
| npm | ≥ 9.x | 包管理 |
| Git | 任意 | 克隆代码 |
| MetaMask | 最新版 | 浏览器钱包 |

### 1.2 获取测试网资源

```
Sepolia ETH:  https://sepoliafaucet.com/
              https://www.alchemy.com/faucets/ethereum-sepolia
Sepolia LINK: https://faucets.chain.link/sepolia
```

建议余额：
- **Sepolia ETH**: ≥ 0.5 ETH（部署 + 测试交易）
- **Sepolia LINK**: ≥ 25 LINK（VRF + Automation）

### 1.3 获取 API Key

| 服务 | 地址 | 用途 |
|------|------|------|
| WalletConnect Cloud | https://cloud.walletconnect.com/ | RainbowKit 钱包弹窗 |
| Alchemy / Infura | https://alchemy.com / https://infura.io | Sepolia RPC 节点 |
| Etherscan | https://etherscan.io/apis | 合约验证（可选） |

---

## 2. 前端独立运行（模拟模式）

无需部署合约，可以直接运行前端查看 UI 和模拟功能：

```bash
# 1. 克隆仓库
git clone https://github.com/jbqvibecoding/cyberpunk-fortune.git
cd cyberpunk-fortune

# 2. 安装依赖
npm install

# 3. 创建环境变量
cp .env.example .env

# 4. 编辑 .env — 最少只需要 WalletConnect ID
#    VITE_WALLETCONNECT_PROJECT_ID=你的ID

# 5. 启动开发服务器
npm run dev
```

打开 http://localhost:8080：

- **Powerball**: 选号、买票、模拟抽奖 — 全功能模拟
- **Poker**: 选择买入金额、开始游戏、与 AI 对战 — 全功能模拟
- **钱包连接**: 可正常连接 MetaMask，页面显示 "SIMULATION MODE" 标志

> 模拟模式下所有合约地址为 `0x000...000`，前端自动回退到本地模拟逻辑。

---

## 3. 合约编译与部署

### 3.1 编译合约

```bash
npx hardhat compile
```

首次编译约需 2-3 分钟（启用了 `viaIR`），成功后显示：
```
Compiled 43 Solidity files successfully (with 1 warning).
```

### 3.2 配置部署环境变量

编辑 `.env` 文件：

```dotenv
# 部署者私钥（导出方法见下方）
DEPLOYER_PRIVATE_KEY=0xabc123...

# Sepolia RPC URL
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/你的APIKey

# Chainlink 订阅 ID（先创建，见第 4 节）
VRF_SUBSCRIPTION_ID=12345
FUNCTIONS_SUBSCRIPTION_ID=67890
```

**如何导出 MetaMask 私钥：**
1. MetaMask → 点击账户 → "Account Details" → "Show Private Key"
2. 输入密码，复制私钥
3. ⚠️ **绝对不要提交 `.env` 文件到 Git！**

### 3.3 部署 CyberPowerball

```bash
npx hardhat run scripts/deploy-powerball.ts --network sepolia
```

输出示例：
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

**立即把地址写入 `.env`：**
```dotenv
VITE_CYBERPOWERBALL_ADDRESS=0xABC123...DEF
```

### 3.4 部署 TexasHoldemAIDuel

```bash
npx hardhat run scripts/deploy-poker.ts --network sepolia
```

**把地址写入 `.env`：**
```dotenv
VITE_TEXASHOLDEM_ADDRESS=0x789XYZ...
```

---

## 4. Chainlink 服务配置

部署完合约后，需配置 Chainlink 服务。详细步骤见 [docs/CHAINLINK_SETUP.md](CHAINLINK_SETUP.md)。

### 快速配置清单

```
1. VRF Subscription (https://vrf.chain.link)
   ├── 创建 Subscription
   ├── 充值 10 LINK
   ├── 添加 Consumer: CyberPowerball 地址
   └── 添加 Consumer: TexasHoldemAIDuel 地址

2. Automation Upkeep (https://automation.chain.link)
   ├── Register New Upkeep → Custom Logic
   ├── Target: CyberPowerball 地址
   ├── Gas limit: 750000
   └── 充值 5 LINK

3. Functions Subscription (https://functions.chain.link)
   ├── 创建 Subscription
   ├── 充值 5 LINK
   └── 添加 Consumer: TexasHoldemAIDuel 地址
```

---

## 5. 前端连接链上合约

合约部署 + Chainlink 配置完成后：

```bash
# 确保 .env 已更新合约地址
npm run dev
```

打开 http://localhost:8080 → 连接 MetaMask → 切换到 Sepolia 网络：

- Powerball 和 Poker 区域应显示 **"ON-CHAIN · SEPOLIA"** 绿色标志
- 购买彩票/开始游戏会弹出 MetaMask 交易确认

---

## 6. 功能测试清单

### 6.1 Powerball 彩票功能测试

| # | 测试项 | 步骤 | 预期结果 |
|---|--------|------|---------|
| 1 | 选号 | 点选 5 个主号 + 1 个 Powerball | 号码高亮，"BUY" 按钮激活 |
| 2 | 快速选号 | 点击 "QUICK PICK" | 自动随机选满 6 个号码 |
| 3 | 模拟购票 | 未连接钱包/合约未部署 → 点按钮 | 显示 "SIMULATION MODE"，票添加到列表 |
| 4 | 链上购票 | 连接钱包 + 合约已部署 → 买票 | MetaMask 弹出，确认后显示 tx hash 链接 |
| 5 | 模拟抽奖 | 模拟模式下，倒计时到 0 | 开奖动画播放，结果显示 |
| 6 | 链上抽奖 | Automation 自动触发 | `DrawCompleted` 事件更新开奖结果 |
| 7 | 查看历史 | 切换到 "HISTORY" 标签 | 历史开奖记录显示 |

### 6.2 Poker 扑克功能测试

| # | 测试项 | 步骤 | 预期结果 |
|---|--------|------|---------|
| 1 | 进入游戏 | 选择 Stake → 设置买入 → "ENTER GAME" | 进入牌桌界面 |
| 2 | 开始对局 | 点击 "DEAL" | 发牌动画，玩家收到 2 张底牌 |
| 3 | 玩家操作 | 点击 Fold/Check/Call/Raise/All-In | 操作执行，AI 自动回应 |
| 4 | AI 回应 | 等待 AI 思考 | AI 显示思考状态后执行决策 |
| 5 | 完整对局 | 打完一手牌到 showdown | 显示赢家、牌型、筹码变化 |
| 6 | 链上交互 | 合约部署后 → 开始游戏 | MetaMask 弹出确认交易 |
| 7 | 新一手 | 上一手结束 → "NEXT HAND" | 庄位切换，新牌局开始 |

### 6.3 钱包功能测试

| # | 测试项 | 步骤 | 预期结果 |
|---|--------|------|---------|
| 1 | 连接钱包 | 点击导航栏 "Connect Wallet" | RainbowKit 弹窗，选择 MetaMask |
| 2 | 网络切换 | 连接后如果不在 Sepolia | 自动提示切换网络 |
| 3 | 地址显示 | 连接成功 | 导航栏显示缩略地址 |
| 4 | 断开连接 | 点击地址 → "Disconnect" | 恢复到未连接状态 |

### 6.4 链上交互验证

使用 Etherscan 验证交易是否成功：

```
https://sepolia.etherscan.io/address/<合约地址>
```

检查：
- **Transactions** 标签：是否有 `buyTicket`、`startGame` 等交易
- **Events** 标签：是否有 `TicketPurchased`、`DrawCompleted` 等事件
- **Internal Txns**：VRF 回调是否成功

### 6.5 手动测试 VRF（Hardhat Console）

```bash
npx hardhat console --network sepolia
```

```javascript
// 测试 CyberPowerball
const pb = await ethers.getContractAt("CyberPowerball", "0x<POWERBALL_ADDRESS>");

// 查看当前轮次
const roundId = await pb.currentRoundId();
console.log("Current Round:", roundId.toString());

// 查看票价
const price = await pb.ticketPrice();
console.log("Ticket Price:", ethers.formatEther(price), "ETH");

// 买一张票
const tx = await pb.buyTicket([1, 2, 3, 4, 5], 10, { value: price });
await tx.wait();
console.log("Ticket purchased! TX:", tx.hash);

// 检查是否需要触发抽奖
const [needed, data] = await pb.checkUpkeep("0x");
console.log("Upkeep needed:", needed);
```

```javascript
// 测试 TexasHoldemAIDuel
const poker = await ethers.getContractAt("TexasHoldemAIDuel", "0x<POKER_ADDRESS>");

// 查看最低买入
const minBuy = await poker.minBuyIn();
console.log("Min buy-in:", ethers.formatEther(minBuy), "ETH");

// 开始游戏
const tx = await poker.startGame({ value: minBuy });
await tx.wait();
console.log("Game started! TX:", tx.hash);

// 查看活跃游戏
const [signer] = await ethers.getSigners();
const gameId = await poker.activeGame(signer.address);
console.log("Active game ID:", gameId.toString());
```

---

## 7. 合约验证（Etherscan）

验证合约后，可以在 Etherscan 上查看源码和直接调用函数。

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

## 8. 生产部署注意事项

### 安全性

- **私钥管理**: 正式环境使用硬件钱包或 AWS KMS 签名
- **合约所有权**: 部署后考虑转移 owner 到多签钱包（如 Gnosis Safe）
- **gas 监控**: 监控 Chainlink Subscription 余额，及时充值
- **暂停机制**: CyberPowerball 合约有 `pause()` / `unpause()` 函数，紧急时可暂停

### 性能

- **RPC 节点**: 使用 Alchemy/Infura 的付费节点，避免公共节点限速
- **前端部署**: 使用 `npm run build` 生成静态文件，部署到 Vercel/Netlify
- **CDN**: 静态资源通过 CDN 分发

### 监控

- **Chainlink Automation**: 定期检查 Upkeep 余额和执行状态
- **合约事件**: 使用 The Graph 或 Moralis 索引历史事件
- **前端错误**: 集成 Sentry 等错误追踪
