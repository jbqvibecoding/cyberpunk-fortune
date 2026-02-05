import { GameState } from '@/lib/poker/types';
import { PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { Cpu, User, Clock, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PokerTableProps {
  state: GameState;
}

const phaseNames: Record<string, string> = {
  'waiting': 'WAITING',
  'pre-flop': 'PRE-FLOP',
  'flop': 'FLOP',
  'turn': 'TURN',
  'river': 'RIVER',
  'showdown': 'SHOWDOWN',
  'finished': 'FINISHED',
};

export function PokerTable({ state }: PokerTableProps) {
  const playerData = state.players.find(p => !p.isAI);
  const aiData = state.players.find(p => p.isAI);
  const isShowdown = state.phase === 'showdown' || state.phase === 'finished';
  const currentPlayer = state.players[state.currentPlayerIndex];

  // Determine dealer button position
  const dealerPlayer = state.players.find(p => p.isDealer);
  const isDealerAI = dealerPlayer?.isAI;

  return (
    <div className="cyber-card p-6 md:p-8 relative overflow-hidden">
      {/* Phase indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm">{phaseNames[state.phase]}</span>
      </div>

      {/* AI Commentary */}
      {state.aiCommentary && (
        <div className="absolute top-4 left-4 bg-secondary/20 backdrop-blur-sm rounded-lg px-3 py-2 max-w-[200px] border border-secondary/30">
          <div className="flex items-start gap-2">
            <MessageCircle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
            <span className="text-xs text-secondary italic">"{state.aiCommentary}"</span>
          </div>
        </div>
      )}

      {/* Table Surface */}
      <div className="relative bg-gradient-to-b from-success/20 to-success/5 rounded-[80px] md:rounded-[100px] p-6 md:p-8 border border-success/30 min-h-[400px]">
        
        {/* AI Opponent */}
        <div className="flex justify-center mb-6">
          <div className="text-center relative">
            {/* Dealer Button for AI */}
            {isDealerAI && (
              <div className="absolute -left-8 top-4">
                <div className="w-8 h-8 rounded-full bg-accent border-2 border-accent-foreground flex items-center justify-center shadow-lg">
                  <span className="font-display text-xs font-bold text-accent-foreground">D</span>
                </div>
              </div>
            )}
            
            <div className={cn(
              'w-16 h-16 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center mb-2 mx-auto transition-all',
              currentPlayer?.isAI && state.phase !== 'finished' && state.phase !== 'showdown'
                ? 'bg-secondary/20 border-secondary glow-magenta animate-pulse'
                : 'bg-secondary/10 border-secondary/50'
            )}>
              <Cpu className="h-8 w-8 md:h-10 md:w-10 text-secondary" />
            </div>
            <span className="font-display text-sm text-secondary">AI OPPONENT</span>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              Chips: {aiData?.chips || 0}
            </div>
            
            {/* AI Thinking Indicator */}
            {state.aiThinking && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            
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
                  highlight={isShowdown && state.winner?.isAI}
                />
              ))}
              {(!aiData?.cards.length || aiData.cards.length === 0) && state.phase !== 'waiting' && (
                <>
                  <PlayingCard faceDown size="md" />
                  <PlayingCard faceDown size="md" />
                </>
              )}
            </div>
            
            {aiData?.hasFolded && (
              <span className="text-destructive text-sm mt-2 block font-bold">FOLDED</span>
            )}
            {aiData?.isAllIn && !aiData?.hasFolded && (
              <span className="text-accent text-sm mt-2 block font-bold animate-pulse">ALL-IN!</span>
            )}
          </div>
        </div>

        {/* Community Cards */}
        <div className="flex justify-center gap-2 md:gap-3 my-6 md:my-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={cn(
              "transition-all duration-300",
              state.communityCards[i] ? "opacity-100 scale-100" : "opacity-30 scale-95"
            )}>
              <PlayingCard
                card={state.communityCards[i]}
                faceDown={!state.communityCards[i]}
                size="md"
              />
            </div>
          ))}
        </div>

        {/* Pot Display */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ChipStack amount={state.pot} label="POT" variant="gold" />
        </div>

        {/* Player */}
        <div className="flex justify-center mt-6">
          <div className="text-center relative">
            {/* Dealer Button for Player */}
            {!isDealerAI && dealerPlayer && (
              <div className="absolute -left-8 top-4">
                <div className="w-8 h-8 rounded-full bg-accent border-2 border-accent-foreground flex items-center justify-center shadow-lg">
                  <span className="font-display text-xs font-bold text-accent-foreground">D</span>
                </div>
              </div>
            )}
            
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
              {(!playerData?.cards.length || playerData.cards.length === 0) && state.phase !== 'waiting' && (
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
              currentPlayer && !currentPlayer.isAI && state.phase !== 'finished' && state.phase !== 'showdown'
                ? 'bg-primary/20 border-primary glow-cyan'
                : 'bg-primary/10 border-primary/50'
            )}>
              <User className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <span className="font-display text-sm text-primary">YOU</span>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              Chips: {playerData?.chips || 0}
            </div>
            
            {playerData?.hasFolded && (
              <span className="text-destructive text-sm mt-2 block font-bold">FOLDED</span>
            )}
            {playerData?.isAllIn && !playerData?.hasFolded && (
              <span className="text-accent text-sm mt-2 block font-bold animate-pulse">ALL-IN!</span>
            )}
          </div>
        </div>

        {/* Showdown Indicator */}
        {state.phase === 'showdown' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-accent animate-pulse">
              <span className="font-display text-xl text-accent">SHOWDOWN!</span>
            </div>
          </div>
        )}
      </div>

      {/* Last Action Display */}
      {state.lastAction && (
        <div className="mt-4 text-center">
          <span className="text-sm text-muted-foreground">
            <span className={state.lastAction.player === 'YOU' ? 'text-primary' : 'text-secondary'}>
              {state.lastAction.player}
            </span>
            {': '}
            <span className="font-mono uppercase text-foreground">
              {state.lastAction.action}
              {state.lastAction.amount && ` ${state.lastAction.amount}`}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
