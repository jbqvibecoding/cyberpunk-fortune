import { History, Trophy, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HandRecord {
  id: string;
  winner: 'player' | 'ai';
  pot: number;
  handDescription: string | null;
  timestamp: Date;
}

interface HandHistoryProps {
  history: HandRecord[];
}

export function HandHistory({ history }: HandHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="cyber-card p-4 text-center">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No hands played yet</p>
      </div>
    );
  }

  const playerWins = history.filter(h => h.winner === 'player').length;
  const aiWins = history.filter(h => h.winner === 'ai').length;
  const totalPotWon = history
    .filter(h => h.winner === 'player')
    .reduce((sum, h) => sum + h.pot, 0);

  return (
    <div className="cyber-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-display text-sm">HAND HISTORY</h3>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-success/10 rounded p-2">
          <span className="block text-xs text-muted-foreground">WINS</span>
          <span className="font-mono text-success">{playerWins}</span>
        </div>
        <div className="bg-destructive/10 rounded p-2">
          <span className="block text-xs text-muted-foreground">LOSSES</span>
          <span className="font-mono text-destructive">{aiWins}</span>
        </div>
        <div className="bg-accent/10 rounded p-2">
          <span className="block text-xs text-muted-foreground">WON</span>
          <span className="font-mono text-accent">{totalPotWon}</span>
        </div>
      </div>

      {/* Recent hands */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {history.slice(0, 10).map((hand, i) => {
          const isWin = hand.winner === 'player';
          return (
            <div
              key={hand.id}
              className={cn(
                'flex items-center justify-between p-2 rounded text-sm',
                isWin ? 'bg-success/10' : 'bg-destructive/10'
              )}
            >
              <div className="flex items-center gap-2">
                {isWin ? (
                  <Trophy className="h-4 w-4 text-success" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">
                  {hand.handDescription || (isWin ? 'AI folded' : 'You folded')}
                </span>
              </div>
              <span
                className={cn(
                  'font-mono text-xs',
                  isWin ? 'text-success' : 'text-destructive'
                )}
              >
                {isWin ? '+' : '-'}{hand.pot}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
