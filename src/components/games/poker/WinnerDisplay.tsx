import { useEffect, useState } from 'react';
import { Trophy, Sparkles, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Player, HandResult } from '@/lib/poker/types';

interface WinnerDisplayProps {
  winner: Player | null;
  pot: number;
  winningHand: HandResult | null;
  onContinue: () => void;
  isTie?: boolean;
  tiedPlayers?: Player[];
}

export function WinnerDisplay({ winner, pot, winningHand, onContinue, isTie, tiedPlayers }: WinnerDisplayProps) {
  const [showCelebration, setShowCelebration] = useState(true);
  const isPlayerWin = winner && !winner.isAI;
  const splitAmount = isTie && tiedPlayers ? Math.floor(pot / tiedPlayers.length) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Tie scenario
  if (isTie) {
    return (
      <div className="relative">
        <div
          className="p-6 rounded-lg border-2 text-center transition-all bg-accent/10 border-accent"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Equal className="h-8 w-8 text-accent" />
          </div>

          <h3 className="font-display text-2xl md:text-3xl font-bold mb-2 text-accent">
            IT'S A TIE!
          </h3>

          <div className="font-mono text-2xl text-muted-foreground mb-2">
            Pot split: {splitAmount} chips each
          </div>

          {winningHand && (
            <p className="text-muted-foreground mb-4">
              Both players: {winningHand.description}
            </p>
          )}

          <button
            onClick={onContinue}
            className="cyber-btn bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-2"
          >
            NEXT HAND
          </button>
        </div>
      </div>
    );
  }

  // No winner (shouldn't happen, but handle gracefully)
  if (!winner) {
    return (
      <div className="p-6 rounded-lg border-2 text-center bg-muted/10 border-muted">
        <h3 className="font-display text-2xl mb-4">Hand Complete</h3>
        <button
          onClick={onContinue}
          className="cyber-btn bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2"
        >
          NEXT HAND
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Celebration overlay */}
      {showCelebration && isPlayerWin && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(20)].map((_, i) => (
            <Sparkles
              key={i}
              className={cn(
                'absolute text-accent animate-ping',
              )}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.8 + Math.random() * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className={cn(
          'p-6 rounded-lg border-2 text-center transition-all',
          isPlayerWin
            ? 'bg-success/10 border-success glow-cyan'
            : 'bg-destructive/10 border-destructive'
        )}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy
            className={cn(
              'h-8 w-8',
              isPlayerWin ? 'text-accent' : 'text-muted-foreground'
            )}
          />
        </div>

        <h3
          className={cn(
            'font-display text-2xl md:text-3xl font-bold mb-2',
            isPlayerWin ? 'text-success' : 'text-destructive'
          )}
        >
          {isPlayerWin ? 'YOU WIN!' : 'AI WINS'}
        </h3>

        <div className="font-mono text-3xl text-accent mb-2">
          +{pot} chips
        </div>

        {winningHand && (
          <p className="text-muted-foreground mb-4">
            {winningHand.description}
          </p>
        )}

        {!winningHand && !isPlayerWin && (
          <p className="text-muted-foreground mb-4">
            You folded
          </p>
        )}

        {!winningHand && isPlayerWin && (
          <p className="text-muted-foreground mb-4">
            AI folded
          </p>
        )}

        <button
          onClick={onContinue}
          className={cn(
            'cyber-btn px-6 py-2',
            isPlayerWin
              ? 'bg-success text-success-foreground hover:bg-success/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          NEXT HAND
        </button>
      </div>
    </div>
  );
}
