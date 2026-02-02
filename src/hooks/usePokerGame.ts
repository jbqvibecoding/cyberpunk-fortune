import { useState, useCallback, useEffect } from 'react';
import { GameState, GameActions, Player, Card, PlayerAction } from '@/lib/poker/types';
import { createDeck, shuffleDeck, dealCards } from '@/lib/poker/deck';
import { evaluateHand, compareHands } from '@/lib/poker/handEvaluator';
import { getAIDecision } from '@/lib/poker/aiPlayer';

const INITIAL_CHIPS = 1000;
const SMALL_BLIND = 5;
const BIG_BLIND = 10;

function createInitialState(buyIn: number): GameState {
  return {
    phase: 'waiting',
    players: [
      {
        id: 'player',
        name: '你',
        chips: buyIn,
        cards: [],
        currentBet: 0,
        totalBet: 0,
        hasFolded: false,
        hasActed: false,
        isAllIn: false,
        isDealer: true,
        isAI: false,
      },
      {
        id: 'ai',
        name: 'AI 对手',
        chips: buyIn,
        cards: [],
        currentBet: 0,
        totalBet: 0,
        hasFolded: false,
        hasActed: false,
        isAllIn: false,
        isDealer: false,
        isAI: true,
      },
    ],
    communityCards: [],
    deck: [],
    pot: 0,
    currentBet: 0,
    currentPlayerIndex: 0,
    dealerIndex: 0,
    smallBlind: SMALL_BLIND,
    bigBlind: BIG_BLIND,
    winner: null,
    winningHand: null,
    lastAction: null,
    aiThinking: false,
  };
}

