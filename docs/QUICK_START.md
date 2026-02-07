# Pioneer — 新成员快速搭建指南

> 本文档面向 **首次接触本项目的开发者**，手把手教你从零搭建并运行 Pioneer。

---

## 你需要准备什么

| 工具 | 下载地址 | 说明 |
|------|---------|------|
| **Node.js** (≥18) | https://nodejs.org | 选 LTS 版本 |
| **Git** | https://git-scm.com | 克隆代码 |
| **VS Code** | https://code.visualstudio.com | 推荐编辑器 |
| **MetaMask** 浏览器插件 | https://metamask.io | 以太坊钱包 |

---

## 第一步：获取代码

```bash
git clone https://github.com/jbqvibecoding/cyberpunk-fortune.git
cd cyberpunk-fortune
```

---

## 第二步：安装依赖

```bash
npm install
```

> 安装结束后会有 `node_modules/` 目录，约需 1-2 分钟。

---

## 第三步：配置环境变量

```bash
# Windows CMD
copy .env.example .env

# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

用编辑器打开 `.env`，根据你需要的功能级别填写：

### 最简配置（仅运行前端，模拟模式）

```dotenv
VITE_WALLETCONNECT_PROJECT_ID=你的WalletConnect_ID
```

获取方式：
1. 打开 https://cloud.walletconnect.com/
2. 注册 / 登录
3. 创建一个 Project
4. 复制 Project ID

### 完整配置（部署合约到 Sepolia）

```dotenv
# 前端
VITE_WALLETCONNECT_PROJECT_ID=你的ID
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/你的Key

# 合约部署
DEPLOYER_PRIVATE_KEY=你的部署者钱包私钥
VRF_SUBSCRIPTION_ID=你的VRF订阅ID
FUNCTIONS_SUBSCRIPTION_ID=你的Functions订阅ID

# 部署后填入
VITE_CYBERPOWERBALL_ADDRESS=0x...
VITE_TEXASHOLDEM_ADDRESS=0x...

# 可选
ETHERSCAN_API_KEY=你的Etherscan_APIKey
```

---

## 第四步：启动项目

```bash
npm run dev
```

控制台显示：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.x.x:8080/
```

在浏览器打开 http://localhost:8080 即可看到项目页面。

---

## 你能做什么

### 不部署合约（模拟模式）

即使不部署智能合约，你也能体验大部分功能：

| 功能 | 可用性 | 说明 |
|------|:------:|------|
| 浏览完整 UI | ✅ | Cyberpunk 风格界面 |
| 连接 MetaMask | ✅ | RainbowKit 钱包弹窗 |
| Powerball 选号购票 | ✅ | 本地模拟 |
| Powerball 抽奖 | ✅ | 本地随机模拟 |
| Poker 完整对局 | ✅ | 本地 AI 模拟 |
| 查看手牌历史 | ✅ | 本地存储 |

页面上显示 **"SIMULATION MODE"** 黄色标志。

### 部署合约后（链上模式）

| 功能 | 说明 |
|------|------|
| 真实 ETH 购买彩票 | MetaMask 确认交易 |
| Chainlink VRF 公证抽奖 | 可验证的随机数 |
| 链上 Poker 对战 | 操作记录在区块链上 |
| Etherscan 查看交易 | 完全透明 |

页面上显示 **"ON-CHAIN · SEPOLIA"** 绿色标志。

---

## 部署合约（进阶）

如果你需要完整的链上功能，请按以下顺序操作：

### 步骤 1：准备测试网资源

```
Sepolia ETH:  https://sepoliafaucet.com/
Sepolia LINK: https://faucets.chain.link/sepolia
```

### 步骤 2：创建 Chainlink VRF 订阅

1. 打开 https://vrf.chain.link → 连接 MetaMask → 选 Sepolia
2. "Create Subscription" → 确认交易
3. "Fund" → 充 10 LINK
4. 记录 **Subscription ID**，填入 `.env` 的 `VRF_SUBSCRIPTION_ID`

### 步骤 3：创建 Chainlink Functions 订阅

1. 打开 https://functions.chain.link → 连接 MetaMask → 选 Sepolia
2. "Create Subscription" → 确认交易
3. "Fund" → 充 5 LINK
4. 记录 **Subscription ID**，填入 `.env` 的 `FUNCTIONS_SUBSCRIPTION_ID`

### 步骤 4：编译与部署

