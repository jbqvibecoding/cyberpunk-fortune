import { useEffect, useState } from 'react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { useVerifiableDeal } from '@/hooks/useVerifiableDeal';
import { PokerTable } from '@/components/games/poker/PokerTable';
import { BettingControls } from '@/components/games/poker/BettingControls';
import { VerifiableDealOverlay } from '@/components/games/poker/VerifiableDealOverlay';
import { bosses } from '@/lib/mockData';
import type { AIAgent } from '@/lib/agents';
import { ShieldCheck, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
import FairnessModal from '@/components/modals/FairnessModal';
import { useAccount } from 'wagmi';

const BUY_IN_ETH = '0.001'; // SimplePoker minBuyIn

export default function TablePage() {
  const [bossId, setBossId] = useState(bosses[0].id);
  const [buyIn, setBuyIn] = useState(1500);
  const [fairOpen, setFairOpen] = useState(false);

  const { isConnected, chain } = useAccount();
  const deal = useVerifiableDeal();
  const onSepolia = chain?.id === 11155111;

  // Only pass dealSeed to the engine once the on-chain reveal completes.
  const { state, actions } = usePokerGame(buyIn, { dealSeed: deal.record.dealSeed });

  const boss = bosses.find(b => b.id === bossId)!;
  const agent: AIAgent = {
    id: boss.id, name: boss.name, tier: 'LEGENDARY', portrait: boss.portrait,
    winRate: boss.winRate * 100, hands: boss.hands, roi: 0, accent: 'magenta', skills: [],
  };

  // Auto-start the local hand engine once the on-chain seed lands
  useEffect(() => {
    if (deal.phase === 'ready' && state.phase === 'waiting') {
      actions.startGame();
    }
  }, [deal.phase, state.phase, actions]);

  // Whenever a new hand finishes, reset the verifiable record so next
  // hand requires a fresh on-chain deal.
  const handleNewHand = () => {
    actions.resetGame();
    deal.reset();
  };

  const talkLine = state.aiThinking || (state.lastAction && state.lastAction.player !== 'YOU')
    ? boss.talk[Math.floor(Math.random() * boss.talk.length)]
    : null;

  const showCards = deal.phase === 'ready';
  const needsWallet = !isConnected;
  const wrongChain = isConnected && !onSepolia;

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Toolbar */}
      <div className="cyber-card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">桌台</div>
          <div className="font-display tracking-wider text-secondary text-glow-cyan">价值殿堂</div>
        </div>
        <div className="text-muted-foreground">·</div>
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">盲注</div>
          <div className="font-mono text-sm">{state.smallBlind}/{state.bigBlind}</div>
        </div>
        <div className="text-muted-foreground hidden sm:block">·</div>
        <div className="hidden sm:block">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">Game ID</div>
          <div className="font-mono text-sm text-primary">
            {deal.record.gameId ? `#${deal.record.gameId.toString()}` : '—'}
          </div>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setFairOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-secondary/50 bg-secondary/10 text-secondary font-cn text-xs hover:glow-cyan transition-all"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {deal.phase === 'ready'
            ? '本局发牌已上链 · 可验证'
            : deal.phase === 'idle'
            ? '查看公平性流程'
            : '正在链上验证…'}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Pre-hand controls */}
      {state.phase === 'waiting' && deal.phase === 'idle' && (
        <div className="cyber-card p-4 mb-4 space-y-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
              选择对手 BOSS
            </div>
            <div className="flex flex-wrap gap-2">
              {bosses.map(b => (
                <button
                  key={b.id}
                  onClick={() => setBossId(b.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-cn text-xs transition-all ${
                    bossId === b.id
                      ? 'border-primary bg-primary/15 text-primary glow-purple'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <img src={b.portrait} alt="" className="w-6 h-6 rounded-md object-cover" />
                  {b.name}
                  <span className="text-[10px] text-muted-foreground">· {b.tier}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">买入筹码 (UI)</span>
              <span className="font-mono text-primary text-glow-purple">{buyIn}</span>
            </div>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={buyIn}
              onChange={e => setBuyIn(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-1">
              <span>MIN 500</span><span>MAX 5000</span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-cn text-sm tracking-wide">链上可验证发牌</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  Sepolia · SimplePoker · 买入 {BUY_IN_ETH} ETH · commit-reveal
                </div>
              </div>
              {deal.isAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/15 border border-secondary/40 text-secondary text-[10px] font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" /> READY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-[10px] font-mono">
                  <AlertTriangle className="h-3 w-3" />
                  {needsWallet ? '需要连接钱包' : wrongChain ? '请切换 Sepolia' : '合约未部署'}
                </span>
              )}
            </div>

            <button
              onClick={() => deal.startDeal(BUY_IN_ETH)}
              disabled={!deal.isAvailable}
              className="cyber-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              开始可验证发牌 · {BUY_IN_ETH} ETH
            </button>
            <p className="font-cn text-[11px] text-muted-foreground text-center">
              将依次执行 startGame → commitAction → revealAction，链上写入 resultHash 后渲染牌局
            </p>
          </div>
        </div>
      )}

      {/* Table area (gated until on-chain reveal completes) */}
      <div className="relative">
        {showCards || state.phase !== 'waiting' ? (
          <PokerTable state={state} agent={agent} />
        ) : (
          <div className="cyber-card-neon h-72 md:h-96 flex flex-col items-center justify-center text-center p-6">
            <ShieldCheck className="h-10 w-10 text-secondary mb-3 opacity-70" />
            <div className="font-cn text-base text-secondary text-glow-cyan mb-1">
              等待链上发牌
            </div>
            <p className="font-cn text-xs text-muted-foreground max-w-sm">
              所有牌将在 Sepolia 上完成 commit-reveal 之后再渲染，确保牌序从开局起不可篡改。
            </p>
          </div>
        )}
        <VerifiableDealOverlay
          phase={deal.phase}
          error={deal.error}
          onRetry={() => deal.reset()}
        />
      </div>

      {/* Boss talk bubble */}
      {talkLine && state.phase !== 'waiting' && (
        <div className="mt-3 mx-auto max-w-md cyber-card p-3 border-accent/40 animate-fade-in">
          <div className="flex items-start gap-3">
            <img src={boss.portrait} alt={boss.name} className="w-8 h-8 rounded-md object-cover" />
            <div className="text-sm font-cn text-accent italic">"{talkLine}"</div>
          </div>
        </div>
      )}

      {/* Controls (only after cards are on the table) */}
      {showCards && state.phase !== 'waiting' && (
        <div className="mt-6 cyber-card p-5">
          <BettingControls state={state} actions={actions} />
        </div>
      )}

      {/* On-chain result strip */}
      {deal.phase === 'ready' && deal.record.playerWonOnChain !== null && (
        <div className="mt-4 cyber-card p-3 flex items-center justify-between text-xs">
          <span className="font-cn text-muted-foreground">链上记账结果</span>
          <span className="font-mono">
            {deal.record.playerWonOnChain
              ? <span className="text-secondary">YOU WIN · {deal.record.handDescriptionOnChain}</span>
              : <span className="text-destructive">AI WIN · {deal.record.handDescriptionOnChain}</span>}
          </span>
        </div>
      )}

      {/* Next hand */}
      {state.phase === 'finished' && (
        <div className="mt-4 text-center">
          <button onClick={handleNewHand} className="cyber-btn-neon">
            再来一手 (重新链上发牌)
          </button>
        </div>
      )}

      <FairnessModal
        open={fairOpen}
        onOpenChange={setFairOpen}
        record={deal.record}
        phase={deal.phase}
      />
    </div>
  );
}
