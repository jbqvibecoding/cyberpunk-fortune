import { useState, useEffect } from 'react';
import { GameState, GameActions } from '@/lib/poker/types';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Hand, Check, Coins, Zap, Play } from 'lucide-react';

interface BettingControlsProps {
  state: GameState;
  actions: GameActions;
  className?: string;
}

export function BettingControls({ state, actions, className }: BettingControlsProps) {
  const [raiseAmount, setRaiseAmount] = useState(state.bigBlind * 2);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isPlayerTurn = currentPlayer && !currentPlayer.isAI;
  const callAmount = state.currentBet - (currentPlayer?.currentBet || 0);
  const canCheck = callAmount === 0;
  const minRaise = Math.max(state.bigBlind, state.currentBet + state.bigBlind);
  const maxRaise = currentPlayer?.chips || 0;

  useEffect(() => {
    setRaiseAmount(Math.min(maxRaise, Math.max(minRaise, state.bigBlind * 2)));
  }, [state.currentPlayerIndex, state.currentBet, minRaise, maxRaise, state.bigBlind]);

  if (state.phase === 'waiting') {
    return (
      <div className={cn('flex justify-center', className)}>
        <button onClick={actions.startGame} className="cyber-btn-primary text-base animate-glow-breathe">
          <Play className="h-4 w-4" /> START GAME
        </button>
      </div>
    );
  }

  if (!isPlayerTurn || state.aiThinking) {
    return (
      <div className={cn('flex justify-center items-center gap-3 py-6', className)}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-accent animate-ripple" />
          <span className="rounded-full h-2 w-2 bg-accent" />
        </span>
        <span className="font-display text-accent tracking-widest text-glow-magenta">AI THINKING...</span>
      </div>
    );
  }

  if (currentPlayer.hasFolded || currentPlayer.isAllIn) {
    return (
      <div className={cn('flex justify-center py-4 font-display tracking-widest text-muted-foreground', className)}>
        {currentPlayer.hasFolded ? 'FOLDED' : 'ALL-IN'}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Raise slider */}
      <div className="rounded-lg p-4 bg-primary/5 border border-primary/20">
        <div className="flex justify-between mb-2 font-mono text-xs">
          <span className="text-muted-foreground tracking-widest">RAISE AMOUNT</span>
          <span className="text-primary text-glow-purple font-bold">{raiseAmount}</span>
        </div>
        <Slider
          value={[raiseAmount]}
          onValueChange={([v]) => setRaiseAmount(v)}
          min={minRaise}
          max={maxRaise}
          step={state.bigBlind}
          className="mb-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>MIN {minRaise}</span>
          <span>MAX {maxRaise}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={actions.fold} className="cyber-btn bg-transparent border-2 border-destructive text-destructive hover:bg-destructive/10 hover:shadow-[0_0_18px_hsl(0,85%,60%,0.5)]">
          <Hand className="h-4 w-4" /> FOLD
        </button>

        {canCheck ? (
          <button onClick={actions.check} className="cyber-btn-ghost">
            <Check className="h-4 w-4" /> CHECK
          </button>
        ) : (
          <button onClick={actions.call} className="cyber-btn-neon">
            <Coins className="h-4 w-4" /> CALL {Math.min(callAmount, maxRaise)}
          </button>
        )}

        <button
          onClick={() => actions.raise(raiseAmount)}
          disabled={raiseAmount > maxRaise || maxRaise < minRaise}
          className="cyber-btn text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, hsl(311 100% 55%), hsl(267 100% 55%))', boxShadow: '0 0 18px hsl(311 100% 55% / 0.45)' }}
        >
          <Zap className="h-4 w-4" /> RAISE {raiseAmount}
        </button>

        <button
          onClick={actions.allIn}
          className="cyber-btn text-background animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, hsl(48 100% 55%), hsl(38 100% 45%))', boxShadow: 'var(--glow-yellow)' }}
        >
          ALL-IN {currentPlayer.chips}
        </button>
      </div>
    </div>
  );
}