```bash
# 编译（首次约 2-3 分钟）
npx hardhat compile

# 部署 Powerball
npx hardhat run scripts/deploy-powerball.ts --network sepolia

# 部署 Poker
npx hardhat run scripts/deploy-poker.ts --network sepolia
```

每个部署命令会输出合约地址，填入 `.env`。

### 步骤 5：注册 Chainlink Consumer

1. **VRF**: https://vrf.chain.link → 你的 Subscription → "Add Consumer" → 填入两个合约地址
2. **Automation**: https://automation.chain.link → "Register New Upkeep" → Custom Logic → 填入 CyberPowerball 地址
3. **Functions**: https://functions.chain.link → 你的 Subscription → "Add Consumer" → 填入 TexasHoldemAIDuel 地址

### 步骤 6：重启前端

```bash
npm run dev
```

刷新页面，应该看到绿色的 "ON-CHAIN · SEPOLIA" 标志。

---

## 项目结构

```
cyberpunk-fortune/
├── contracts/                    # Solidity 智能合约
│   ├── CyberPowerball.sol       # 彩票合约 (VRF + Automation)
│   ├── TexasHoldemAIDuel.sol    # 扑克合约 (VRF + Functions)
│   ├── MultiplayerPokerTable.sol
│   ├── NFTPass.sol
│   ├── PioneerToken.sol
│   ├── PlayerRegistry.sol
│   ├── Referral.sol
│   ├── interfaces/
│   └── libraries/
│
├── scripts/                      # 部署脚本
│   ├── deploy-powerball.ts
│   └── deploy-poker.ts
│
├── src/                          # React 前端
│   ├── components/              # UI 组件
│   │   ├── games/
│   │   │   ├── PowerballGame.tsx
│   │   │   ├── PokerGame.tsx
│   │   │   └── poker/ & powerball/  # 子组件
│   │   └── layout/
│   │       └── Navbar.tsx       # 导航栏 + 钱包连接
│   │
│   ├── hooks/                    # 游戏逻辑 Hooks
│   │   ├── usePowerball.ts      # Powerball（链上+模拟混合）
│   │   ├── usePokerGame.ts      # Poker（链上+模拟混合）
│   │   └── useWalletStatus.ts   # 钱包状态
│   │
│   ├── lib/
│   │   ├── contracts/            # ABI + 合约地址
│   │   │   ├── addresses.ts
│   │   │   ├── CyberPowerballABI.ts
│   │   │   └── TexasHoldemABI.ts
│   │   ├── wagmi.ts              # Web3 Provider 配置
│   │   └── poker/                # 扑克牌逻辑库
│   │
│   ├── pages/
│   └── App.tsx                   # 根组件（WagmiProvider 包裹）
│
├── docs/                         # 文档
│   ├── CHAINLINK_SETUP.md       # Chainlink 配置详细指南
│   ├── DEPLOYMENT_AND_TESTING.md # 部署与测试指南
│   └── QUICK_START.md           # 本文件
│
├── public/
│   └── NewLogo.png              # 项目 Logo
│
├── hardhat.config.cjs            # Hardhat 配置
├── .env.example                  # 环境变量模板
├── package.json
└── README.md
```

---

## 常见问题

### Q: `npm run dev` 启动失败？

```bash
# 删除缓存重新安装
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Q: 连接钱包后看不到 Sepolia 网络？

MetaMask 默认隐藏测试网：
1. MetaMask → Settings → Advanced → Show test networks → ON
2. 切换到 Sepolia Test Network

### Q: 买票时 MetaMask 不弹出来？

检查：
1. 合约是否已部署（`.env` 中地址不是 `0x000...`）
2. 钱包是否在 Sepolia 网络
3. 钱包是否有足够的 Sepolia ETH（≥ 0.01 ETH）

### Q: Hardhat 编译报错 "stack too deep"？

确认 `hardhat.config.cjs` 中启用了 `viaIR: true`：
```javascript
settings: {
  optimizer: { enabled: true, runs: 200 },
  viaIR: true,   // ← 必须启用
}
```

### Q: 部署失败 "insufficient funds"？

你的部署者钱包 Sepolia ETH 不足。去 https://sepoliafaucet.com/ 领取更多。

### Q: VRF 回调不执行？

1. 确认合约地址已添加为 VRF Consumer
2. 确认 VRF Subscription 有足够 LINK 余额
3. 在 https://vrf.chain.link 查看 Subscription 状态

---

## 联系方式

如有问题，请在 GitHub 仓库提交 Issue。
