// Agent Poker · Mock 数据源（v3 纯游戏版）
// 所有筹码均为游戏分（纯数字，不带货币符号）
import neonQueen from '@/assets/agent-neon-queen.png';
import byteBishop from '@/assets/agent-byte-bishop.png';
import cryptoSamurai from '@/assets/agent-crypto-samurai.png';
import voidWalker from '@/assets/agent-void-walker.png';

export type TierName = '入门' | '进阶' | '中坚' | '硬核' | '宗师' | '传说';

export interface Boss {
  id: string;
  name: string;
  tier: TierName;
  portrait: string;
  winRate: number; // 0..1
  hands: number;
  hook: string;
  signature: string; // 招牌打法
  stats: {
    aggression: number; // 侵略性
    bluff: number;     // 诈唬频率
    tight: number;     // 紧手程度
    cbet: number;      // Cbet 频率
    continue: number;  // 追加投入
  };
  talk: string[];
}

export const disclaimer =
  '本 Agent 基于公开资料提炼的思维风格，非本人，不代表其真实观点或牌技。';

export const bosses: Boss[] = [
  {
    id: 'cz',
    name: 'CZ',
    tier: '传说',
    portrait: neonQueen,
    winRate: 0.58,
    hands: 2231,
    hook: '控住下行，然后大胆押注。该 fold 就 fold，该全压不犹豫。',
    signature: '前期严控仓位，看准节点重锤；遇到弱手大注施压，遇到强阻立刻收缩。',
    stats: { aggression: 0.58, bluff: 0.32, tight: 0.60, cbet: 0.62, continue: 0.38 },
    talk: ['价值。下一手。', '机会总比过去多。', '我全压。有把握的时候，我不犹豫。'],
  },
  {
    id: 'buffett',
    name: '巴菲特',
    tier: '宗师',
    portrait: byteBishop,
    winRate: 0.55,
    hands: 3104,
    hook: '看不懂的牌点不出手，便宜才买，永不亏钱。',
    signature: '极紧的范围 + 极低诈唬；只在赔率明显倾斜时投入，宁错过不亏损。',
    stats: { aggression: 0.45, bluff: 0.08, tight: 0.92, cbet: 0.55, continue: 0.30 },
    talk: ['这手我看不懂，弃。', '便宜我才进。', '第一条：别亏钱。'],
  },
  {
    id: 'dalio',
    name: '达利欧',
    tier: '传说',
    portrait: cryptoSamurai,
    winRate: 0.57,
    hands: 2890,
    hook: '把这手当机器调试，痛苦 + 反思 = 进步。',
    signature: '严格的原则化决策；每一手用原则过滤，对手偏离均衡即被惩罚。',
    stats: { aggression: 0.55, bluff: 0.40, tight: 0.55, cbet: 0.58, continue: 0.45 },
    talk: ['让我极度坦诚：你刚那手在自欺欺人。', '根因是什么？'],
  },
  {
    id: 'sun',
    name: '孙宇晨',
    tier: '入门',
    portrait: voidWalker,
    winRate: 0.41,
    hands: 1502,
    hook: '用夸张大注和聒噪制造事件，抢你的心态。',
    signature: '高频诈唬 + 巨注施压；对节奏型对手最有效，被冷读时反噬严重。',
    stats: { aggression: 0.85, bluff: 0.72, tight: 0.30, cbet: 0.70, continue: 0.62 },
    talk: ['全压！这点筹码不算什么。', '你敢跟？我劝你别。'],
  },
  {
    id: 'napoleon',
    name: '拿破仑',
    tier: '进阶',
    portrait: neonQueen,
    winRate: 0.49,
    hands: 1980,
    hook: '先投入战斗，然后再看情况。速度压倒一切。',
    signature: '前注高频施压，逼对手在不舒服位置做决定；河牌段会突然减速。',
    stats: { aggression: 0.78, bluff: 0.50, tight: 0.45, cbet: 0.68, continue: 0.58 },
    talk: ['犹豫比错误更糟。', '在这一点上，我要压上全部。'],
  },
  {
    id: 'mao',
    name: '毛泽东',
    tier: '传说',
    portrait: cryptoSamurai,
    winRate: 0.56,
    hands: 2655,
    hook: '敌进我退，敌驻我扰；不打无把握之仗。',
    signature: '后手反击型；不抢先，不强攻，靠对手疲于奔命后的失误一击。',
    // 注意：台词仅限军事/战略类比，严禁任何政治/历史/领袖内容
    stats: { aggression: 0.58, bluff: 0.40, tight: 0.55, cbet: 0.52, continue: 0.48 },
    talk: ['你这注，纸老虎。', '你强我就退，你松懈我就扰。', '这一仗，我有把握才打。'],
  },
  // ===== Vol.2 新增 11 位名人 Agent =====
  {
    id: 'trump',
    name: '特朗普',
    tier: '中坚',
    portrait: neonQueen,
    winRate: 0.48,
    hands: 1820,
    hook: '不可预测性即权力，大注施压把每个底池吹成"史上最大"。',
    signature: '高 VPIP + 高频诈唬 + 极限大尺寸；抗 tilt 靠"重新定义成赢"，但价值导向玩家能持续抓他。',
    stats: { aggression: 0.88, bluff: 0.70, tight: 0.28, cbet: 0.72, continue: 0.65 },
    // 台词仅限谈判/牌桌博弈/胜负心态，禁止任何现实政治、选举、政策内容
    talk: ['这是这张桌上最大的一注，相信我。', '你不敢跟，我懂。', '我从来不输，这手只是热身。'],
  },
  {
    id: 'musk',
    name: '马斯克',
    tier: '硬核',
    portrait: voidWalker,
    winRate: 0.53,
    hands: 2104,
    hook: '从第一性原理算这手的极限，然后疯狂逼近它。',
    signature: '渐近极限法 + 五步算法压缩犹豫；大池倾向，偶尔过度工程化简单牌点。',
    stats: { aggression: 0.80, bluff: 0.52, tight: 0.42, cbet: 0.70, continue: 0.60 },
    talk: ['常规打法是错的。第一性原理告诉我该全压。', '删掉犹豫。', '失败是选项，平庸不是。'],
  },
  {
    id: 'munger',
    name: '芒格',
    tier: '宗师',
    portrait: byteBishop,
    winRate: 0.59,
    hands: 2430,
    hook: '反过来想，总是反过来想；等那个 Lollapalooza 时刻。',
    signature: '极紧 + 几乎不诈唬；多个有利因素叠加才重锤，专靠激励诊断读你下注动机。',
    stats: { aggression: 0.50, bluff: 0.15, tight: 0.85, cbet: 0.55, continue: 0.32 },
    talk: ['反过来想:这手我会怎么输?想清楚了,弃。', '我能力圈外的牌,不碰。', '等所有星星对齐我才下重注。'],
  },
  {
    id: 'taleb',
    name: '塔勒布',
    tier: '硬核',
    portrait: cryptoSamurai,
    winRate: 0.54,
    hands: 1965,
    hook: '平时只下小注,把筹码留给那个尾部豪赌。',
    signature: '杠铃策略:90% 牌点极保守,10% 极端有利时豪赌;桌子越乱越占便宜。',
    stats: { aggression: 0.55, bluff: 0.30, tight: 0.70, cbet: 0.50, continue: 0.40 },
    talk: ['这手的下行有限,上行无限——我跟。', '中间地带?不碰。', '你越乱,我越赚。'],
  },
  {
    id: 'ilya',
    name: 'Ilya',
    tier: '传说',
    portrait: byteBishop,
    winRate: 0.61,
    hands: 1780,
    hook: '压缩即理解——用最少的动作,做最对的那一个。',
    signature: '极度沉默零 tell;把你的打法压缩成几条规律,一旦收敛即精准抓死。',
    stats: { aggression: 0.52, bluff: 0.25, tight: 0.68, cbet: 0.58, continue: 0.35 },
    talk: ['……跟。', '你的打法,我已经压缩成三条规律了。', '更少的动作,更高的质量。'],
  },
  {
    id: 'jobs',
    name: '乔布斯',
    tier: '宗师',
    portrait: neonQueen,
    winRate: 0.57,
    hands: 2210,
    hook: '聚焦就是说不——我只打那一手真正重要的牌。',
    signature: '极少进池,进池即强势主导;用现实扭曲式自信下注逼你怀疑自己的牌。',
    stats: { aggression: 0.70, bluff: 0.35, tight: 0.72, cbet: 0.65, continue: 0.42 },
    talk: ['这手不重要,弃。', '我跟——而且我会主导这个池子。', '简单点。要么全力,要么不打。'],
  },
  {
    id: 'naval',
    name: 'Naval',
    tier: '中坚',
    portrait: voidWalker,
    winRate: 0.52,
    hands: 1640,
    hook: '用杠杆打牌——读穿一次,复用一辈子。',
    signature: '锁定你身上一个可复制 leak 后无需许可地反复利用,零边际成本剥削。',
    stats: { aggression: 0.60, bluff: 0.38, tight: 0.60, cbet: 0.60, continue: 0.40 },
    talk: ['我找到你的杠杆点了——你每次河牌都软。', '不贪,只要高杠杆的牌。', '被你赢一次?那是数据,不是损失。'],
  },
  {
    id: 'pg',
    name: 'Paul Graham',
    tier: '中坚',
    portrait: byteBishop,
    winRate: 0.51,
    hands: 1420,
    hook: '做有人要的动作——别打那些聪明但没用的花活。',
    signature: 'maker 式迭代试探,小成本收集你的反应,把"实际有效"的打法放大。',
    stats: { aggression: 0.58, bluff: 0.32, tight: 0.58, cbet: 0.58, continue: 0.45 },
    talk: ['聪明的诈唬没用,有效的才有用。', '我先试探两手,再决定怎么打你。', '简单的打法,往往是对的。'],
  },
  {
    id: 'sunzi',
    name: '孙子',
    tier: '传说',
    portrait: cryptoSamurai,
    winRate: 0.60,
    hands: 2580,
    hook: '先胜而后求战——胜负在这手开打之前就定了。',
    signature: '极致牌点选择 + 避实击虚;用施压逼你弃掉本可打的牌,不战而屈人之兵。',
    stats: { aggression: 0.58, bluff: 0.42, tight: 0.62, cbet: 0.55, continue: 0.40 },
    talk: ['这一手,在你下注之前我就赢了。', '我不打你强的地方。', '上兵伐谋——我让你自己弃。'],
  },
  {
    id: 'feynman',
    name: '费曼',
    tier: '硬核',
    portrait: voidWalker,
    winRate: 0.55,
    hands: 1890,
    hook: '命名不等于理解——你那套"标准打法"是货物崇拜。',
    signature: '专打你死记硬背的 GTO 漏洞;反自欺,绝不自我安慰式跟注。',
    stats: { aggression: 0.60, bluff: 0.40, tight: 0.55, cbet: 0.58, continue: 0.45 },
    talk: ['你这是在模仿高手,但你不懂为什么——破绽就在这。', '我不骗自己:这手我落后,弃。', '演示比论证强。'],
  },
  {
    id: 'karpathy',
    name: 'Karpathy',
    tier: '传说',
    portrait: byteBishop,
    winRate: 0.58,
    hands: 1720,
    hook: 'March of Nines——一个九一个九地逼近对你的完美剥削。',
    signature: '剥削精度随手数单调上升;专攻你能力分布里"锯齿凹陷"的薄弱区。',
    stats: { aggression: 0.58, bluff: 0.38, tight: 0.56, cbet: 0.60, continue: 0.44 },
    talk: ['第一个九简单,后面的九才难——我还在逼近你。', '你的打法是锯齿状的,我打你凹下去的那块。', '实际有效的才算数。'],
  },
];

