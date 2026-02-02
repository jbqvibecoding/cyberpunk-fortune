import { useState } from 'react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { PokerTable } from './poker/PokerTable';
import { BettingControls } from './poker/BettingControls';
import { Cpu, Shield, Clock, Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const stakes = [
  { min: 100, max: 500, label: '新手场', color: 'text-success', blinds: '5/10' },
  { min: 500, max: 2000, label: '常规场', color: 'text-primary', blinds: '10/20' },
  { min: 2000, max: 10000, label: '高额场', color: 'text-accent', blinds: '25/50' },
];

type GameView = 'lobby' | 'table';

export default function PokerGame() {
  const [view, setView] = useState<GameView>('lobby');
  const [selectedStake, setSelectedStake] = useState(0);
  const [buyIn, setBuyIn] = useState(500);
  const { state, actions } = usePokerGame(buyIn);

  const handleEnterGame = () => {
    setView('table');
  };

  const handleBackToLobby = () => {
    setView('lobby');
    actions.resetGame();
  };

  if (view === 'table') {
    return (
      <section id="poker" className="py-24 relative bg-gradient-to-b from-background via-secondary/5 to-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToLobby}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回大厅
            </Button>
            <div className="text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wider">
                TEXAS HOLD'EM <span className="text-glow-magenta text-secondary">AI DUEL</span>
              </h2>
            </div>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Poker Table */}
            <PokerTable state={state} />

            {/* Betting Controls */}
            <div className="cyber-card p-6">
              <BettingControls state={state} actions={actions} />
            </div>

            {/* Game Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="cyber-card p-3 text-center">
                <span className="text-xs text-muted-foreground">小盲/大盲</span>
                <p className="font-mono text-primary">5/10</p>
              </div>
              <div className="cyber-card p-3 text-center">
                <span className="text-xs text-muted-foreground">你的筹码</span>
                <p className="font-mono text-primary">{state.players[0]?.chips || 0}</p>
              </div>
              <div className="cyber-card p-3 text-center">
                <span className="text-xs text-muted-foreground">AI 筹码</span>
                <p className="font-mono text-secondary">{state.players[1]?.chips || 0}</p>
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
            挑战 LLM 驱动的 AI 对手，体验头对头德州扑克。所有发牌均通过 Chainlink VRF 验证。
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Stake Selection */}
          <div className="cyber-card p-6 mb-6">
            <h3 className="font-display text-xl mb-6">选择场次</h3>
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
                    {stake.min} - {stake.max} 筹码
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    盲注: {stake.blinds}
                  </p>
                </button>
              ))}
            </div>

            {/* Buy-in Slider */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">买入金额</span>
                <span className="font-mono text-primary">{buyIn} 筹码</span>
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
                <span className="font-display text-sm">公平发牌</span>
                <p className="text-xs text-muted-foreground">Chainlink VRF 验证</p>
              </div>
            </div>
            <div className="cyber-card p-4 flex items-center gap-3">
              <Cpu className="h-6 w-6 text-secondary" />
              <div>
                <span className="font-display text-sm">AI 驱动</span>
                <p className="text-xs text-muted-foreground">LLM 智能决策</p>
              </div>
            </div>
            <div className="cyber-card p-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <span className="font-display text-sm">&lt;10秒响应</span>
                <p className="text-xs text-muted-foreground">快速 AI 决策</p>
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
              进入游戏 ({buyIn} 筹码)
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              进入即表示您同意智能合约规则。所有游戏记录将上链存储。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
