# Agent Poker 重构计划

按照上传的 prompt 文档 + 设计系统图，对现有站点做一次完整重构。产品定位锁定 **v3 纯游戏版**：游戏筹码（非真钱）、名人 AI Agent 作为对手、链上只做"可验证发牌"、钱包可选（Solana）。

## 一、设计系统（全局）

- 配色锁定：紫 `#6C00FF`、青 `#00E5FF`、品红 `#FF2ED6`、金 `#FFD700`，背景 `#0A0F1C`，面板 `#1A2233`，边框 `#2B334D`，文字 `#E8ECF5` / 次 `#8A93A8`。全部以 HSL 写入 `index.css` 语义 token，并同步 `tailwind.config.ts`。
- 字体：Orbitron（英文/数字标题）、Noto Sans SC（中文标题）、Inter + Noto Sans SC（正文）。在 `index.html` 引入 Google Fonts，并在 Tailwind 中分别暴露 `font-display` / `font-cn` / `font-sans`。
- 视觉语言：玻璃面板 + 紫/青渐变描边 + 霓虹辉光 + 顶部紫色径向光晕 + 极淡科技网格背景；卡片 16px、按钮 10px。
- 组件库（基于 shadcn 扩展）：4 种按钮（Primary/Secondary/Ghost/Neon）× 4 态、输入/下拉/开关/复选/滑块/步进器、Badge（HOT/NEW/AI/可验证/传说）、4 种 Toast、Modal、环形+线性+步骤进度、Sidebar。

## 二、路由与脚手架

重构 `App.tsx` 与 `Index.tsx`，改为侧边栏布局 + react-router 多页：

```text
/lobby        大厅（默认）
/table        牌桌对局
/agents       名人 Agent 图鉴
/report       我的牌品人格报告
/leaderboard  排行榜（占位）
/history      历史（占位）
/settings     设置（占位）
```

左侧固定 Sidebar：大厅 / 开始 / 名人图鉴 / 我的牌品 / 排行榜 / 历史 / 设置；顶栏 Logo "Ai POKER"（Orbitron）+ 可选的"连接钱包（仅用于验证公平性）"Ghost 按钮。**移除 RainbowKit / wagmi 钱包余额展示与 MARKET/STAKING/DAO 入口。**

## 三、页面

1. **Lobby `/lobby`**：Hero（中文大标题 + Primary "立即开始"）+ 右栏名人聚光灯 + 顶级 Boss 榜 + 主区桌台 Tab（入门/进阶/中坚/硬核/宗师/传说）+ 桌台表格（桌台 / 盲注 / 在座 Boss / 玩家数 / 加入）。
2. **Table `/table`**：椭圆霓虹牌桌、5 个名人座位 + 你、公共牌 + 底池 + 筹码堆、动作栏（弃/跟/加 + 步进器 + 滑块 + 15s Time Bank 环形倒计时）、Agent 行动气泡台词、左下角"✅ 本局发牌已上链可验证"徽章。复用现有 `usePokerGame` 引擎，名字与头像替换为名人 Boss。
3. **Agents `/agents`**：按难度分组 Tab，名人牌风卡（头像+难度徽章+hook+胜率/手数+5 维进度条+免责声明+"挑战 XX"），点击展开"招牌打法"详细描述。
4. **Report `/report`**：人格大卡（emoji+名+判决）、recharts 6 维雷达图（你 vs 平均）、11 行指标对比表、2-3 张 leak 警告卡 + 改进建议、名人解说切换器（CZ/巴菲特/孙宇晨）、6 步成长循环条、底部分享卡。
5. **Leaderboard / History / Settings**：占位页面，沿用设计系统骨架。

## 四、Modal

- **公平性验证 Modal**：4 步步骤条（VRF 种子 → 洗牌承诺 → 加密发牌 → 揭示验证）+ 3 行 mock 哈希 + "在区块浏览器查看" Neon 按钮。
- **连接钱包 Modal**：Phantom / Solflare / Backpack 三选；副标题强调"钱包可选，仅用于验证发牌公平"。

## 五、Mock 数据

新建 `src/lib/mockData.ts`：导出 `bosses`（6 个名人，含 5 维 stats + talk[]）、`tables`、`myProfile`（人格 + 雷达 + 指标 + leak + 名人解说 + 成长循环）、`disclaimer`。所有筹码为纯数字，无货币符号。

## 六、清理 / 弃用

- 删除/隐藏：`HeroSection`、`GamesSection`、`AgentsSection`、`AdvancedFeatures`、`Footer`、`PokerGame` lobby 内嵌段、`ReferralSystem`、`ENSIntegration`、`MultiPlayerPoker`、`PokerRoom` 中关于 ETH/钱包/NFT/质押的描述。RainbowKit `ConnectButton` 替换为自定义 Ghost 钱包按钮（仅打开 Modal）。
- 当前 `src/assets/agent-*.png` 头像可复用为名人占位头像（重新命名/映射）。

## 七、技术细节

- 仍是 React 18 + Vite + Tailwind + shadcn + TypeScript。
- 新增依赖：`recharts`（雷达图，若未安装）。
- 牌局逻辑沿用 `src/lib/poker/`，只替换 UI 与人物数据；不动 Supabase / Cloud。
- 严格用语义 token（不写 `text-white` 这类裸色），所有辉光通过 box-shadow utility 实现。
- 中英混排：所有标题组件用 `<span class="font-display">英文/数字</span><span class="font-cn">中文</span>` 模式以避免方块。

## 八、交付顺序

1. 设计 token + 字体 + 全局组件 + Sidebar 布局 + 路由
2. Mock 数据
3. Lobby 页 → Agents 页 → Table 页（接现有 poker 引擎）→ Report 页 → 两个 Modal
4. 占位页 + 视觉打磨（呼吸辉光、网格背景、过渡动画）

完成后可继续接入真实可验证发牌后端。
