import { useState } from 'react';
import { GameState, GameActions } from '@/lib/poker/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

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
  const minRaise = state.bigBlind;
  const maxRaise = currentPlayer?.chips || 0;

  if (state.phase === 'waiting') {
    return (
      <div className={cn('flex justify-center', className)}>
        <Button 
          onClick={actions.startGame}
          className="cyber-btn-primary text-lg px-8 py-6"
        >
          START GAME
        </Button>
      </div>
    );
  }

  if (state.phase === 'finished') {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <div className="text-center">
          {state.winner && (
            <div className="mb-4">
              <span className={cn(
                'font-display text-2xl',
                state.winner.isAI ? 'text-secondary' : 'text-primary'
              )}>
                {state.winner.name} wins {state.pot} chips!
              </span>
              {state.winningHand && (
                <p className="text-muted-foreground mt-2">
                  {state.winningHand.description}
                </p>
              )}
            </div>
          )}
        </div>
        <Button 
          onClick={actions.resetGame}
          className="cyber-btn-primary"
        >
          NEXT HAND
        </Button>
      </div>
    );
  }

  if (!isPlayerTurn || state.aiThinking) {
    return (
      <div className={cn('flex justify-center items-center gap-2', className)}>
        <div className="animate-pulse">
          <span className="font-display text-secondary">AI THINKING...</span>
        </div>
      </div>
    );
  }

  if (currentPlayer.hasFolded || currentPlayer.isAllIn) {
    return (
      <div className={cn('flex justify-center', className)}>
        <span className="text-muted-foreground">
          {currentPlayer.hasFolded ? 'FOLDED' : 'ALL-IN'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Raise slider */}
      <div className="bg-card/50 rounded-lg p-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">Raise Amount</span>
          <span className="font-mono text-primary">{raiseAmount}</span>
        </div>
        <Slider
          value={[raiseAmount]}
          onValueChange={([value]) => setRaiseAmount(value)}
          min={minRaise}
          max={maxRaise}
          step={state.bigBlind}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{minRaise}</span>
          <span>{maxRaise}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          onClick={actions.fold}
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          FOLD
        </Button>
        
        {canCheck ? (
          <Button
            variant="outline"
            onClick={actions.check}
            className="border-muted-foreground"
          >
            CHECK
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={actions.call}
            className="border-primary text-primary"
          >
            CALL {callAmount}
          </Button>
        )}
        
        <Button
          onClick={() => actions.raise(raiseAmount)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={raiseAmount > maxRaise}
        >
          RAISE {raiseAmount}
        </Button>
        
        <Button
          onClick={actions.allIn}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        >
          ALL-IN {currentPlayer.chips}
        </Button>
      </div>
    </div>
  );
}
