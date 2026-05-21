import { useState } from 'react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { PokerTable } from '@/components/games/poker/PokerTable';
import { BettingControls } from '@/components/games/poker/BettingControls';
import { bosses } from '@/lib/mockData';
import type { AIAgent } from '@/lib/agents';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import FairnessModal from '@/components/modals/FairnessModal';

export default function TablePage() {
  const [bossId, setBossId] = useState(bosses[0].id);
  const [buyIn, setBuyIn] = useState(1500);
  const [fairOpen, setFairOpen] = useState(false);
  const { state, actions } = usePokerGame(buyIn);

  const boss = bosses.find(b => b.id === bossId)!;
  // Adapt Boss -> AIAgent shape for PokerTable's avatar/name
  const agent: AIAgent = {
    id: boss.id,
    name: boss.name,
    tier: 'LEGENDARY',
    portrait: boss.portrait,
    winRate: boss.winRate * 100,
    hands: boss.hands,
    roi: 0,
    accent: 'magenta',
    skills: [],
  };

  // Rotating talk line
  const talkLine = state.aiThinking || (state.lastAction && state.lastAction.player !== 'YOU')
    ? boss.talk[Math.floor(Math.random() * boss.talk.length)]
    : null;

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
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">Hand ID</div>
          <div className="font-mono text-sm text-primary">#231231</div>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setFairOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-secondary/50 bg-secondary/10 text-secondary font-cn text-xs hover:glow-cyan transition-all"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          本局发牌已上链可验证
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Boss selector + buy-in (waiting only) */}
      {state.phase === 'waiting' && (
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
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">买入筹码</span>
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
        </div>
      )}

      {/* Table */}
      <PokerTable state={state} agent={agent} />

      {/* Boss talk bubble */}
      {talkLine && state.phase !== 'waiting' && (
        <div className="mt-3 mx-auto max-w-md cyber-card p-3 border-accent/40 animate-fade-in">
          <div className="flex items-start gap-3">
            <img src={boss.portrait} alt={boss.name} className="w-8 h-8 rounded-md object-cover" />
            <div className="text-sm font-cn text-accent italic">"{talkLine}"</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-6 cyber-card p-5">
        <BettingControls state={state} actions={actions} />
      </div>

      {/* Reset */}
      {state.phase === 'finished' && (
        <div className="mt-4 text-center">
          <button onClick={actions.resetGame} className="cyber-btn-neon">
            再来一手
          </button>
        </div>
      )}

      <FairnessModal open={fairOpen} onOpenChange={setFairOpen} />
    </div>
  );
}
