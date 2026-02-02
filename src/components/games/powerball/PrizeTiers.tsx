import { Trophy, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrizeTier {
  numbers: number;
  powerball: boolean;
  multiplier: number;
  label: string;
}

interface PrizeTiersProps {
  tiers: PrizeTier[];
  currentJackpot: number;
}

export function PrizeTiers({ tiers, currentJackpot }: PrizeTiersProps) {
  return (
    <div className="cyber-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-accent" />
        <h3 className="font-display text-lg">PRIZE TIERS</h3>
      </div>

      <div className="space-y-2">
        {tiers.map((tier, i) => {
          const isJackpot = tier.numbers === 5 && tier.powerball;
          const prizeValue = isJackpot ? currentJackpot : 0.01 * tier.multiplier;
          
          return (
            <div
              key={i}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                isJackpot
                  ? 'bg-accent/10 border border-accent/30'
                  : 'bg-muted/20'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: tier.numbers }).map((_, j) => (
                    <div
                      key={j}
                      className="w-4 h-4 rounded-full bg-primary/80"
                    />
                  ))}
                  {tier.powerball && (
                    <div className="w-4 h-4 rounded-full bg-secondary ml-1" />
                  )}
                </div>
                <span className={cn(
                  'font-display text-sm',
                  isJackpot ? 'text-accent' : 'text-foreground'
                )}>
                  {tier.label}
                </span>
              </div>
              <span className={cn(
                'font-mono text-sm',
                isJackpot ? 'text-accent font-bold' : 'text-muted-foreground'
              )}>
                {isJackpot ? `${prizeValue.toFixed(2)} ETH` : `${prizeValue.toFixed(2)} ETH`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
