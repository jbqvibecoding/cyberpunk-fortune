import { Card, GameState, PlayerAction } from './types';
import { evaluateHand, getHandRankName } from './handEvaluator';
import { getRankValue, formatCard } from './deck';

interface AIDecision {
  action: PlayerAction;
  raiseAmount?: number;
  thinking: string;
}

// ═══════════════════════════════════════════════════════════
// LLM Integration (optional — uses VITE_OPENAI_API_KEY)
// ═══════════════════════════════════════════════════════════

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string) || 'gpt-3.5-turbo';

async function callLLM(gameState: GameState): Promise<AIDecision | null> {
  if (!OPENAI_API_KEY) return null;

  const ai = gameState.players.find(p => p.isAI);
  if (!ai) return null;

  const holeCardsStr = ai.cards.map(formatCard).join(', ');
  const communityStr = gameState.communityCards.length > 0
    ? gameState.communityCards.map(formatCard).join(', ')
    : 'None yet';
  const callAmount = gameState.currentBet - ai.currentBet;

  const prompt = `You are the AI opponent in a heads-up Texas Hold'em poker game. Analyze and decide.

Game State:
- Phase: ${gameState.phase}
- Your hole cards: ${holeCardsStr}
- Community cards: ${communityStr}
- Pot: ${gameState.pot} chips
- Your chips: ${ai.chips}
- Opponent's bet: ${gameState.currentBet}
- Your current bet: ${ai.currentBet}
- Amount to call: ${callAmount}
- Blinds: ${gameState.smallBlind}/${gameState.bigBlind}

Available actions: ${callAmount === 0 ? 'check, raise, all-in' : 'fold, call, raise, all-in'}

Respond in EXACTLY this JSON format, nothing else:
{"action":"check|fold|call|raise|all-in","raiseAmount":NUMBER_OR_NULL,"thinking":"Your 1-2 sentence reasoning"}`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const validActions: PlayerAction[] = ['fold', 'check', 'call', 'raise', 'all-in'];
    const action = validActions.includes(parsed.action) ? parsed.action : null;
    if (!action) return null;

    // Validate: can't check when there's a bet to call
    if (action === 'check' && callAmount > 0) return null;
    if (action === 'fold' && callAmount === 0) return null;

    return {
      action,
      raiseAmount: action === 'raise' ? (parsed.raiseAmount || gameState.bigBlind * 2) : undefined,
      thinking: `🤖 LLM: ${parsed.thinking || 'Calculated decision.'}`,
    };
  } catch {
    return null;
  }
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
  // Try real LLM first (if API key configured)
  const llmResult = await callLLM(gameState);
  if (llmResult) return llmResult;

  // Fallback: algorithmic decision with detailed chain-of-thought reasoning
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1700));
  
  const aiPlayer = gameState.players.find(p => p.isAI);
  if (!aiPlayer) {
    return { action: 'fold', thinking: 'Cannot find AI player' };
  }
  
  const handStrength = calculateHandStrength(aiPlayer.cards, gameState.communityCards);
  const callAmount = gameState.currentBet - aiPlayer.currentBet;
  const potOdds = calculatePotOdds(callAmount, gameState.pot);
  
  // Build chain-of-thought reasoning
  const holeStr = aiPlayer.cards.map(formatCard).join(', ');
  const comStr = gameState.communityCards.length > 0
    ? gameState.communityCards.map(formatCard).join(', ')
    : 'none';
  const handEval = gameState.communityCards.length > 0
    ? evaluateHand(aiPlayer.cards, gameState.communityCards)
    : null;
  const handName = handEval ? getHandRankName(handEval.rank) : 'Pre-flop';

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
      action = 'raise';
      raiseAmount = Math.floor(gameState.pot * (0.6 + adjustedStrength * 0.4));
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      raiseAmount = Math.max(raiseAmount, gameState.bigBlind);
      thinking = `Analyzing [${holeStr}] vs board [${comStr}]. Hand: ${handName}, strength=${(adjustedStrength*100).toFixed(0)}%. Strong holding — betting ${raiseAmount} for value.`;
    } else if (adjustedStrength > 0.5 && Math.random() > 0.4) {
      action = 'raise';
      raiseAmount = Math.floor(gameState.pot * 0.5);
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      raiseAmount = Math.max(raiseAmount, gameState.bigBlind);
      thinking = `Hand [${holeStr}], board [${comStr}]. ${handName} with ${(adjustedStrength*100).toFixed(0)}% equity. Semi-bluff — pot-building with ${raiseAmount}.`;
    } else if (adjustedStrength > 0.3 && Math.random() > 0.7) {
      action = 'raise';
      raiseAmount = Math.floor(gameState.pot * 0.4);
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      raiseAmount = Math.max(raiseAmount, gameState.bigBlind);
      thinking = `Weak holding [${holeStr}] (${(adjustedStrength*100).toFixed(0)}%), but board texture [${comStr}] allows a stab at the pot.`;
    } else {
      action = 'check';
      thinking = `Evaluating [${holeStr}] on [${comStr}]. ${handName} at ${(adjustedStrength*100).toFixed(0)}% equity — checking to see next card.`;
    }
  } else {
    // Facing a bet
    const effectiveOdds = adjustedStrength * phaseAggression;
    
    if (adjustedStrength > 0.85 && aiPlayer.chips > callAmount * 2) {
      action = 'raise';
      raiseAmount = callAmount * 2 + Math.floor(gameState.pot * 0.5);
      raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
      thinking = `Premium hand [${holeStr}] — ${handName}! Equity ${(adjustedStrength*100).toFixed(0)}% >> pot odds ${(potOdds*100).toFixed(0)}%. Re-raising to ${raiseAmount} for maximum value.`;
    } else if (effectiveOdds > potOdds + 0.15) {
      if (adjustedStrength > 0.65 && Math.random() > 0.5 && aiPlayer.chips > callAmount * 3) {
        action = 'raise';
        raiseAmount = callAmount * 2;
        raiseAmount = Math.min(raiseAmount, aiPlayer.chips);
        thinking = `Good equity ${(adjustedStrength*100).toFixed(0)}% with [${holeStr}] (${handName}). Pot odds ${(potOdds*100).toFixed(0)}% favorable — raising to apply pressure.`;
      } else {
        action = 'call';
        thinking = `[${holeStr}] gives ${handName}. Equity ${(adjustedStrength*100).toFixed(0)}% vs pot odds ${(potOdds*100).toFixed(0)}% — +EV call.`;
      }
    } else if (effectiveOdds > potOdds - 0.05) {
      // Marginal decision
      if (callAmount <= gameState.bigBlind * 2) {
        action = 'call';
        thinking = `Marginal spot with [${holeStr}]. ${(adjustedStrength*100).toFixed(0)}% equity vs ${(potOdds*100).toFixed(0)}% odds. Small bet — calling to see.`;
      } else if (Math.random() > 0.6) {
        action = 'call';
        thinking = `Borderline decision. [${holeStr}] at ${(adjustedStrength*100).toFixed(0)}% equity. Taking a calculated risk.`;
      } else {
        action = 'fold';
        thinking = `[${holeStr}] only ${(adjustedStrength*100).toFixed(0)}%. Pot odds ${(potOdds*100).toFixed(0)}% unfavorable — disciplined fold.`;
      }
    } else {
      // Poor equity
      if (callAmount <= gameState.bigBlind && Math.random() > 0.3) {
        action = 'call';
        thinking = `Min bet with [${holeStr}]. Low equity ${(adjustedStrength*100).toFixed(0)}% but cheap price — speculative call.`;
      } else {
        action = 'fold';
        thinking = `Weak holding [${holeStr}] (${handName}). ${(adjustedStrength*100).toFixed(0)}% equity << ${(potOdds*100).toFixed(0)}% pot odds. Clear fold.`;
      }
    }
  }
  
  // Short stack all-in logic
  if (aiPlayer.chips <= gameState.bigBlind * 8 && adjustedStrength > 0.45) {
    if (callAmount > 0 || adjustedStrength > 0.6) {
      action = 'all-in';
      thinking = `Short stack (${aiPlayer.chips} chips). [${holeStr}] at ${(adjustedStrength*100).toFixed(0)}% — pushing all-in for fold equity + showdown value.`;
    }
  }
  
  // Prevent raising more than we have
  if (action === 'raise' && raiseAmount && raiseAmount > aiPlayer.chips) {
    action = 'all-in';
    raiseAmount = undefined;
    thinking = `All-in with [${holeStr}] (${handName}). ${(adjustedStrength*100).toFixed(0)}% equity — maximum pressure.`;
  }

  // Prefix with AI label
  thinking = `🧠 AI: ${thinking}`;

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
