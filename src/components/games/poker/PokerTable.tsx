import { GameState } from '@/lib/poker/types';
import { PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { Cpu, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PokerTableProps {
  state: GameState;
}

const phaseNames: Record<string, string> = {
  'waiting': '等待开始',
  'pre-flop': '翻牌前',
  'flop': '翻牌',
  'turn': '转牌',
  'river': '河牌',
  'showdown': '摊牌',
  'finished': '结束',
};

export function PokerTable({ state }: PokerTableProps) {
  const playerData = state.players.find(p => !p.isAI);
  const aiData = state.players.find(p => p.isAI);
  const isShowdown = state.phase === 'showdown' || state.phase === 'finished';
  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <div className="cyber-card p-6 md:p-8 relative overflow-hidden">
      {/* Phase indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm">{phaseNames[state.phase]}</span>
      </div>

      {/* Last action */}
      {state.lastAction && (
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {state.lastAction.player}: 
            <span className="text-primary ml-1">
              {state.lastAction.action}
              {state.lastAction.amount && ` ${state.lastAction.amount}`}
            </span>
          </span>
        </div>
      )}

      {/* Table Surface */}
      <div className="relative bg-gradient-to-b from-success/20 to-success/5 rounded-[80px] md:rounded-[100px] p-6 md:p-8 border border-success/30 min-h-[400px]">
        
        {/* Dealer Button */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center">
            <span className="font-display text-xs text-accent">D</span>
          </div>
        </div>

        {/* AI Opponent */}
        <div className="flex justify-center mb-6">
          <div className="text-center">
            <div className={cn(
              'w-16 h-16 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center mb-2 mx-auto transition-all',
              currentPlayer?.isAI && state.phase !== 'finished'
                ? 'bg-secondary/20 border-secondary glow-magenta animate-pulse'
                : 'bg-secondary/10 border-secondary/50'
            )}>
              <Cpu className="h-8 w-8 md:h-10 md:w-10 text-secondary" />
            </div>
            <span className="font-display text-sm text-secondary">AI 对手</span>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              筹码: {aiData?.chips || 0}
            </div>
            {aiData && aiData.currentBet > 0 && (
              <div className="mt-2">
                <ChipStack amount={aiData.currentBet} variant="silver" />
              </div>
            )}
            {/* AI Cards */}
            <div className="flex gap-2 justify-center mt-3">
              {aiData?.cards.map((card, i) => (
                <PlayingCard 
                  key={i} 
                  card={card}
                  faceDown={!isShowdown}
                  size="md"
                />
              ))}
              {(!aiData?.cards.length || aiData.cards.length === 0) && (
                <>
                  <PlayingCard faceDown size="md" />
                  <PlayingCard faceDown size="md" />
                </>
              )}
            </div>
            {aiData?.hasFolded && (
              <span className="text-destructive text-sm mt-2 block">已弃牌</span>
            )}
            {aiData?.isAllIn && (
              <span className="text-accent text-sm mt-2 block">全押!</span>
            )}
          </div>
        </div>

        {/* Community Cards */}
        <div className="flex justify-center gap-2 md:gap-3 my-6 md:my-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <PlayingCard
              key={i}
              card={state.communityCards[i]}
              faceDown={!state.communityCards[i]}
              size="md"
            />
          ))}
        </div>

        {/* Pot Display */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ChipStack amount={state.pot} label="底池" variant="gold" />
        </div>

        {/* Player */}
        <div className="flex justify-center mt-6">
          <div className="text-center">
            {/* Player Cards */}
            <div className="flex gap-2 justify-center mb-3">
              {playerData?.cards.map((card, i) => (
                <PlayingCard 
                  key={i} 
                  card={card}
                  size="md"
                  highlight={state.phase === 'finished' && state.winner?.id === 'player'}
                />
              ))}
              {(!playerData?.cards.length || playerData.cards.length === 0) && (
                <>
                  <PlayingCard faceDown size="md" />
                  <PlayingCard faceDown size="md" />
                </>
              )}
            </div>
            {playerData && playerData.currentBet > 0 && (
              <div className="mb-2">
                <ChipStack amount={playerData.currentBet} variant="primary" />
              </div>
            )}
            <div className={cn(
              'w-16 h-16 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center mb-2 mx-auto transition-all',
              currentPlayer && !currentPlayer.isAI && state.phase !== 'finished'
                ? 'bg-primary/20 border-primary glow-cyan'
                : 'bg-primary/10 border-primary/50'
            )}>
              <User className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <span className="font-display text-sm text-primary">你</span>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              筹码: {playerData?.chips || 0}
            </div>
            {playerData?.hasFolded && (
              <span className="text-destructive text-sm mt-2 block">已弃牌</span>
            )}
            {playerData?.isAllIn && (
              <span className="text-accent text-sm mt-2 block">全押!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
