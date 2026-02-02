import { Card, GameState, PlayerAction, HandResult } from './types';
import { evaluateHand } from './handEvaluator';
import { getRankValue } from './deck';

interface AIDecision {
  action: PlayerAction;
  raiseAmount?: number;
  thinking: string;
}

// Calculate hand strength (0-1)
function calculateHandStrength(holeCards: Card[], communityCards: Card[]): number {
  if (communityCards.length === 0) {
    // Pre-flop: evaluate starting hand strength
    return evaluateStartingHand(holeCards);
  }
  
  const hand = evaluateHand(holeCards, communityCards);
  return hand.rankValue / 10;
}

function evaluateStartingHand(cards: Card[]): number {
  const [card1, card2] = cards;
  const rank1 = getRankValue(card1.rank);
  const rank2 = getRankValue(card2.rank);
  const isPair = rank1 === rank2;
  const isSuited = card1.suit === card2.suit;
  const gap = Math.abs(rank1 - rank2);
  const highCard = Math.max(rank1, rank2);
  
  let strength = 0;
  
  // Premium pairs
  if (isPair) {
    strength = 0.5 + (rank1 / 14) * 0.5;
  } else {
    // High cards
    strength = (highCard / 14) * 0.4;
    
    // Suited bonus
    if (isSuited) strength += 0.1;
    
    // Connectedness bonus
    if (gap <= 2) strength += 0.1;
    
    // AK, AQ, AJ, KQ premium hands
    if (highCard === 14 && rank1 + rank2 >= 25) strength += 0.15;
  }
  
  return Math.min(strength, 1);
}

function calculatePotOdds(callAmount: number, pot: number): number {
  if (callAmount === 0) return 1;
  return callAmount / (pot + callAmount);
}

export async function getAIDecision(gameState: GameState): Promise<AIDecision> {
  // Simulate AI thinking time (1-3 seconds)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const aiPlayer = gameState.players.find(p => p.isAI);
  if (!aiPlayer) {
    return { action: 'fold', thinking: '无法找到AI玩家' };
  }
  
  const handStrength = calculateHandStrength(aiPlayer.cards, gameState.communityCards);
  const callAmount = gameState.currentBet - aiPlayer.currentBet;
  const potOdds = calculatePotOdds(callAmount, gameState.pot);
  
  // Random factor for unpredictability
  const randomFactor = Math.random() * 0.2 - 0.1;
  const adjustedStrength = handStrength + randomFactor;
  
  let thinking = '';
  let action: PlayerAction;
  let raiseAmount: number | undefined;
  
  // Decision logic
  if (callAmount === 0) {
    // Can check
    if (adjustedStrength > 0.7) {
      // Strong hand, raise
      action = 'raise';
      raiseAmount = Math.floor(gameState.pot * (0.5 + adjustedStrength * 0.5));
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      thinking = '手牌强劲，主动加注施压';
    } else if (adjustedStrength > 0.4) {
      // Medium hand, occasionally bet
      if (Math.random() > 0.5) {
        action = 'raise';
        raiseAmount = Math.floor(gameState.pot * 0.5);
        raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
        thinking = '尝试半诈唬，探测对手';
      } else {
        action = 'check';
        thinking = '观察一轮，等待机会';
      }
    } else {
      action = 'check';
      thinking = '手牌一般，过牌观望';
    }
  } else {
    // Need to call or fold
    if (adjustedStrength > 0.8 && aiPlayer.chips > callAmount * 3) {
      // Very strong, re-raise
      action = 'raise';
      raiseAmount = callAmount * 2 + Math.floor(gameState.pot * 0.5);
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      thinking = '坚果牌型，强势反加';
    } else if (adjustedStrength > potOdds + 0.1) {
      // Good equity, call
      if (adjustedStrength > 0.6 && Math.random() > 0.6) {
        action = 'raise';
        raiseAmount = callAmount * 2;
        raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
        thinking = '牌力不错，尝试反加';
      } else {
        action = 'call';
        thinking = '赔率合适，跟注继续';
      }
    } else if (adjustedStrength > 0.3 && potOdds < 0.2) {
      // Marginal hand but small pot odds
      action = 'call';
      thinking = '底池赔率可以接受';
    } else {
      action = 'fold';
      thinking = '牌力不足，明智弃牌';
    }
  }
  
  // All-in logic for short stack
  if (aiPlayer.chips <= gameState.bigBlind * 5 && adjustedStrength > 0.5) {
    action = 'all-in';
    thinking = '短筹码，全押搏杀';
  }
  
  return { action, raiseAmount, thinking };
}

// Generate AI commentary based on game state
export function getAICommentary(gameState: GameState, action: PlayerAction): string {
  const phase = gameState.phase;
  const comments: Record<string, string[]> = {
    'fold': [
      '这手牌不适合继续。',
      '明智的选择是放弃。',
      '等待更好的机会。'
    ],
    'check': [
      '让我看看后续发展。',
      '暂时不需要行动。',
      '观察一下再说。'
    ],
    'call': [
      '我愿意付出这个代价。',
      '让我们继续看牌。',
      '这个价格可以接受。'
    ],
    'raise': [
      '让我们提高赌注。',
      '准备好迎接挑战了吗？',
      '这手牌值得投资。'
    ],
    'all-in': [
      '全押！这是最终决战。',
      '把所有筹码都推进去。',
      '要么赢大，要么回家。'
    ]
  };
  
  const options = comments[action] || ['...'];
  return options[Math.floor(Math.random() * options.length)];
}
