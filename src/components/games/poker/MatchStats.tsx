import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchStatsProps {
  playerChips: number;
  aiChips: number;
  initialChips: number;
  handsPlayed: number;
}

export function MatchStats({ playerChips, aiChips, initialChips, handsPlayed }: MatchStatsProps) {
  const playerProfit = playerChips - initialChips;
  const winRate = handsPlayed > 0 
    ? Math.round((playerProfit > 0 ? 1 : 0) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="cyber-card p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">HANDS</span>
        </div>
        <span className="font-mono text-lg text-primary">{handsPlayed}</span>
      </div>

      <div className="cyber-card p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          {playerProfit >= 0 ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          <span className="text-xs text-muted-foreground">PROFIT</span>
        </div>
        <span
          className={cn(
            'font-mono text-lg',
            playerProfit >= 0 ? 'text-success' : 'text-destructive'
          )}
        >
          {playerProfit >= 0 ? '+' : ''}{playerProfit}
        </span>
      </div>

      <div className="cyber-card p-3 text-center">
        <span className="text-xs text-muted-foreground block mb-1">YOUR STACK</span>
        <span className="font-mono text-lg text-primary">{playerChips}</span>
      </div>

      <div className="cyber-card p-3 text-center">
        <span className="text-xs text-muted-foreground block mb-1">AI STACK</span>
        <span className="font-mono text-lg text-secondary">{aiChips}</span>
      </div>
    </div>
  );
}