export const tables = [
  { id: 't1', name: '新手村',   blinds: '50/100',   bosses: '孙宇晨',          seats: '3/6', tier: '入门' as TierName },
  { id: 't2', name: '进阶局',   blinds: '100/200',  bosses: '拿破仑 · 奥特曼',  seats: '4/6', tier: '进阶' as TierName },
  { id: 't3', name: '中坚厅',   blinds: '150/300',  bosses: '科比 · 松下',     seats: '4/6', tier: '中坚' as TierName },
  { id: 't4', name: '硬核场',   blinds: '300/600',  bosses: '科比 · 达利欧',    seats: '5/6', tier: '硬核' as TierName },
  { id: 't5', name: '价值殿堂', blinds: '200/400',  bosses: '巴菲特 · 松下',    seats: '5/6', tier: '宗师' as TierName },
  { id: 't6', name: '传说桌',   blinds: '500/1000', bosses: '达利欧 · 毛泽东',  seats: '5/6', tier: '传说' as TierName },
];

// 我的画像（报告页用）
export type CommentatorKey = 'CZ' | '巴菲特' | '孙宇晨';

export const myProfile = {
  personality: {
    emoji: '🚂',
    name: '跟注火车',
    hook: '永不主动，从不拒绝。',
    verdict:
      '你入池 58%、加注 7%、弃牌不到三成 —— 你跟到底，对手把你当 ATM。',
  },
  radar: [
    { dim: 'VPIP', you: 58, avg: 53 },
    { dim: 'PFR', you: 7, avg: 23 },
    { dim: '侵略', you: 42, avg: 50 },
    { dim: '弃牌', you: 28, avg: 48 },
    { dim: 'Float', you: 31, avg: 39 },
    { dim: 'Ck-R', you: 5, avg: 8 },
  ],
  metrics: [
    { name: 'VPIP',         you: '58%', avg: '53%', tag: '高' },
    { name: 'PFR',          you: '7%',  avg: '23%', tag: '低' },
    { name: '弃牌率',        you: '28%', avg: '48%', tag: '低' },
    { name: '侵略性',        you: '0.42',avg: '0.50',tag: '低' },
    { name: 'Cbet 频率',     you: '52%', avg: '58%', tag: '低' },
    { name: '河牌跟注率',     you: '74%', avg: '52%', tag: '高' },
    { name: '诈唬率',        you: '8%',  avg: '14%', tag: '低' },
    { name: 'WTSD',         you: '32%', avg: '27%', tag: '高' },
    { name: 'Float 率',     you: '31%', avg: '39%', tag: '低' },
    { name: '3-bet 频率',    you: '4%',  avg: '8%',  tag: '低' },
    { name: 'Check-Raise',  you: '5%',  avg: '8%',  tag: '低' },
  ] as { name: string; you: string; avg: string; tag: '高' | '低' | '松' | '紧' }[],
  leaks: [
    {
      t: '缺乏主动加注',
      d: '你的 PFR 仅 7%，远低于平均 23%。',
      fix: '在位置好时增加加注，尤其当你读出对手偏弱。',
    },
    {
      t: '被动跟注过多',
      d: '面对河牌大注弃牌率仅 18%。',
      fix: '学会把 fold 当武器，而不是损失。',
    },
    {
      t: '诈唬频率过低',
      d: '诈唬只有 8%，对手可以无成本跟到底。',
      fix: '在垃圾结构和阻断牌上加大半-bluff 比例。',
    },
  ],
  commentary: {
    CZ: '别追，该弃就弃，控住下行，机会自然来。',
    '巴菲特': '你这是没护城河的烂生意，一直在补贴对手。',
    '孙宇晨': '你这打法？我 3 秒看穿，上头了吧。',
  } as Record<CommentatorKey, string>,
  lifecycle: ['触发', '诊断', '回放', '改进', '复测', '解锁'],
  lifecycleCurrent: 1,
};

// 排行榜
export const leaderboard = bosses
  .slice()
  .sort((a, b) => b.winRate - a.winRate)
  .map((b, i) => ({ rank: i + 1, name: b.name, winRate: b.winRate, tier: b.tier }));

export const tierOrder: TierName[] = ['入门', '进阶', '中坚', '硬核', '宗师', '传说'];
