import { useState, useEffect } from 'react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { useAccount } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { PokerTable } from './poker/PokerTable';
import { BettingControls } from './poker/BettingControls';
import { WinnerDisplay } from './poker/WinnerDisplay';
import { HandHistory, HandRecord } from './poker/HandHistory';
import { MatchStats } from './poker/MatchStats';
import { ArrowLeft, RotateCcw, Cpu, Shield, Clock, Zap, Coins, Trophy, Flame } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { AGENTS, type AIAgent } from '@/lib/agents';

const stakes = [
  { min: 100, max: 500, label: 'MICRO', accent: 'text-secondary', border: 'border-secondary', glow: 'glow-cyan', blinds: '5/10' },
  { min: 500, max: 2000, label: 'LOW', accent: 'text-primary', border: 'border-primary', glow: 'glow-purple', blinds: '10/20' },
  { min: 2000, max: 10000, label: 'HIGH', accent: 'text-accent', border: 'border-accent', glow: 'glow-magenta', blinds: '25/50' },
];

type GameView = 'lobby' | 'table';

export default function PokerGame() {
  const [view, setView] = useState<GameView>('lobby');
  const [selectedStake, setSelectedStake] = useState(0);
  const [buyIn, setBuyIn] = useState(500);
  const [initialBuyIn, setInitialBuyIn] = useState(500);
  const [handHistory, setHandHistory] = useState<HandRecord[]>([]);
  const [agent, setAgent] = useState<AIAgent>(AGENTS[0]);

  const { state, actions } = usePokerGame(buyIn);
  const { isConnected } = useAccount();
  const isOnChain = isConnected && CONTRACTS.SimplePoker !== '0x0000000000000000000000000000000000000000';

  useEffect(() => {
    if (state.phase === 'finished' && state.winner) {
      const rec: HandRecord = {
        id: `hand-${Date.now()}`,
        winner: state.winner.isAI ? 'ai' : 'player',
        pot: state.pot,
        handDescription: state.winningHand?.description || null,
        timestamp: new Date(),
      };
      setHandHistory(prev => [rec, ...prev]);
    }
  }, [state.phase, state.winner, state.pot, state.winningHand]);

  const enterGame = () => { setView('table'); setInitialBuyIn(buyIn); setHandHistory([]); };
  const backToLobby = () => { setView('lobby'); actions.resetGame(); setHandHistory([]); };
  const nextHand = () => actions.resetGame();
  const newMatch = () => { actions.resetGame(); setHandHistory([]); };

  if (view === 'table') {
    const playerData = state.players.find(p => !p.isAI);
    const aiData = state.players.find(p => p.isAI);
    const isGameOver = (playerData?.chips || 0) === 0 || (aiData?.chips || 0) === 0;

    return (
      <section id="poker" className="py-20 relative">
        <div className="container mx-auto px-4">
          {/* Header bar */}
          <div className="cyber-card-neon flex flex-wrap items-center justify-between gap-3 px-5 py-3 mb-6">
            <button onClick={backToLobby} className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors font-display text-sm tracking-widest">
              <ArrowLeft className="h-4 w-4" /> LOBBY
            </button>
            <div className="text-center">
              <div className="font-display text-base md:text-lg tracking-widest">
                <span className="text-secondary text-glow-cyan">{agent.name}</span>
                <span className="text-muted-foreground mx-2">VS</span>
                <span className="text-accent text-glow-magenta">YOU</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-widest">BLINDS {state.smallBlind}/{state.bigBlind} · POT {state.pot}</div>
            </div>
            <button onClick={newMatch} className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors font-display text-sm tracking-widest">
              <RotateCcw className="h-4 w-4" /> NEW MATCH
            </button>
          </div>

          <div className="max-w-5xl mx-auto mb-6">
            <MatchStats
              playerChips={playerData?.chips || 0}
              aiChips={aiData?.chips || 0}
              initialChips={initialBuyIn}
              handsPlayed={handHistory.length}
            />
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <PokerTable state={state} agent={agent} />

              <div className="cyber-card p-6">
                {state.phase === 'finished' ? (
                  <WinnerDisplay
                    winner={state.winner}
                    pot={state.pot}
                    winningHand={state.winningHand}
                    onContinue={nextHand}
                    isTie={state.isTie}
                    tiedPlayers={state.tiedPlayers}
                  />
                ) : state.phase === 'showdown' ? (
                  <div className="text-center py-8">
                    <span className="font-display text-xl text-accent text-glow-magenta animate-neon-flicker tracking-widest">REVEALING CARDS</span>
                  </div>
                ) : (
                  <BettingControls state={state} actions={actions} />
                )}
              </div>

              {isGameOver && state.phase === 'waiting' && (
                <div className="cyber-card-neon p-6 text-center">
                  <h3 className="font-display text-2xl mb-3 tracking-widest">
                    {(playerData?.chips || 0) === 0 ? (
                      <span className="text-destructive">MATCH OVER — {agent.name} WINS</span>
                    ) : (
                      <span className="text-secondary text-glow-cyan">YOU TAKE THE MATCH</span>
                    )}
                  </h3>
                  <p className="text-muted-foreground mb-4 font-mono text-xs tracking-widest">HANDS PLAYED · {handHistory.length}</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={newMatch} className="cyber-btn-primary"><RotateCcw className="h-4 w-4" /> NEW MATCH</button>
                    <button onClick={backToLobby} className="cyber-btn-ghost">BACK TO LOBBY</button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Agent card */}
              <div className="cyber-card overflow-hidden border border-accent/40">
                <div className="relative aspect-square">
                  <img src={agent.portrait} alt={agent.name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/70 to-transparent p-3">
                    <div className="font-display text-sm text-accent text-glow-magenta tracking-widest">{agent.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground tracking-widest">{agent.tier}</div>
                  </div>
                </div>
                <div className="p-3 space-y-1 border-t border-border/40">
                  {agent.skills.map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono w-16 text-muted-foreground">{s.label}</span>
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-purple-gradient" style={{ width: `${s.value}%` }} />
                      </div>
                      <span className="text-[10px] font-mono w-6 text-right">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <HandHistory history={handHistory} />

              {state.lastAction && (
                <div className="cyber-card p-3">
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">LAST ACTION</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">{state.lastAction.player}</span>
                    <span className="font-mono text-xs text-primary uppercase">
                      {state.lastAction.action}{state.lastAction.amount ? ` ${state.lastAction.amount}` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============ LOBBY ============
  return (
    <section id="poker" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="font-mono text-xs text-accent tracking-[0.4em]">07 / POKER TABLE — GAMEPLAY</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 tracking-wider">
            CHALLENGE AN <span className="text-glow-magenta text-accent">AI AGENT</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Heads-up Texas Hold'em with verifiable VRF dealing and on-chain settlement.
          </p>
          <div className="mt-4 flex justify-center">
            {isOnChain ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/40 text-secondary text-xs font-mono tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" /> ON-CHAIN · SEPOLIA
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-xs font-mono tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> SIMULATION MODE
              </span>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-6">
          {/* Agent picker */}
          <div className="lg:col-span-2 cyber-card-neon p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg tracking-widest">PICK OPPONENT</h3>
              <Flame className="h-4 w-4 text-accent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {AGENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAgent(a)}
                  className={cn(
                    'relative rounded-lg overflow-hidden border-2 transition-all text-left group',
                    agent.id === a.id
                      ? 'border-accent shadow-[0_0_20px_hsl(311,100%,60%,0.4)]'
                      : 'border-border hover:border-primary/60'
                  )}
                >
                  <div className="aspect-square">
                    <img src={a.portrait} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-2">
                    <div className={cn('font-display text-[11px] tracking-widest', agent.id === a.id ? 'text-accent text-glow-magenta' : 'text-foreground')}>{a.name}</div>
                    <div className="font-mono text-[9px] text-muted-foreground">WIN {a.winRate}%</div>
                  </div>
                  {agent.id === a.id && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stake / buy-in */}
          <div className="lg:col-span-3 cyber-card-neon p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg tracking-widest">SELECT STAKES</h3>
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {stakes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedStake(i); setBuyIn(s.min); }}
                    className={cn(
                      'relative rounded-lg p-4 border-2 transition-all text-left',
                      selectedStake === i ? `${s.border} ${s.glow} bg-primary/5` : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className={cn('font-display text-base font-bold tracking-widest', s.accent)}>{s.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-1">{s.min}–{s.max}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">Blinds {s.blinds}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2 font-mono text-xs">
                <span className="text-muted-foreground tracking-widest">BUY-IN</span>
                <span className="text-primary text-glow-purple font-bold">{buyIn} CHIPS</span>
              </div>
              <Slider value={[buyIn]} onValueChange={([v]) => setBuyIn(v)} min={stakes[selectedStake].min} max={stakes[selectedStake].max} step={100} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { Icon: Shield, label: 'PROVABLY FAIR', sub: 'Chainlink VRF', color: 'text-secondary' },
                { Icon: Cpu, label: 'LLM AGENTS', sub: 'Onchain Strategy', color: 'text-accent' },
                { Icon: Clock, label: '<10s TURNS', sub: 'Fast Decisions', color: 'text-primary' },
              ].map(({ Icon, label, sub, color }) => (
                <div key={label} className="cyber-card p-3">
                  <Icon className={cn('h-4 w-4 mb-1', color)} />
                  <div className="font-display text-[11px] tracking-widest">{label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{sub}</div>
                </div>
              ))}
            </div>

            <button onClick={enterGame} className="w-full cyber-btn-primary text-base animate-glow-breathe">
              <Zap className="h-4 w-4" /> ENTER TABLE · {buyIn} CHIPS
              <Coins className="h-4 w-4" />
            </button>
            <p className="text-[10px] text-center text-muted-foreground font-mono tracking-widest">
              ALL HANDS RECORDED ON-CHAIN · NO HOUSE EDGE
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