export function usePokerGame(buyIn: number = INITIAL_CHIPS): { state: GameState; actions: GameActions } {
  const [state, setState] = useState<GameState>(() => createInitialState(buyIn));

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const getCurrentPlayer = useCallback(() => {
    return state.players[state.currentPlayerIndex];
  }, [state.players, state.currentPlayerIndex]);

  const getOtherPlayer = useCallback(() => {
    return state.players[(state.currentPlayerIndex + 1) % 2];
  }, [state.players, state.currentPlayerIndex]);

  const advancePhase = useCallback(() => {
    setState(prev => {
      const phases: GameState['phase'][] = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
      const currentIndex = phases.indexOf(prev.phase as any);
      
      if (currentIndex === -1 || currentIndex >= phases.length - 1) {
        return prev;
      }

      const nextPhase = phases[currentIndex + 1];
      let newCommunityCards = [...prev.communityCards];
      let newDeck = [...prev.deck];

      if (nextPhase === 'flop') {
        const { cards, remainingDeck } = dealCards(newDeck, 3);
        newCommunityCards = cards;
        newDeck = remainingDeck;
      } else if (nextPhase === 'turn' || nextPhase === 'river') {
        const { cards, remainingDeck } = dealCards(newDeck, 1);
        newCommunityCards = [...newCommunityCards, ...cards];
        newDeck = remainingDeck;
      }

      // Reset betting for new round
      const resetPlayers = prev.players.map(p => ({
        ...p,
        currentBet: 0,
        hasActed: false,
      }));

      // Determine first to act (non-dealer in heads up)
      const firstToAct = resetPlayers.findIndex(p => !p.isDealer);

      return {
        ...prev,
        phase: nextPhase,
        communityCards: newCommunityCards,
        deck: newDeck,
        currentBet: 0,
        currentPlayerIndex: firstToAct,
        players: resetPlayers,
      };
    });
  }, []);

  const determineWinner = useCallback(() => {
    setState(prev => {
      const activePlayers = prev.players.filter(p => !p.hasFolded);
      
      if (activePlayers.length === 1) {
        // Other player folded
        return {
          ...prev,
          phase: 'finished',
          winner: activePlayers[0],
          winningHand: null,
        };
      }

      // Evaluate hands
      const hands = activePlayers.map(p => ({
        player: p,
        hand: evaluateHand(p.cards, prev.communityCards),
      }));

      hands.sort((a, b) => compareHands(b.hand, a.hand));
      const winningHand = hands[0];

      return {
        ...prev,
        phase: 'finished',
        winner: winningHand.player,
        winningHand: winningHand.hand,
      };
    });
  }, []);

  const processAction = useCallback((action: PlayerAction, amount?: number) => {
    setState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const updatedPlayers = [...prev.players];
      const playerIndex = prev.currentPlayerIndex;
      let newPot = prev.pot;
      let newCurrentBet = prev.currentBet;

      switch (action) {
        case 'fold':
          updatedPlayers[playerIndex] = {
            ...currentPlayer,
            hasFolded: true,
            hasActed: true,
          };
          break;

        case 'check':
          updatedPlayers[playerIndex] = {
            ...currentPlayer,
            hasActed: true,
          };
          break;

        case 'call':
          const callAmount = prev.currentBet - currentPlayer.currentBet;
          const actualCall = Math.min(callAmount, currentPlayer.chips);
          updatedPlayers[playerIndex] = {
            ...currentPlayer,
            chips: currentPlayer.chips - actualCall,
            currentBet: currentPlayer.currentBet + actualCall,
            totalBet: currentPlayer.totalBet + actualCall,
            hasActed: true,
            isAllIn: actualCall >= currentPlayer.chips,
          };
          newPot += actualCall;
          break;

        case 'raise':
          const raiseAmount = amount || prev.bigBlind * 2;
          const totalBet = prev.currentBet + raiseAmount;
          const toAdd = totalBet - currentPlayer.currentBet;
          const actualAdd = Math.min(toAdd, currentPlayer.chips);
          updatedPlayers[playerIndex] = {
            ...currentPlayer,
            chips: currentPlayer.chips - actualAdd,
            currentBet: currentPlayer.currentBet + actualAdd,
            totalBet: currentPlayer.totalBet + actualAdd,
            hasActed: true,
            isAllIn: actualAdd >= currentPlayer.chips,
          };
          newPot += actualAdd;
          newCurrentBet = updatedPlayers[playerIndex].currentBet;
          // Reset other player's hasActed so they must respond
          updatedPlayers[(playerIndex + 1) % 2].hasActed = false;
          break;

        case 'all-in':
          const allInAmount = currentPlayer.chips;
          updatedPlayers[playerIndex] = {
            ...currentPlayer,
            chips: 0,
            currentBet: currentPlayer.currentBet + allInAmount,
            totalBet: currentPlayer.totalBet + allInAmount,
            hasActed: true,
            isAllIn: true,
          };
          newPot += allInAmount;
          if (updatedPlayers[playerIndex].currentBet > newCurrentBet) {
            newCurrentBet = updatedPlayers[playerIndex].currentBet;
            updatedPlayers[(playerIndex + 1) % 2].hasActed = false;
          }
          break;
      }

      return {
        ...prev,
        players: updatedPlayers,
        pot: newPot,
        currentBet: newCurrentBet,
        currentPlayerIndex: (playerIndex + 1) % 2,
        lastAction: {
          player: currentPlayer.name,
          action,
          amount,
        },
      };
    });
  }, []);

  // Check if round is complete
  useEffect(() => {
    if (state.phase === 'waiting' || state.phase === 'finished') return;

    const activePlayers = state.players.filter(p => !p.hasFolded && !p.isAllIn);
    const allActed = activePlayers.every(p => p.hasActed);
    const betsEqual = activePlayers.every(p => p.currentBet === state.currentBet);
    const someoneFolded = state.players.some(p => p.hasFolded);

    if (someoneFolded) {
      determineWinner();
      return;
    }

    // Check if both players are all-in
    const allAllIn = state.players.filter(p => !p.hasFolded).every(p => p.isAllIn);
    if (allAllIn) {
      // Run out all community cards
      if (state.phase === 'river') {
        determineWinner();
      } else {
        setTimeout(advancePhase, 1000);
      }
      return;
    }

    if (allActed && betsEqual) {
      if (state.phase === 'river') {
        determineWinner();
      } else {
        advancePhase();
      }
    }
  }, [state.players, state.phase, state.currentBet, advancePhase, determineWinner]);

  // AI turn
  useEffect(() => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer?.isAI || state.phase === 'waiting' || state.phase === 'finished' || state.aiThinking) {
      return;
    }

    if (currentPlayer.hasFolded || currentPlayer.isAllIn) {
      setState(prev => ({
        ...prev,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % 2,
      }));
      return;
    }

    setState(prev => ({ ...prev, aiThinking: true }));

    getAIDecision(state).then(decision => {
      processAction(decision.action, decision.raiseAmount);
      setState(prev => ({ ...prev, aiThinking: false }));
    });
  }, [state.currentPlayerIndex, state.phase, getCurrentPlayer, processAction, state.aiThinking]);

  const startGame = useCallback(() => {
    const deck = shuffleDeck(createDeck());
    
    // Deal hole cards
    const { cards: playerCards, remainingDeck: deck1 } = dealCards(deck, 2);
    const { cards: aiCards, remainingDeck: deck2 } = dealCards(deck1, 2);

    // Post blinds (in heads up, dealer posts small blind)
    const dealerIndex = 0; // Player is dealer
    const sbIndex = dealerIndex;
    const bbIndex = (dealerIndex + 1) % 2;

    setState(prev => {
      const newPlayers = [...prev.players];
      
      // Post small blind
      const sbAmount = Math.min(SMALL_BLIND, newPlayers[sbIndex].chips);
      newPlayers[sbIndex] = {
        ...newPlayers[sbIndex],
        chips: newPlayers[sbIndex].chips - sbAmount,
        currentBet: sbAmount,
        totalBet: sbAmount,
        cards: playerCards,
        isDealer: true,
        hasFolded: false,
        hasActed: false,
        isAllIn: false,
      };

      // Post big blind
      const bbAmount = Math.min(BIG_BLIND, newPlayers[bbIndex].chips);
      newPlayers[bbIndex] = {
        ...newPlayers[bbIndex],
        chips: newPlayers[bbIndex].chips - bbAmount,
        currentBet: bbAmount,
        totalBet: bbAmount,
        cards: aiCards,
        isDealer: false,
        hasFolded: false,
        hasActed: false,
        isAllIn: false,
      };

      return {
        ...prev,
        phase: 'pre-flop',
        deck: deck2,
        players: newPlayers,
        communityCards: [],
        pot: sbAmount + bbAmount,
        currentBet: BIG_BLIND,
        currentPlayerIndex: sbIndex, // Dealer acts first in heads up pre-flop
        dealerIndex,
        winner: null,
        winningHand: null,
        lastAction: null,
      };
    });
  }, []);

  const fold = useCallback(() => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isAI) return;
    processAction('fold');
  }, [getCurrentPlayer, processAction]);

  const check = useCallback(() => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isAI) return;
    if (state.currentBet > currentPlayer.currentBet) return;
    processAction('check');
  }, [getCurrentPlayer, state.currentBet, processAction]);

  const call = useCallback(() => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isAI) return;
    processAction('call');
  }, [getCurrentPlayer, processAction]);

  const raise = useCallback((amount: number) => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isAI) return;
    processAction('raise', amount);
  }, [getCurrentPlayer, processAction]);

  const allIn = useCallback(() => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isAI) return;
    processAction('all-in');
  }, [getCurrentPlayer, processAction]);

  const resetGame = useCallback(() => {
    setState(prev => {
      // Keep chips, swap dealer
      const newDealerIndex = (prev.dealerIndex + 1) % 2;
      return {
        ...createInitialState(INITIAL_CHIPS),
        players: prev.players.map((p, i) => ({
          ...createInitialState(INITIAL_CHIPS).players[i],
          chips: p.chips + (prev.winner?.id === p.id ? prev.pot : 0),
          isDealer: i === newDealerIndex,
        })),
        dealerIndex: newDealerIndex,
      };
    });
  }, []);

  return {
    state,
    actions: {
      startGame,
      fold,
      check,
      call,
      raise,
      allIn,
      resetGame,
    },
  };
}
