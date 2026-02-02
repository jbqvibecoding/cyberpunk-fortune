import { Card, HandResult, HandRank } from './types';
import { getRankValue } from './deck';

function getCardsByRank(cards: Card[]): Map<number, Card[]> {
  const map = new Map<number, Card[]>();
  for (const card of cards) {
    const value = getRankValue(card.rank);
    if (!map.has(value)) {
      map.set(value, []);
    }
    map.get(value)!.push(card);
  }
  return map;
}

function getCardsBySuit(cards: Card[]): Map<string, Card[]> {
  const map = new Map<string, Card[]>();
  for (const card of cards) {
    if (!map.has(card.suit)) {
      map.set(card.suit, []);
    }
    map.get(card.suit)!.push(card);
  }
  return map;
}

function isFlush(cards: Card[]): Card[] | null {
  const bySuit = getCardsBySuit(cards);
  for (const [, suited] of bySuit) {
    if (suited.length >= 5) {
      return suited.sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank)).slice(0, 5);
    }
  }
  return null;
}

function isStraight(cards: Card[]): number[] | null {
  const uniqueValues = [...new Set(cards.map(c => getRankValue(c.rank)))].sort((a, b) => b - a);
  
  // Check for A-2-3-4-5 (wheel)
  if (uniqueValues.includes(14) && uniqueValues.includes(2) && uniqueValues.includes(3) && 
      uniqueValues.includes(4) && uniqueValues.includes(5)) {
    return [5, 4, 3, 2, 1]; // Ace counts as 1 in wheel
  }
  
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    const slice = uniqueValues.slice(i, i + 5);
    if (slice[0] - slice[4] === 4) {
      return slice;
    }
  }
  return null;
}

function isStraightFlush(cards: Card[]): { values: number[]; isRoyal: boolean } | null {
  const bySuit = getCardsBySuit(cards);
  for (const [, suited] of bySuit) {
    if (suited.length >= 5) {
      const straight = isStraight(suited);
      if (straight) {
        const isRoyal = straight[0] === 14;
        return { values: straight, isRoyal };
      }
    }
  }
  return null;
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards];
  const byRank = getCardsByRank(allCards);
  
  // Count pairs, trips, quads
  const counts: { value: number; count: number }[] = [];
  for (const [value, cards] of byRank) {
    counts.push({ value, count: cards.length });
  }
  counts.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.value - a.value;
  });

  // Check straight flush / royal flush
  const straightFlush = isStraightFlush(allCards);
  if (straightFlush) {
    if (straightFlush.isRoyal) {
      return {
        rank: 'royal-flush',
        rankValue: 10,
        highCards: straightFlush.values,
        description: '皇家同花顺'
      };
    }
    return {
      rank: 'straight-flush',
      rankValue: 9,
      highCards: straightFlush.values,
      description: `同花顺，${straightFlush.values[0]}高`
    };
  }

  // Four of a kind
  if (counts[0].count === 4) {
    const kicker = counts.find(c => c.count !== 4)?.value || 0;
    return {
      rank: 'four-of-a-kind',
      rankValue: 8,
      highCards: [counts[0].value, kicker],
      description: `四条 ${counts[0].value}s`
    };
  }

  // Full house
  if (counts[0].count === 3 && counts[1]?.count >= 2) {
    return {
      rank: 'full-house',
      rankValue: 7,
      highCards: [counts[0].value, counts[1].value],
      description: `葫芦 ${counts[0].value}s满 ${counts[1].value}s`
    };
  }

  // Flush
  const flush = isFlush(allCards);
  if (flush) {
    return {
      rank: 'flush',
      rankValue: 6,
      highCards: flush.map(c => getRankValue(c.rank)),
      description: `同花，${getRankValue(flush[0].rank)}高`
    };
  }

  // Straight
  const straight = isStraight(allCards);
  if (straight) {
    return {
      rank: 'straight',
      rankValue: 5,
      highCards: straight,
      description: `顺子，${straight[0]}高`
    };
  }

  // Three of a kind
  if (counts[0].count === 3) {
    const kickers = counts.filter(c => c.count !== 3).slice(0, 2).map(c => c.value);
    return {
      rank: 'three-of-a-kind',
      rankValue: 4,
      highCards: [counts[0].value, ...kickers],
      description: `三条 ${counts[0].value}s`
    };
  }

  // Two pair
  if (counts[0].count === 2 && counts[1]?.count === 2) {
    const kicker = counts.find(c => c.count === 1)?.value || 0;
    return {
      rank: 'two-pair',
      rankValue: 3,
      highCards: [counts[0].value, counts[1].value, kicker],
      description: `两对 ${counts[0].value}s和${counts[1].value}s`
    };
  }

  // Pair
  if (counts[0].count === 2) {
    const kickers = counts.filter(c => c.count === 1).slice(0, 3).map(c => c.value);
    return {
      rank: 'pair',
      rankValue: 2,
      highCards: [counts[0].value, ...kickers],
      description: `一对 ${counts[0].value}s`
    };
  }

  // High card
  const highCards = counts.slice(0, 5).map(c => c.value);
  return {
    rank: 'high-card',
    rankValue: 1,
    highCards,
    description: `高牌 ${highCards[0]}`
  };
}

export function compareHands(hand1: HandResult, hand2: HandResult): number {
  if (hand1.rankValue !== hand2.rankValue) {
    return hand1.rankValue - hand2.rankValue;
  }
  
  // Compare high cards
  for (let i = 0; i < Math.min(hand1.highCards.length, hand2.highCards.length); i++) {
    if (hand1.highCards[i] !== hand2.highCards[i]) {
      return hand1.highCards[i] - hand2.highCards[i];
    }
  }
  
  return 0; // Tie
}

export function getHandRankName(rank: HandRank): string {
  const names: Record<HandRank, string> = {
    'high-card': '高牌',
    'pair': '一对',
    'two-pair': '两对',
    'three-of-a-kind': '三条',
    'straight': '顺子',
    'flush': '同花',
    'full-house': '葫芦',
    'four-of-a-kind': '四条',
    'straight-flush': '同花顺',
    'royal-flush': '皇家同花顺'
  };
  return names[rank];
}
