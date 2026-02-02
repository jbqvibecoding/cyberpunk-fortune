import { DrawResult } from '@/hooks/usePowerball';
import { History, Calendar } from 'lucide-react';

interface DrawHistoryProps {
  history: DrawResult[];
}

export function DrawHistory({ history }: DrawHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg">DRAW HISTORY</h3>
      </div>

      <div className="space-y-3">
        {history.map((draw, i) => (
          <div
            key={draw.id}
            className="p-4 bg-muted/20 rounded-lg"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3 w-3" />
              <span>{draw.timestamp.toLocaleString()}</span>
              <span className="ml-auto font-mono">
                Jackpot: {draw.jackpot.toFixed(2)} ETH
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {draw.numbers.map((num, j) => (
                <div
                  key={j}
                  className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center font-mono text-sm text-primary"
                >
                  {num}
                </div>
              ))}
              <span className="text-muted-foreground">+</span>
              <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/50 flex items-center justify-center font-mono text-sm text-secondary">
                {draw.powerball}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
