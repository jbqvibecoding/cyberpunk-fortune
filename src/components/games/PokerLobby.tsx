import { useState } from 'react';
import { Spade, Heart, Diamond, Club, Cpu, User, Zap, Shield, Clock } from 'lucide-react';

const stakes = [
  { min: 0.1, max: 1, label: 'MICRO', color: 'text-success' },
  { min: 1, max: 5, label: 'LOW', color: 'text-primary' },
  { min: 5, max: 10, label: 'HIGH', color: 'text-accent' },
];

const PokerLobby = () => {
  const [selectedStake, setSelectedStake] = useState(0);
  const [buyIn, setBuyIn] = useState(0.5);

  return (
    <section id="poker" className="py-24 relative bg-gradient-to-b from-background via-secondary/5 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="font-mono text-sm text-secondary tracking-widest">GAME MODE 2</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 tracking-wider">
            TEXAS HOLD'EM <span className="text-glow-magenta text-secondary">AI DUEL</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Challenge our LLM-powered AI in heads-up poker. All cards dealt via Chainlink VRF.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Poker Table Preview */}
          <div className="cyber-card p-8 mb-8 relative overflow-hidden">
          {/* Table Surface */}
          <div className="relative bg-gradient-to-b from-success/20 to-success/5 rounded-[100px] p-8 border border-success/30">
            {/* Dealer Position */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center">
                <span className="font-display text-xs text-accent">D</span>
                </div>
              </div>

              {/* AI Opponent */}
              <div className="flex justify-center mb-8">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/10 border-2 border-secondary/50 flex items-center justify-center mb-2 mx-auto glow-magenta">
                    <Cpu className="h-10 w-10 text-secondary" />
                  </div>
                  <span className="font-display text-sm text-secondary">AI OPPONENT</span>
                  <div className="flex gap-2 justify-center mt-3">
                    <div className="playing-card face-down w-16 h-24 text-base" />
                    <div className="playing-card face-down w-16 h-24 text-base" />
                  </div>
                </div>
              </div>

              {/* Community Cards */}
              <div className="flex justify-center gap-3 my-8">
                {['A♠', 'K♥', '10♦', '?', '?'].map((card, i) => (
                  <div 
                    key={i} 
                    className={`playing-card w-16 h-24 text-base ${
                      card === '?' ? 'face-down' : ''
                    } ${
                      card.includes('♥') || card.includes('♦') ? 'text-destructive' : 'text-primary-foreground'
                    }`}
                  >
                    {card !== '?' && card}
                  </div>
                ))}
              </div>

              {/* Pot Display */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="chip chip-gold">
                  <span className="text-xs">POT</span>
                </div>
              </div>

              {/* Player */}
              <div className="flex justify-center mt-8">
                <div className="text-center">
                  <div className="flex gap-2 justify-center mb-3">
                    <div className="playing-card w-16 h-24 text-base text-primary-foreground">J♠</div>
                    <div className="playing-card w-16 h-24 text-base text-primary-foreground">J♣</div>
                  </div>
                  <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/50 flex items-center justify-center mb-2 mx-auto glow-cyan">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <span className="font-display text-sm text-primary">YOU</span>
                </div>
              </div>
            </div>

            {/* Table Info Overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">PREVIEW</span>
            </div>
          </div>

          {/* Stake Selection */}
          <div className="cyber-card p-6 mb-6">
            <h3 className="font-display text-xl mb-6">SELECT STAKES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {stakes.map((stake, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedStake(i);
                    setBuyIn(stake.min);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedStake === i
                      ? 'border-primary bg-primary/10 glow-cyan'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className={`font-display text-lg font-bold ${stake.color}`}>
                    {stake.label}
                  </span>
                  <p className="font-mono text-sm text-muted-foreground mt-1">
                    {stake.min} - {stake.max} ETH
                  </p>
                </button>
              ))}
            </div>

            {/* Buy-in Slider */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Buy-in Amount</span>
                <span className="font-mono text-primary">{buyIn.toFixed(2)} ETH</span>
              </div>
              <input
                type="range"
                min={stakes[selectedStake].min}
                max={stakes[selectedStake].max}
                step={0.1}
                value={buyIn}
                onChange={(e) => setBuyIn(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="cyber-card p-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-success" />
              <div>
                <span className="font-display text-sm">PROVABLY FAIR</span>
                <p className="text-xs text-muted-foreground">Chainlink VRF Verified</p>
              </div>
            </div>
            <div className="cyber-card p-4 flex items-center gap-3">
              <Cpu className="h-6 w-6 text-secondary" />
              <div>
                <span className="font-display text-sm">AI POWERED</span>
                <p className="text-xs text-muted-foreground">LLM via Chainlink Functions</p>
              </div>
            </div>
            <div className="cyber-card p-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <span className="font-display text-sm">&lt;10s RESPONSE</span>
                <p className="text-xs text-muted-foreground">Fast AI Decision Making</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button className="cyber-btn-secondary text-lg flex items-center gap-3 mx-auto">
              <Zap className="h-5 w-5" />
              ENTER GAME ({buyIn.toFixed(2)} ETH)
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              By entering, you agree to the smart contract rules. All games are recorded on-chain.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PokerLobby;
