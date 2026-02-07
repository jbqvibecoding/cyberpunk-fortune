# Chainlink 服务配置指南

本文档详细说明如何在 Sepolia 测试网上配置 Pioneer 项目所需的三个 Chainlink 服务。

---

## 目录

1. [前置准备](#1-前置准备)
2. [Chainlink VRF V2 — 可验证随机数](#2-chainlink-vrf-v2--可验证随机数)
3. [Chainlink Automation — 自动化触发](#3-chainlink-automation--自动化触发)
4. [Chainlink Functions — AI 决策](#4-chainlink-functions--ai-决策)
5. [各合约的 Chainlink 服务需求汇总](#5-各合约的-chainlink-服务需求汇总)
6. [费用估算](#6-费用估算)
7. [常见问题排查](#7-常见问题排查)

---

## 1. 前置准备

### 1.1 获取 Sepolia ETH

- 水龙头: https://sepoliafaucet.com/ 或 https://www.alchemy.com/faucets/ethereum-sepolia
- 建议至少获取 **0.5 Sepolia ETH**

### 1.2 获取 Sepolia LINK

- 水龙头: https://faucets.chain.link/sepolia
- 每次可领取 **25 LINK**
- 建议至少获取 **50 LINK**（VRF + Functions + Automation 均需要 LINK）

### 1.3 关键地址（Sepolia 测试网）

| 服务 | 合约地址 |
|------|---------|
| VRF Coordinator V2 | `0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625` |
| VRF Key Hash (200 gwei) | `0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c` |
| LINK Token | `0x779877A7B0D9E8603169DdbD7836e478b4624789` |
| Functions Router | `0xb83E47C2bC239B3bf370bc41e1459A34b41238D0` |
| Automation Registry | 通过 https://automation.chain.link 自动管理 |

---

## 2. Chainlink VRF V2 — 可验证随机数

**用途：** CyberPowerball 抽奖、TexasHoldem 发牌、MultiplayerPokerTable 洗牌

### 2.1 创建 VRF Subscription

1. 打开 https://vrf.chain.link
2. 连接你的 **部署者钱包**（MetaMask）
3. 切换到 **Sepolia** 网络
4. 点击 **"Create Subscription"**
5. 确认交易，记录你的 **Subscription ID**（数字，例如 `12345`）

### 2.2 为 Subscription 充值 LINK

1. 在 VRF 管理页面点击你的 Subscription
2. 点击 **"Fund Subscription"**
3. 输入 **10 LINK**（够测试使用很久）
4. 确认交易

### 2.3 添加 Consumer 合约

部署合约后，需要把合约地址注册为 VRF Consumer：

1. 在 Subscription 详情页点击 **"Add Consumer"**
2. 粘贴 **CyberPowerball 合约地址**，确认交易
3. 再次点击 **"Add Consumer"**
4. 粘贴 **TexasHoldemAIDuel 合约地址**，确认交易

> ⚠️ **不添加 Consumer 的话，合约请求随机数会 revert！**

### 2.4 VRF 参数说明

| 参数 | CyberPowerball | TexasHoldemAIDuel |
|------|---------------|------------------|
| numWords | 6（5主球+1强力球） | 9（2玩家+2AI+5公共牌） |
| callbackGasLimit | 500,000 | 500,000 |
| requestConfirmations | 3 | 3 |
| keyHash | 200 gwei lane | 200 gwei lane |

---

## 3. Chainlink Automation — 自动化触发

**用途：** 自动触发 CyberPowerball 定时抽奖（无需人工干预）

### 3.1 工作原理

CyberPowerball 合约实现了 `AutomationCompatibleInterface`：

- `checkUpkeep()` — Chainlink 节点定期调用，检查是否到了抽奖时间
- `performUpkeep()` — 条件满足时自动执行，向 VRF 请求随机数，触发抽奖

### 3.2 注册 Upkeep

1. 打开 https://automation.chain.link
2. 连接部署者钱包，切换到 Sepolia
3. 点击 **"Register New Upkeep"**
4. 选择 **"Custom logic"**（自定义逻辑）
5. 填写信息：

| 字段 | 值 |
|------|-----|
| Target contract address | `<你的 CyberPowerball 合约地址>` |
| Upkeep name | `Pioneer Powerball Draw` |
| Gas limit | `750000`（需要覆盖 VRF 请求 + performUpkeep 逻辑） |
| Starting balance | `5 LINK` |
| Check data | `0x`（留空） |

6. 确认交易，完成注册

### 3.3 验证 Automation 工作

注册完成后，可以在 Automation 管理页面看到：

- **Status**: Active
- **Last performed**: 会在下一个抽奖时间到达后显示
- **Balance**: 你充入的 LINK 余额

如果 Upkeep 长时间不触发，检查：
- `checkUpkeep()` 返回的 `upkeepNeeded` 是否为 `true`
- 是否有玩家购买了彩票（totalTickets > 0）
- `nextDrawTime` 是否已经过了当前时间

### 3.4 手动触发测试

在测试时，你可以通过 Hardhat 控制台手动调用 `performUpkeep`：

```bash
npx hardhat console --network sepolia
```

```javascript
const powerball = await ethers.getContractAt("CyberPowerball", "<CONTRACT_ADDRESS>");
const [upkeepNeeded, performData] = await powerball.checkUpkeep("0x");
console.log("Upkeep needed:", upkeepNeeded);
if (upkeepNeeded) {
  const tx = await powerball.performUpkeep(performData);
  await tx.wait();
  console.log("Draw triggered!");
}
```

---

## 4. Chainlink Functions — AI 决策

**用途：** TexasHoldemAIDuel 中 AI 对手的决策引擎（调用外部 LLM API）

> ⚠️ **当前状态**：合约中 AI 决策目前使用**链上模拟**（`_simulateAIDecision`），
> Chainlink Functions 回调 `_fulfillRequest` 已预留但为 no-op。
> 若需连接真正的 LLM（如 OpenAI），需修改合约中 `_requestAIDecision` 函数的实现。

### 4.1 创建 Functions Subscription

1. 打开 https://functions.chain.link
2. 连接部署者钱包，切换到 Sepolia
3. 点击 **"Create Subscription"**
4. 确认交易，记录 **Subscription ID**

### 4.2 充值 LINK

1. 在 Subscription 详情页点击 **"Fund"**
2. 充入 **5 LINK**
3. 确认交易

### 4.3 添加 Consumer

1. 点击 **"Add Consumer"**
2. 粘贴 **TexasHoldemAIDuel 合约地址**
3. 确认交易

### 4.4 未来启用真实 LLM 的步骤

要让 AI 使用真实的 OpenAI API：

1. 修改 `_requestAIDecision()` 函数，改为调用 `_sendRequest()`
2. 在 `_fulfillRequest()` 中解析 LLM 返回的决策
3. 使用 Chainlink Functions 的 **Secrets Manager** 上传 OpenAI API Key
4. Functions 的 JavaScript 源码需要发起 HTTP 请求到 OpenAI

```javascript
// Functions 源码示例 (链下执行，返回结果上链)
const prompt = args[0]; // AI prompt from contract
const response = await Functions.makeHttpRequest({
  url: "https://api.openai.com/v1/chat/completions",
  method: "POST",
  headers: { "Authorization": `Bearer ${secrets.OPENAI_API_KEY}` },
  data: {
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50,
  },
});
return Functions.encodeString(response.data.choices[0].message.content);
```

---

## 5. 各合约的 Chainlink 服务需求汇总

| 合约 | VRF V2 | Automation | Functions |
|------|:------:|:----------:|:---------:|
| **CyberPowerball** | ✅ 6 words | ✅ 定时抽奖 | ❌ |
| **TexasHoldemAIDuel** | ✅ 9 words | ❌ | ✅ AI 决策 (预留) |
| **MultiplayerPokerTable** | ✅ 1 word | ❌ | ❌ |

### 完整配置清单

部署完成后，确保以下全部完成：

- [ ] VRF Subscription 已创建并充值 ≥ 10 LINK
- [ ] CyberPowerball 地址已添加为 VRF Consumer
- [ ] TexasHoldemAIDuel 地址已添加为 VRF Consumer
- [ ] Automation Upkeep 已注册（指向 CyberPowerball）并充值 ≥ 5 LINK
- [ ] Functions Subscription 已创建并充值 ≥ 5 LINK
- [ ] TexasHoldemAIDuel 地址已添加为 Functions Consumer
- [ ] `.env` 文件中已填入正确的合约地址

---

## 6. 费用估算

| 服务 | 每次调用费用 (LINK) | 测试频率 | 月估算 |
|------|:------------------:|---------|--------|
| VRF (Powerball, 6 words) | ~0.25 | 每天 1 次 | ~7.5 LINK |
| VRF (Poker, 9 words) | ~0.35 | 每局 1 次 | 取决于玩家 |
| Automation (performUpkeep) | ~0.1 | 每天 1 次 | ~3 LINK |
| Functions (AI 决策) | ~0.2 | 目前未启用 | 0 |

> 📌 Sepolia 测试网的 LINK 是免费的，所以费用仅供正式部署参考。

---

## 7. 常见问题排查

### VRF 请求没有回调

| 可能原因 | 解决方案 |
|---------|---------|
| 合约未添加为 Consumer | 在 vrf.chain.link 添加 |
| Subscription LINK 余额不足 | 充值更多 LINK |
| callbackGasLimit 不够 | 调用 `setVRFConfig()` 增大（仅 CyberPowerball 支持） |
| 网络拥堵 | 等待或提高 gas |

### Automation 不触发

| 可能原因 | 解决方案 |
|---------|---------|
| checkUpkeep 返回 false | 确认时间已过 + 有售出的票 |
| Upkeep LINK 余额不足 | 充值更多 LINK |
| Gas limit 太低 | 在 Automation 管理页调高 |
| 合约暂停 | 检查合约 `paused` 状态 |

### Functions 回调失败

| 可能原因 | 解决方案 |
|---------|---------|
| 当前为模拟模式 | 合约使用 `_simulateAIDecision`，Functions 未实际调用 |
| Consumer 未注册 | 在 functions.chain.link 添加 |
| 源码执行超时 | 精简 JS 源码或增大 gasLimit |
