import { GameState } from '@/lib/poker/types';
import { PlayingCard } from './PlayingCard';
import { Cpu, User, Clock, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIAgent } from '@/lib/agents';

interface PokerTableProps {
  state: GameState;
  agent?: AIAgent;
}

const phaseNames: Record<string, string> = {
  'waiting': 'WAITING',
  'pre-flop': 'PRE-FLOP',
  'flop': 'FLOP',
  'turn': 'TURN',
  'river': 'RIVER',
  'showdown': 'SHOWDOWN',
  'finished': 'FINISHED',
};

export function PokerTable({ state, agent }: PokerTableProps) {
  const playerData = state.players.find(p => !p.isAI);
  const aiData = state.players.find(p => p.isAI);
  const isShowdown = state.phase === 'showdown' || state.phase === 'finished';
  const currentPlayer = state.players[state.currentPlayerIndex];
  const dealerPlayer = state.players.find(p => p.isDealer);
  const isDealerAI = dealerPlayer?.isAI;
  const aiActive = currentPlayer?.isAI && state.phase !== 'finished' && state.phase !== 'showdown';
  const youActive = currentPlayer && !currentPlayer.isAI && state.phase !== 'finished' && state.phase !== 'showdown';

  return (
    <div className="cyber-card-neon p-4 md:p-6 relative overflow-hidden">
      {/* Phase HUD */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-md px-3 py-1.5 border border-secondary/40">
        <Clock className="h-3.5 w-3.5 text-secondary" />
        <span className="font-mono text-xs tracking-widest text-secondary">{phaseNames[state.phase]}</span>
      </div>

      {/* AI commentary */}
      {state.aiCommentary && (
        <div className="absolute top-4 left-4 z-20 bg-accent/15 backdrop-blur-sm rounded-md px-3 py-2 max-w-[220px] border border-accent/40">
          <div className="flex items-start gap-2">
            <MessageCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <span className="text-xs text-accent italic">"{state.aiCommentary}"</span>
          </div>
        </div>
      )}

      {/* Felt */}
      <div className="poker-felt relative rounded-[80px] md:rounded-[120px] px-6 py-10 md:px-10 md:py-12 border border-primary/30 min-h-[420px]">
        {/* AI seat */}
        <div className="flex justify-center mb-6 relative z-10">
          <div className="text-center relative">
            {isDealerAI && <DealerChip className="-left-10 top-6" />}
            <div className="relative inline-block">
              <div className={cn(
                'relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 mx-auto transition-all',
                aiActive ? 'border-accent animate-glow-breathe' : 'border-accent/50'
              )}>
                {agent ? (
                  <img src={agent.portrait} alt={agent.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-accent/15 flex items-center justify-center">
                    <Cpu className="h-10 w-10 text-accent" />
                  </div>
                )}
                {aiActive && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 rounded-2xl border-2 border-accent animate-ripple" />
                  </div>
                )}
              </div>
              <div className="mt-2 font-display text-sm text-accent tracking-wider">
                {agent?.name ?? 'AI OPPONENT'}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
                CHIPS · <span className="text-accent">{aiData?.chips ?? 0}</span>
              </div>
            </div>

            {state.aiThinking && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            {aiData && aiData.currentBet > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/40 animate-chip-pop">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="font-mono text-xs text-accent">BET {aiData.currentBet}</span>
              </div>
            )}

            {/* AI Cards */}
            <div className="flex gap-2 justify-center mt-3">
              {aiData?.cards.map((card, i) => (
                <div key={i} className="animate-card-deal" style={{ animationDelay: `${i * 120}ms` }}>
                  <PlayingCard card={card} faceDown={!isShowdown} size="md" highlight={isShowdown && state.winner?.isAI} />
                </div>
              ))}
              {(!aiData?.cards.length) && state.phase !== 'waiting' && (
                <>
                  <PlayingCard faceDown size="md" />
                  <PlayingCard faceDown size="md" />
                </>
              )}
            </div>

            {aiData?.hasFolded && <span className="block mt-2 text-destructive text-xs font-display tracking-widest">FOLDED</span>}
            {aiData?.isAllIn && !aiData?.hasFolded && (
              <span className="block mt-2 text-accent text-xs font-display tracking-widest animate-neon-flicker">ALL-IN</span>
            )}
          </div>
        </div>

        {/* Community cards */}
        <div className="flex justify-center gap-2 md:gap-3 my-6 md:my-8 relative z-10">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={cn(
                'transition-all duration-300',
                state.communityCards[i] ? 'animate-card-deal' : 'opacity-30'
              )}
              style={state.communityCards[i] ? { animationDelay: `${i * 100}ms` } : undefined}
            >
              <PlayingCard card={state.communityCards[i]} faceDown={!state.communityCards[i]} size="md" />
            </div>
          ))}
        </div>

        {/* Pot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="flex flex-col items-center gap-1">
            <div className="chip chip-purple animate-pulse-glow">
              <span className="text-[10px] font-display">POT</span>
            </div>
            <span className="font-mono text-sm text-primary text-glow-purple">{state.pot}</span>
          </div>
        </div>

        {/* Player seat */}
        <div className="flex justify-center mt-8 relative z-10">
          <div className="text-center relative">
            {!isDealerAI && dealerPlayer && <DealerChip className="-left-10 top-1" />}

            <div className="flex gap-2 justify-center mb-3">
              {playerData?.cards.map((card, i) => (
                <div key={i} className="animate-card-deal" style={{ animationDelay: `${i * 120 + 240}ms` }}>
                  <PlayingCard card={card} size="md" highlight={state.phase === 'finished' && state.winner?.id === 'player'} />
                </div>
              ))}
              {(!playerData?.cards.length) && state.phase !== 'waiting' && (
                <>
                  <PlayingCard faceDown size="md" />
                  <PlayingCard faceDown size="md" />
                </>
              )}
            </div>

            {playerData && playerData.currentBet > 0 && (
              <div className="mb-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/15 border border-secondary/40 animate-chip-pop">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="font-mono text-xs text-secondary">BET {playerData.currentBet}</span>
              </div>
            )}

            <div className={cn(
              'relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 mx-auto transition-all bg-secondary/10 flex items-center justify-center',
              youActive ? 'border-secondary animate-glow-breathe' : 'border-secondary/50'
            )}>
              <User className="h-10 w-10 text-secondary" />
              {youActive && (
                <div className="absolute inset-0 rounded-2xl border-2 border-secondary animate-ripple pointer-events-none" />
              )}
            </div>
            <div className="mt-2 font-display text-sm text-secondary tracking-wider">YOU</div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
              CHIPS · <span className="text-secondary">{playerData?.chips ?? 0}</span>
            </div>

            {playerData?.hasFolded && <span className="block mt-2 text-destructive text-xs font-display tracking-widest">FOLDED</span>}
            {playerData?.isAllIn && !playerData?.hasFolded && (
              <span className="block mt-2 text-accent text-xs font-display tracking-widest animate-neon-flicker">ALL-IN</span>
            )}
          </div>
        </div>

        {/* Showdown overlay */}
        {state.phase === 'showdown' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="bg-background/85 backdrop-blur rounded-lg px-8 py-3 border-2 border-accent animate-glow-breathe">
              <span className="font-display text-2xl text-accent text-glow-magenta tracking-widest">SHOWDOWN</span>
            </div>
          </div>
        )}
      </div>

      {/* Last action */}
      {state.lastAction && (
        <div className="mt-4 text-center font-mono text-xs">
          <span className={state.lastAction.player === 'YOU' ? 'text-secondary' : 'text-accent'}>
            {state.lastAction.player}
          </span>
          <span className="text-muted-foreground"> → </span>
          <span className="uppercase text-foreground tracking-widest">
            {state.lastAction.action}{state.lastAction.amount ? ` ${state.lastAction.amount}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function DealerChip({ className }: { className?: string }) {
  return (
    <div className={cn('absolute z-10', className)}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(48,100%,60%)] to-[hsl(38,100%,45%)] border-2 border-[hsl(48,100%,80%)] flex items-center justify-center shadow-[0_0_14px_hsl(48,100%,55%,0.7)] animate-spin-slow">
        <span className="font-display text-[10px] font-bold text-background">D</span>
      </div>
    </div>
  );
}
