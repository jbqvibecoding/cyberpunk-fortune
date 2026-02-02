import { useEffect, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Player, HandResult } from '@/lib/poker/types';

interface WinnerDisplayProps {
  winner: Player;
  pot: number;
  winningHand: HandResult | null;
  onContinue: () => void;
}

export function WinnerDisplay({ winner, pot, winningHand, onContinue }: WinnerDisplayProps) {
  const [showCelebration, setShowCelebration] = useState(true);
  const isPlayerWin = !winner.isAI;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
                `top-[${Math.random() * 100}%]`,
                `left-[${Math.random() * 100}%]`
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
