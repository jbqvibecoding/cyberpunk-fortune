import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface DrawAnimationProps {
  winningNumbers: number[];
  winningPowerball: number;
  onComplete: () => void;
}

export function DrawAnimation({ winningNumbers, winningPowerball, onComplete }: DrawAnimationProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showPowerball, setShowPowerball] = useState(false);

  useEffect(() => {
    if (revealedCount < 5) {
      const timer = setTimeout(() => {
        setRevealedCount(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (!showPowerball) {
      const timer = setTimeout(() => {
        setShowPowerball(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, showPowerball, onComplete]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <span className="font-mono text-sm text-primary tracking-widest animate-pulse">
            CHAINLINK VRF GENERATING...
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-2 tracking-wider">
            DRAWING <span className="text-glow-cyan text-primary">NUMBERS</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          {winningNumbers.map((num, i) => (
            <div
              key={i}
              className={cn(
                'w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center font-display font-bold text-3xl md:text-4xl border-4 transition-all duration-500',
                i < revealedCount
                  ? 'bg-primary text-primary-foreground border-primary glow-cyan scale-100 opacity-100'
                  : 'bg-muted/30 border-border text-muted-foreground scale-75 opacity-50'
              )}
            >
              {i < revealedCount ? num : '?'}
            </div>
          ))}
          
          <div className="text-4xl text-muted-foreground font-display">+</div>
          
          <div
            className={cn(
              'w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center font-display font-bold text-3xl md:text-4xl border-4 transition-all duration-500',
              showPowerball
                ? 'bg-secondary text-secondary-foreground border-secondary glow-magenta scale-100 opacity-100'
                : 'bg-muted/30 border-border text-muted-foreground scale-75 opacity-50'
            )}
          >
            {showPowerball ? winningPowerball : '?'}
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                i < revealedCount ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
          <div
            className={cn(
              'w-3 h-3 rounded-full transition-all ml-2',
              showPowerball ? 'bg-secondary' : 'bg-muted'
            )}
          />
        </div>
      </div>
    </div>
  );
}
