import { PowerballTicket } from '@/hooks/usePowerball';
import { Ticket, Trophy, X, Repeat, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketHistoryProps {
  tickets: PowerballTicket[];
  lastDrawNumbers?: number[];
  lastDrawPowerball?: number;
}

export function TicketHistory({ tickets, lastDrawNumbers = [], lastDrawPowerball }: TicketHistoryProps) {
  if (tickets.length === 0) {
    return (
      <div className="cyber-card p-6 text-center">
        <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No tickets purchased yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Select your numbers above and buy a ticket!
        </p>
      </div>
    );
  }

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg">YOUR TICKETS</h3>
        <span className="ml-auto font-mono text-sm text-muted-foreground">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {tickets.map(ticket => {
          const hasResults = lastDrawNumbers.length > 0;
          const isWinner = ticket.prize > 0;
          
          return (
            <div
              key={ticket.id}
              className={cn(
                'p-4 rounded-lg border transition-all',
                isWinner
                  ? 'bg-success/10 border-success/50'
                  : hasResults
                  ? 'bg-muted/20 border-border/50'
                  : 'bg-card/50 border-border/30'
              )}
            >
              {/* Play mode badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {ticket.playMode === 'double-play' && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                      <Repeat className="h-3 w-3" />
                      DOUBLE R{ticket.drawRound}
                    </span>
                  )}
                  {ticket.playMode === 'no-loss' && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">
                      <ShieldCheck className="h-3 w-3" />
                      NOLOSS
                    </span>
                  )}
                </div>
                {ticket.playMode === 'no-loss' && ticket.principalRedeemable && (
                  <span className="text-[10px] font-mono text-accent">REDEEMABLE</span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {ticket.numbers.map((num, i) => {
                  const isMatch = lastDrawNumbers.includes(num);
                  return (
                    <div
                      key={i}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border',
                        isMatch
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 border-border text-foreground'
                      )}
                    >
                      {num}
                    </div>
                  );
                })}
                <span className="text-muted-foreground">+</span>
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border',
                    ticket.powerball === lastDrawPowerball
                      ? 'bg-secondary text-secondary-foreground border-secondary'
                      : 'bg-muted/50 border-border text-foreground'
                  )}
                >
                  {ticket.powerball}
                </div>
              </div>

              {hasResults && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    {isWinner ? (
                      <>
                        <Trophy className="h-4 w-4 text-accent" />
                        <span className="text-accent font-semibold">
                          {ticket.matchedNumbers} match{ticket.matchedNumbers !== 1 ? 'es' : ''}
                          {ticket.matchedPowerball && ' + PB'}
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">No match</span>
                      </>
                    )}
                  </div>
                  {isWinner && (
                    <span className="font-mono text-success font-bold">
                      +{ticket.prize.toFixed(2)} ETH
                    </span>
                  )}
                </div>
              )}

              {!hasResults && (
                <div className="text-xs text-muted-foreground">
                  Waiting for next draw...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
