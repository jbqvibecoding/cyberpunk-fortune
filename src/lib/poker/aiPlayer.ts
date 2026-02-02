import { Card, GameState, PlayerAction } from './types';
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
    return evaluateStartingHand(holeCards);
  }
  
  const hand = evaluateHand(holeCards, communityCards);
  // Normalize rank value (1-10) to 0-1 scale with some variance
  return Math.min(1, (hand.rankValue / 10) + (hand.highCards[0] / 140));
}

function evaluateStartingHand(cards: Card[]): number {
  const [card1, card2] = cards;
  const rank1 = getRankValue(card1.rank);
  const rank2 = getRankValue(card2.rank);
  const isPair = rank1 === rank2;
  const isSuited = card1.suit === card2.suit;
  const gap = Math.abs(rank1 - rank2);
  const highCard = Math.max(rank1, rank2);
  const lowCard = Math.min(rank1, rank2);
  
  let strength = 0;
  
  // Premium pairs (AA, KK, QQ, JJ, TT)
  if (isPair) {
    if (rank1 >= 10) {
      strength = 0.85 + (rank1 - 10) * 0.03; // TT=0.85, AA=0.97
    } else if (rank1 >= 7) {
      strength = 0.6 + (rank1 - 7) * 0.05; // 77=0.6, 99=0.7
    } else {
      strength = 0.45 + (rank1 / 14) * 0.1; // Small pairs
    }
  } else {
    // High cards base strength
    strength = (highCard / 14) * 0.35 + (lowCard / 14) * 0.15;
    
    // Suited bonus
    if (isSuited) strength += 0.08;
    
    // Connectedness bonus
    if (gap === 1) strength += 0.08;
    else if (gap === 2) strength += 0.05;
    else if (gap === 3) strength += 0.02;
    
    // Premium hands bonus
    if (highCard === 14) { // Ace high
      if (lowCard >= 12) strength += 0.2; // AK, AQ
      else if (lowCard >= 10) strength += 0.12; // AJ, AT
      else if (isSuited) strength += 0.05; // Suited Ace
    } else if (highCard === 13 && lowCard >= 11) { // KQ, KJ
      strength += 0.1;
    }
  }
  
  return Math.min(strength, 1);
}

function calculatePotOdds(callAmount: number, pot: number): number {
  if (callAmount === 0) return 0;
  return callAmount / (pot + callAmount);
}

export async function getAIDecision(gameState: GameState): Promise<AIDecision> {
  // Simulate AI thinking time (800ms - 2.5s for more realistic play)
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1700));
  
  const aiPlayer = gameState.players.find(p => p.isAI);
  if (!aiPlayer) {
    return { action: 'fold', thinking: 'Cannot find AI player' };
  }
  
  const handStrength = calculateHandStrength(aiPlayer.cards, gameState.communityCards);
  const callAmount = gameState.currentBet - aiPlayer.currentBet;
  const potOdds = calculatePotOdds(callAmount, gameState.pot);
  
  // Add randomness for unpredictability
  const randomFactor = Math.random() * 0.15 - 0.075;
  const adjustedStrength = Math.max(0, Math.min(1, handStrength + randomFactor));
  
  let thinking = '';
  let action: PlayerAction;
  let raiseAmount: number | undefined;
  
  // Phase-based aggression adjustment
  const phaseAggression = gameState.phase === 'pre-flop' ? 1.0 :
                          gameState.phase === 'flop' ? 0.9 :
                          gameState.phase === 'turn' ? 0.85 : 0.8;

  // Decision logic
  if (callAmount === 0) {
    // Can check - no pressure
    if (adjustedStrength > 0.75) {
      // Strong hand, bet for value
      action = 'raise';
      raiseAmount = Math.floor(gameState.pot * (0.6 + adjustedStrength * 0.4));
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      raiseAmount = Math.max(raiseAmount, gameState.bigBlind);
      thinking = 'Strong hand, betting for value';
    } else if (adjustedStrength > 0.5 && Math.random() > 0.4) {
      // Medium hand, sometimes bet
      action = 'raise';
      raiseAmount = Math.floor(gameState.pot * 0.5);
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      raiseAmount = Math.max(raiseAmount, gameState.bigBlind);
      thinking = 'Semi-bluff, building the pot';
    } else if (adjustedStrength > 0.3 && Math.random() > 0.7) {
      // Weak hand, occasional bluff
      action = 'raise';
      raiseAmount = Math.floor(gameState.pot * 0.4);
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      raiseAmount = Math.max(raiseAmount, gameState.bigBlind);
      thinking = 'Taking a stab at the pot';
    } else {
      action = 'check';
      thinking = 'Checking to see more cards';
    }
  } else {
    // Facing a bet
    const effectiveOdds = adjustedStrength * phaseAggression;
    
    if (adjustedStrength > 0.85 && aiPlayer.chips > callAmount * 2) {
      // Monster hand, re-raise
      action = 'raise';
      raiseAmount = callAmount * 2 + Math.floor(gameState.pot * 0.5);
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      thinking = 'Premium hand, raising for value';
    } else if (effectiveOdds > potOdds + 0.15) {
      // Good equity vs pot odds
      if (adjustedStrength > 0.65 && Math.random() > 0.5 && aiPlayer.chips > callAmount * 3) {
        action = 'raise';
        raiseAmount = callAmount * 2;
        raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
        thinking = 'Good hand, applying pressure';
      } else {
        action = 'call';
        thinking = 'Pot odds favorable, calling';
      }
    } else if (effectiveOdds > potOdds - 0.05) {
      // Marginal decision
      if (callAmount <= gameState.bigBlind * 2) {
        action = 'call';
        thinking = 'Small bet, worth seeing more cards';
      } else if (Math.random() > 0.6) {
        action = 'call';
        thinking = 'Taking a chance';
      } else {
        action = 'fold';
        thinking = 'Marginal spot, folding';
      }
    } else {
      // Poor equity
      if (callAmount <= gameState.bigBlind && Math.random() > 0.3) {
        action = 'call';
        thinking = 'Minimum bet, cheap look';
      } else {
        action = 'fold';
        thinking = 'Not enough equity, folding';
      }
    }
  }
  
  // Short stack all-in logic
  if (aiPlayer.chips <= gameState.bigBlind * 8 && adjustedStrength > 0.45) {
    if (callAmount > 0 || adjustedStrength > 0.6) {
      action = 'all-in';
      thinking = 'Short stack, pushing all-in';
    }
  }
  
  // Prevent raising more than we have
  if (action === 'raise' && raiseAmount && raiseAmount > aiPlayer.chips) {
    action = 'all-in';
    raiseAmount = undefined;
    thinking = 'All-in for value';
  }

  return { action, raiseAmount, thinking };
}

// Generate AI commentary based on action
export function getAICommentary(action: PlayerAction): string {
  const comments: Record<string, string[]> = {
    'fold': [
      'Not my hand.',
      'I\'ll wait for a better spot.',
      'Discretion is the better part of valor.',
    ],
    'check': [
      'Let\'s see what develops.',
      'I\'ll take a free card.',
      'No need to bet here.',
    ],
    'call': [
      'I\'ll see that bet.',
      'Let\'s continue.',
      'Worth a look.',
    ],
    'raise': [
      'Let\'s make it interesting.',
      'I\'m raising the stakes.',
      'Can you handle this?',
    ],
    'all-in': [
      'All-in! This is it.',
      'Putting it all on the line.',
      'Let\'s see what you\'ve got.',
    ]
  };
  
  const options = comments[action] || ['...'];
  return options[Math.floor(Math.random() * options.length)];
}
