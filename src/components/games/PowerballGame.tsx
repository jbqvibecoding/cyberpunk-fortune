import { useState } from 'react';
import { Ticket, RefreshCw, Zap, Clock, Trophy } from 'lucide-react';

const PowerballGame = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [powerball, setPowerball] = useState<number | null>(null);
  const [ticketCount, setTicketCount] = useState(1);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < 5) {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const togglePowerball = (num: number) => {
    setPowerball(powerball === num ? null : num);
  };

  const quickPick = () => {
    const shuffled = Array.from({ length: 69 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setSelectedNumbers(shuffled.slice(0, 5).sort((a, b) => a - b));
    setPowerball(Math.floor(Math.random() * 26) + 1);
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
    setPowerball(null);
  };

  const isComplete = selectedNumbers.length === 5 && powerball !== null;

  return (
    <section id="powerball" className="py-24 relative">
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

        <div className="max-w-4xl mx-auto">
          {/* Jackpot Display */}
          <div className="cyber-card p-6 mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-accent" />
              <span className="font-display text-lg text-muted-foreground">CURRENT JACKPOT</span>
            </div>
            <div className="font-display text-5xl md:text-6xl font-black text-glow-yellow text-accent">
              247.85 ETH
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Next draw: <span className="text-primary font-mono">12:34:56</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-secondary" />
                <span>Tickets sold: <span className="text-secondary font-mono">4,892</span></span>
              </div>
            </div>
          </div>

          {/* Number Selection Grid */}
          <div className="cyber-card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold">
                SELECT 5 NUMBERS <span className="text-primary">(1-69)</span>
              </h3>
              <span className="font-mono text-primary">{selectedNumbers.length}/5</span>
            </div>

            <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 gap-2 mb-8">
              {Array.from({ length: 69 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  className={`number-ball text-sm ${selectedNumbers.includes(num) ? 'selected' : ''}`}
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
                <span className="font-mono text-secondary">{powerball ? '1/1' : '0/1'}</span>
              </div>

              <div className="grid grid-cols-9 sm:grid-cols-13 gap-2">
                {Array.from({ length: 26 }, (_, i) => i + 1).map(num => (
                  <button
                    key={`pb-${num}`}
                    onClick={() => togglePowerball(num)}
                    className={`number-ball powerball text-sm ${powerball === num ? 'selected' : ''}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selection Display */}
          <div className="cyber-card p-6 mb-6">
            <h3 className="font-display text-lg mb-4">YOUR SELECTION</h3>
            <div className="flex flex-wrap items-center gap-3">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-xl border-2 ${
                    selectedNumbers[i]
                      ? 'bg-primary text-primary-foreground border-primary glow-cyan'
                      : 'bg-muted/30 border-border text-muted-foreground'
                  }`}
                >
                  {selectedNumbers[i] || '?'}
                </div>
              ))}
              <div className="text-2xl text-muted-foreground font-display">+</div>
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-xl border-2 ${
                  powerball
                    ? 'bg-secondary text-secondary-foreground border-secondary glow-magenta'
                    : 'bg-muted/30 border-border text-muted-foreground'
                }`}
              >
                {powerball || '?'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={quickPick}
                className="cyber-btn bg-muted text-foreground flex items-center gap-2 hover:bg-muted/80"
              >
                <RefreshCw className="h-4 w-4" />
                QUICK PICK
              </button>
              <button
                onClick={clearSelection}
                className="cyber-btn bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              >
                CLEAR
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Tickets:</span>
                <select
                  value={ticketCount}
                  onChange={(e) => setTicketCount(Number(e.target.value))}
                  className="bg-muted border border-border rounded px-3 py-2 font-mono text-foreground"
                >
                  {[1, 2, 5, 10, 20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <button
                disabled={!isComplete}
                className={`cyber-btn-primary flex items-center gap-2 ${!isComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Zap className="h-4 w-4" />
                BUY TICKET ({(0.01 * ticketCount).toFixed(2)} ETH)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerballGame;
