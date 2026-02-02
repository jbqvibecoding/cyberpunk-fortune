import { useState, useEffect } from 'react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { PokerTable } from './poker/PokerTable';
import { BettingControls } from './poker/BettingControls';
import { WinnerDisplay } from './poker/WinnerDisplay';
import { HandHistory, HandRecord } from './poker/HandHistory';
import { MatchStats } from './poker/MatchStats';
import { Cpu, Shield, Clock, Zap, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const stakes = [
  { min: 100, max: 500, label: 'MICRO', color: 'text-success', blinds: '5/10' },
  { min: 500, max: 2000, label: 'LOW', color: 'text-primary', blinds: '10/20' },
  { min: 2000, max: 10000, label: 'HIGH', color: 'text-accent', blinds: '25/50' },
];

type GameView = 'lobby' | 'table';

export default function PokerGame() {
  const [view, setView] = useState<GameView>('lobby');
  const [selectedStake, setSelectedStake] = useState(0);
  const [buyIn, setBuyIn] = useState(500);
  const [initialBuyIn, setInitialBuyIn] = useState(500);
  const [handHistory, setHandHistory] = useState<HandRecord[]>([]);
  const { state, actions } = usePokerGame(buyIn);

  // Track hand results
  useEffect(() => {
    if (state.phase === 'finished' && state.winner) {
      const newRecord: HandRecord = {
        id: `hand-${Date.now()}`,
        winner: state.winner.isAI ? 'ai' : 'player',
        pot: state.pot,
        handDescription: state.winningHand?.description || null,
        timestamp: new Date(),
      };
      setHandHistory(prev => [newRecord, ...prev]);
    }
  }, [state.phase, state.winner, state.pot, state.winningHand]);

  const handleEnterGame = () => {
    setView('table');
    setInitialBuyIn(buyIn);
    setHandHistory([]);
  };

  const handleBackToLobby = () => {
    setView('lobby');
    actions.resetGame();
    setHandHistory([]);
  };

  const handleNextHand = () => {
    actions.resetGame();
  };

  const handleNewMatch = () => {
    actions.resetGame();
    setHandHistory([]);
  };

  if (view === 'table') {
    const playerData = state.players.find(p => !p.isAI);
    const aiData = state.players.find(p => p.isAI);
    const isGameOver = (playerData?.chips || 0) === 0 || (aiData?.chips || 0) === 0;

    return (
      <section id="poker" className="py-24 relative bg-gradient-to-b from-background via-secondary/5 to-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToLobby}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
            <div className="text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wider">
                TEXAS HOLD'EM <span className="text-glow-magenta text-secondary">AI DUEL</span>
              </h2>
            </div>
            <Button
              variant="ghost"
              onClick={handleNewMatch}
              className="text-muted-foreground hover:text-primary"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              New Match
            </Button>
          </div>

          {/* Match Stats */}
          <div className="max-w-4xl mx-auto mb-6">
            <MatchStats
              playerChips={playerData?.chips || 0}
              aiChips={aiData?.chips || 0}
              initialChips={initialBuyIn}
              handsPlayed={handHistory.length}
            />
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Main game area */}
              <div className="md:col-span-2 space-y-6">
                {/* Poker Table */}
                <PokerTable state={state} />

                {/* Betting Controls or Winner Display */}
                <div className="cyber-card p-6">
                  {state.phase === 'finished' && state.winner ? (
                    <WinnerDisplay
                      winner={state.winner}
                      pot={state.pot}
                      winningHand={state.winningHand}
                      onContinue={handleNextHand}
                    />
                  ) : (
                    <BettingControls state={state} actions={actions} />
                  )}
                </div>

                {/* Game Over state */}
                {isGameOver && state.phase === 'waiting' && (
                  <div className="cyber-card p-6 text-center border-accent">
                    <h3 className="font-display text-2xl mb-4">
                      {(playerData?.chips || 0) === 0 ? (
                        <span className="text-destructive">GAME OVER - AI WINS THE MATCH!</span>
                      ) : (
                        <span className="text-success">CONGRATULATIONS - YOU WIN THE MATCH!</span>
                      )}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Hands played: {handHistory.length}
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={handleNewMatch} className="cyber-btn-primary">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        NEW MATCH
                      </Button>
                      <Button onClick={handleBackToLobby} variant="outline">
                        BACK TO LOBBY
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Hand History */}
              <div className="space-y-4">
                <HandHistory history={handHistory} />

                {/* Quick Info */}
                <div className="cyber-card p-4">
                  <h4 className="font-display text-sm mb-2 text-muted-foreground">BLINDS</h4>
                  <span className="font-mono text-lg text-primary">
                    {state.smallBlind}/{state.bigBlind}
                  </span>
                </div>

                {/* Last Action */}
                {state.lastAction && (
                  <div className="cyber-card p-4">
                    <h4 className="font-display text-sm mb-2 text-muted-foreground">LAST ACTION</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{state.lastAction.player}</span>
                      <span className="font-mono text-primary uppercase">
                        {state.lastAction.action}
                        {state.lastAction.amount && ` ${state.lastAction.amount}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Lobby View
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

        <div className="max-w-3xl mx-auto">
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
                    {stake.min} - {stake.max} chips
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Blinds: {stake.blinds}
                  </p>
                </button>
              ))}
            </div>

            {/* Buy-in Slider */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Buy-in Amount</span>
                <span className="font-mono text-primary">{buyIn} chips</span>
              </div>
              <Slider
                value={[buyIn]}
                onValueChange={([value]) => setBuyIn(value)}
                min={stakes[selectedStake].min}
                max={stakes[selectedStake].max}
                step={100}
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
            <button 
              onClick={handleEnterGame}
              className="cyber-btn-secondary text-lg flex items-center gap-3 mx-auto"
            >
              <Zap className="h-5 w-5" />
              ENTER GAME ({buyIn} chips)
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              By entering, you agree to the smart contract rules. All games are recorded on-chain.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
