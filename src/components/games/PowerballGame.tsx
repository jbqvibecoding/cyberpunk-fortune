import { useState } from 'react';
import { Ticket, RefreshCw, Zap, Clock, Trophy, Play, Sparkles } from 'lucide-react';
import { usePowerball } from '@/hooks/usePowerball';
import { DrawAnimation } from './powerball/DrawAnimation';
import { TicketHistory } from './powerball/TicketHistory';
import { PrizeTiers } from './powerball/PrizeTiers';
import { DrawHistory } from './powerball/DrawHistory';
import { cn } from '@/lib/utils';

const PowerballGame = () => {
  const { state, actions, isComplete, prizeTiers } = usePowerball();
  const [showDrawAnimation, setShowDrawAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'play' | 'tickets' | 'prizes' | 'history'>('play');

  const formatTime = (n: number) => n.toString().padStart(2, '0');

  const handleDraw = () => {
    setShowDrawAnimation(true);
    actions.simulateDraw();
  };

  const handleDrawComplete = () => {
    setShowDrawAnimation(false);
  };

  return (
    <section id="powerball" className="py-24 relative">
      {/* Draw Animation Overlay */}
      {showDrawAnimation && state.lastDraw && (
        <DrawAnimation
          winningNumbers={state.lastDraw.numbers}
          winningPowerball={state.lastDraw.powerball}
          onComplete={handleDrawComplete}
        />
      )}

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="font-mono text-sm text-primary tracking-widest">GAME MODE 1</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 tracking-wider">
            CYBER-<span className="text-glow-cyan text-primary">POWERBALL</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Select 5 numbers (1-69) and 1 Powerball (1-26). All draws are verified on-chain using Chainlink VRF.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Jackpot Display */}
          <div className="cyber-card p-6 mb-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5" />
            <div className="relative">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="h-8 w-8 text-accent" />
                <span className="font-display text-lg text-muted-foreground">CURRENT JACKPOT</span>
              </div>
              <div className="font-display text-5xl md:text-6xl font-black text-glow-yellow text-accent">
                {state.currentJackpot.toFixed(2)} ETH
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    Next draw:{' '}
                    <span className="text-primary font-mono">
                      {formatTime(state.countdown.hours)}:{formatTime(state.countdown.minutes)}:{formatTime(state.countdown.seconds)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-secondary" />
                  <span>
                    Tickets sold: <span className="text-secondary font-mono">{state.totalTicketsSold.toLocaleString()}</span>
                  </span>
                </div>
              </div>

              {/* Demo Draw Button */}
              <button
                onClick={handleDraw}
                disabled={state.isDrawing}
                className="mt-4 cyber-btn bg-accent/20 text-accent border border-accent/50 hover:bg-accent/30 flex items-center gap-2 mx-auto"
              >
                <Play className="h-4 w-4" />
                {state.isDrawing ? 'DRAWING...' : 'SIMULATE DRAW (DEMO)'}
              </button>
            </div>
          </div>

          {/* Last Draw Results */}
          {state.lastDraw && (
            <div className="cyber-card p-6 mb-8 border-success/30">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-success" />
                <h3 className="font-display text-lg">LAST DRAW RESULTS</h3>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {state.lastDraw.numbers.map((num, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xl border-2 border-primary glow-cyan"
                  >
                    {num}
                  </div>
                ))}
                <div className="text-2xl text-muted-foreground font-display">+</div>
                <div className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-display font-bold text-xl border-2 border-secondary glow-magenta">
                  {state.lastDraw.powerball}
                </div>
              </div>
              
              {/* Show winnings summary */}
              {state.tickets.some(t => t.prize > 0) && (
                <div className="mt-4 text-center">
                  <span className="text-success font-display text-lg">
                    🎉 YOU WON {state.tickets.reduce((sum, t) => sum + t.prize, 0).toFixed(2)} ETH! 🎉
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'play', label: 'PLAY', icon: Zap },
              { id: 'tickets', label: 'MY TICKETS', icon: Ticket },
              { id: 'prizes', label: 'PRIZES', icon: Trophy },
              { id: 'history', label: 'HISTORY', icon: Clock },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'cyber-btn flex items-center gap-2 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'tickets' && state.tickets.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                    {state.tickets.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'play' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Number Selection Grid */}
                <div className="cyber-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-xl font-semibold">
                      SELECT 5 NUMBERS <span className="text-primary">(1-69)</span>
                    </h3>
                    <span className="font-mono text-primary">{state.selectedNumbers.length}/5</span>
                  </div>

                  <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-10 lg:grid-cols-12 gap-2 mb-8">
                    {Array.from({ length: 69 }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        onClick={() => actions.toggleNumber(num)}
                        className={cn(
                          'number-ball text-sm',
                          state.selectedNumbers.includes(num) && 'selected'
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Powerball Selection */}
                  <div className="border-t border-border/50 pt-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display text-xl font-semibold">
                        SELECT POWERBALL <span className="text-secondary">(1-26)</span>
                      </h3>
                      <span className="font-mono text-secondary">{state.powerball ? '1/1' : '0/1'}</span>
                    </div>

                    <div className="grid grid-cols-9 sm:grid-cols-13 gap-2">
                      {Array.from({ length: 26 }, (_, i) => i + 1).map(num => (
                        <button
                          key={`pb-${num}`}
                          onClick={() => actions.togglePowerball(num)}
                          className={cn(
                            'number-ball powerball text-sm',
                            state.powerball === num && 'selected'
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selection Display */}
                <div className="cyber-card p-6">
                  <h3 className="font-display text-lg mb-4">YOUR SELECTION</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={cn(
                          'w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-xl border-2',
                          state.selectedNumbers[i]
                            ? 'bg-primary text-primary-foreground border-primary glow-cyan'
                            : 'bg-muted/30 border-border text-muted-foreground'
                        )}
                      >
                        {state.selectedNumbers[i] || '?'}
                      </div>
                    ))}
                    <div className="text-2xl text-muted-foreground font-display">+</div>
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-xl border-2',
                        state.powerball
                          ? 'bg-secondary text-secondary-foreground border-secondary glow-magenta'
                          : 'bg-muted/30 border-border text-muted-foreground'
                      )}
                    >
                      {state.powerball || '?'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={actions.quickPick}
                      className="cyber-btn bg-muted text-foreground flex items-center gap-2 hover:bg-muted/80"
                    >
                      <RefreshCw className="h-4 w-4" />
                      QUICK PICK
                    </button>
                    <button
                      onClick={actions.clearSelection}
                      className="cyber-btn bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                    >
                      CLEAR
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tickets:</span>
                      <select
                        value={state.ticketCount}
                        onChange={(e) => actions.setTicketCount(Number(e.target.value))}
                        className="bg-muted border border-border rounded px-3 py-2 font-mono text-foreground"
                      >
                        {[1, 2, 5, 10, 20].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={actions.buyTickets}
                      disabled={!isComplete}
                      className={cn(
                        'cyber-btn-primary flex items-center gap-2',
                        !isComplete && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Zap className="h-4 w-4" />
                      BUY TICKET ({(0.01 * state.ticketCount).toFixed(2)} ETH)
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <TicketHistory
                  tickets={state.tickets.slice(0, 5)}
                  lastDrawNumbers={state.lastDraw?.numbers}
                  lastDrawPowerball={state.lastDraw?.powerball}
                />
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <TicketHistory
              tickets={state.tickets}
              lastDrawNumbers={state.lastDraw?.numbers}
              lastDrawPowerball={state.lastDraw?.powerball}
            />
          )}

          {activeTab === 'prizes' && (
            <PrizeTiers tiers={prizeTiers} currentJackpot={state.currentJackpot} />
          )}

          {activeTab === 'history' && (
            <DrawHistory history={state.drawHistory} />
          )}
        </div>
      </div>
    </section>
  );
};

export default PowerballGame;
