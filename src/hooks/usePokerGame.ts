import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameActions, Player, Card, PlayerAction, GamePhase } from '@/lib/poker/types';
import { createDeck, shuffleDeck, dealCards } from '@/lib/poker/deck';
import { evaluateHand, compareHands } from '@/lib/poker/handEvaluator';
import { getAIDecision, getAICommentary } from '@/lib/poker/aiPlayer';

const SMALL_BLIND = 5;
const BIG_BLIND = 10;

function createInitialState(buyIn: number): GameState {
  return {
    phase: 'waiting',
    players: [
      {
        id: 'player',
        name: 'YOU',
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
        name: 'AI OPPONENT',
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
    aiCommentary: null,
    showdownRevealed: false,
  };
}

export function usePokerGame(buyIn: number = 1000): { state: GameState; actions: GameActions } {
  const [state, setState] = useState<GameState>(() => createInitialState(buyIn));
  const aiThinkingRef = useRef(false);
  const initialBuyInRef = useRef(buyIn);

  // Track buyIn changes for new matches
  useEffect(() => {
    initialBuyInRef.current = buyIn;
  }, [buyIn]);

  const getNextActivePlayerIndex = useCallback((players: Player[], currentIndex: number): number => {
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];
    
    // If next player has folded or is all-in, they can't act
    if (nextPlayer.hasFolded || nextPlayer.isAllIn) {
      return currentIndex; // Stay on current (or skip)
    }
    return nextIndex;
  }, []);

  const advanceToNextPhase = useCallback((prevState: GameState): GameState => {
    const phases: GamePhase[] = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
    const currentPhaseIndex = phases.indexOf(prevState.phase as GamePhase);
    
    if (currentPhaseIndex === -1 || currentPhaseIndex >= phases.length - 1) {
      return prevState;
    }

    const nextPhase = phases[currentPhaseIndex + 1];
    let newCommunityCards = [...prevState.communityCards];
    let newDeck = [...prevState.deck];

    // Deal community cards based on phase
    if (nextPhase === 'flop') {
      const { cards, remainingDeck } = dealCards(newDeck, 3);
      newCommunityCards = cards;
      newDeck = remainingDeck;
    } else if (nextPhase === 'turn' || nextPhase === 'river') {
      const { cards, remainingDeck } = dealCards(newDeck, 1);
      newCommunityCards = [...newCommunityCards, ...cards];
      newDeck = remainingDeck;
    }

    // Reset betting for new round - non-dealer acts first post-flop
    const resetPlayers = prevState.players.map(p => ({
      ...p,
      currentBet: 0,
      hasActed: p.hasFolded || p.isAllIn, // Folded/all-in players don't need to act
    }));

    // In heads-up, BB (non-dealer) acts first post-flop
    const firstToAct = resetPlayers.findIndex(p => !p.isDealer && !p.hasFolded && !p.isAllIn);
    const actualFirst = firstToAct >= 0 ? firstToAct : resetPlayers.findIndex(p => !p.hasFolded && !p.isAllIn);

    return {
      ...prevState,
      phase: nextPhase,
      communityCards: newCommunityCards,
      deck: newDeck,
      currentBet: 0,
      currentPlayerIndex: actualFirst >= 0 ? actualFirst : 0,
      players: resetPlayers,
      aiCommentary: null,
    };
  }, []);

  const determineWinner = useCallback((prevState: GameState): GameState => {
    const activePlayers = prevState.players.filter(p => !p.hasFolded);
    
    if (activePlayers.length === 1) {
      // Other player folded - no showdown needed
      const winner = activePlayers[0];
      return {
        ...prevState,
        phase: 'finished',
        winner,
        winningHand: null,
        showdownRevealed: false,
      };
    }

    // Go to showdown first to reveal cards, then determine winner
    if (prevState.phase !== 'showdown') {
      return {
        ...prevState,
        phase: 'showdown',
        showdownRevealed: true,
      };
    }

    // Showdown - evaluate hands
    const hands = activePlayers.map(p => ({
      player: p,
      hand: evaluateHand(p.cards, prevState.communityCards),
    }));

    hands.sort((a, b) => compareHands(b.hand, a.hand));
    const winningHand = hands[0];

    // Check for tie
    if (hands.length > 1 && compareHands(hands[0].hand, hands[1].hand) === 0) {
      // It's a tie - split the pot
      return {
        ...prevState,
        phase: 'finished',
        winner: null, // null indicates a tie
        winningHand: hands[0].hand,
        isTie: true,
        tiedPlayers: [hands[0].player, hands[1].player],
      };
    }

    return {
      ...prevState,
      phase: 'finished',
      winner: winningHand.player,
      winningHand: winningHand.hand,
      showdownRevealed: true,
    };
  }, []);

  const processAction = useCallback((action: PlayerAction, amount?: number, commentary?: string) => {
    setState(prev => {
      if (prev.phase === 'waiting' || prev.phase === 'finished') return prev;
      
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.hasFolded || currentPlayer.isAllIn) return prev;

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
          if (prev.currentBet > currentPlayer.currentBet) return prev; // Can't check if there's a bet
          updatedPlayers[playerIndex] = {
            ...currentPlayer,
            hasActed: true,
          };
          break;

        case 'call':
          const callAmount = Math.min(prev.currentBet - currentPlayer.currentBet, currentPlayer.chips);
          updatedPlayers[playerIndex] = {
            ...currentPlayer,
            chips: currentPlayer.chips - callAmount,
            currentBet: currentPlayer.currentBet + callAmount,
            totalBet: currentPlayer.totalBet + callAmount,
            hasActed: true,
            isAllIn: callAmount >= currentPlayer.chips,
          };
          newPot += callAmount;
          break;

        case 'raise':
          const raiseTotal = amount || prev.bigBlind * 2;
          const toAdd = Math.min(raiseTotal, currentPlayer.chips);
          updatedPlayers[playerIndex] = {
            ...currentPlayer,
            chips: currentPlayer.chips - toAdd,
            currentBet: currentPlayer.currentBet + toAdd,
            totalBet: currentPlayer.totalBet + toAdd,
            hasActed: true,
            isAllIn: toAdd >= currentPlayer.chips,
          };
          newPot += toAdd;
          newCurrentBet = updatedPlayers[playerIndex].currentBet;
          
          // Other player must respond to raise
          const otherIdx = (playerIndex + 1) % 2;
          if (!updatedPlayers[otherIdx].hasFolded && !updatedPlayers[otherIdx].isAllIn) {
            updatedPlayers[otherIdx].hasActed = false;
          }
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
            const otherIndex = (playerIndex + 1) % 2;
            if (!updatedPlayers[otherIndex].hasFolded && !updatedPlayers[otherIndex].isAllIn) {
              updatedPlayers[otherIndex].hasActed = false;
            }
          }
          break;
      }

      const newState: GameState = {
        ...prev,
        players: updatedPlayers,
        pot: newPot,
        currentBet: newCurrentBet,
        lastAction: { player: currentPlayer.name, action, amount },
        aiCommentary: currentPlayer.isAI ? (commentary || getAICommentary(action)) : prev.aiCommentary,
      };

      // Check if someone folded
      const someoneFolded = updatedPlayers.some(p => p.hasFolded);
      if (someoneFolded) {
        return determineWinner(newState);
      }

      // Check if round is complete
      const activePlayers = updatedPlayers.filter(p => !p.hasFolded && !p.isAllIn);
      const allActed = activePlayers.every(p => p.hasActed);
      const betsEqual = activePlayers.every(p => p.currentBet === newCurrentBet) || activePlayers.length === 0;
      const allAllIn = updatedPlayers.filter(p => !p.hasFolded).every(p => p.isAllIn);

      // If all players are all-in, run out remaining cards
      if (allAllIn || (activePlayers.length <= 1 && updatedPlayers.filter(p => !p.hasFolded).length > 1)) {
        let runOutState: GameState = newState;
        
        // Fast-forward through remaining phases
        while (runOutState.phase !== 'river' && runOutState.phase !== 'showdown' && runOutState.phase !== 'finished') {
          runOutState = advanceToNextPhase(runOutState);
        }
        
        if (runOutState.phase === 'river') {
          return determineWinner(runOutState);
        }
        return runOutState;
      }

      // If all active players have acted and bets are equal, advance phase
      if (allActed && betsEqual) {
        if (prev.phase === 'river') {
          return determineWinner(newState);
        }
        return advanceToNextPhase(newState);
      }

      // Otherwise, move to next player
      const nextPlayerIndex = (playerIndex + 1) % 2;

      return {
        ...newState,
        currentPlayerIndex: nextPlayerIndex,
      };
    });
  }, [advanceToNextPhase, determineWinner]);

  // AI turn effect
  useEffect(() => {
    if (state.phase === 'waiting' || state.phase === 'finished' || state.phase === 'showdown') {
      return;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer?.isAI || currentPlayer.hasFolded || currentPlayer.isAllIn) {
      return;
    }

    if (aiThinkingRef.current) return;
    
    aiThinkingRef.current = true;
    setState(prev => ({ ...prev, aiThinking: true }));

    getAIDecision(state).then(decision => {
      processAction(decision.action, decision.raiseAmount, decision.thinking);
      setState(prev => ({ ...prev, aiThinking: false }));
      aiThinkingRef.current = false;
    }).catch(() => {
      // Fallback: AI checks or folds
      const canCheck = state.currentBet <= currentPlayer.currentBet;
      processAction(canCheck ? 'check' : 'fold');
      setState(prev => ({ ...prev, aiThinking: false }));
      aiThinkingRef.current = false;
    });
  }, [state.currentPlayerIndex, state.phase, processAction, state.currentBet]);

  // Auto-advance from showdown to finished
  useEffect(() => {
    if (state.phase === 'showdown' && state.showdownRevealed) {
      const timer = setTimeout(() => {
        setState(prev => determineWinner(prev));
      }, 2000); // 2 second delay to show cards
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.showdownRevealed, determineWinner]);

  const startGame = useCallback(() => {
    const deck = shuffleDeck(createDeck());
    
    // Deal hole cards
    const { cards: playerCards, remainingDeck: deck1 } = dealCards(deck, 2);
    const { cards: aiCards, remainingDeck: deck2 } = dealCards(deck1, 2);

    setState(prev => {
      // In heads-up, dealer posts SB and acts first pre-flop
      const dealerIndex = prev.dealerIndex;
      const sbIndex = dealerIndex;
      const bbIndex = (dealerIndex + 1) % 2;

      const newPlayers = prev.players.map((p, i) => {
        const isDealer = i === sbIndex;
        const blindAmount = isDealer ? SMALL_BLIND : BIG_BLIND;
        const actualBlind = Math.min(blindAmount, p.chips);
        const chips = p.chips - actualBlind;
        
        return {
          ...p,
          chips,
          currentBet: actualBlind,
          totalBet: actualBlind,
          cards: i === 0 ? playerCards : aiCards,
          isDealer,
          hasFolded: false,
          hasActed: false,
          isAllIn: chips === 0,
        };
      });

      const sbAmount = Math.min(SMALL_BLIND, prev.players[sbIndex].chips);
      const bbAmount = Math.min(BIG_BLIND, prev.players[bbIndex].chips);

      return {
        ...prev,
        phase: 'pre-flop',
        deck: deck2,
        players: newPlayers,
        communityCards: [],
        pot: sbAmount + bbAmount,
        currentBet: BIG_BLIND,
        currentPlayerIndex: sbIndex, // Dealer (SB) acts first in heads-up pre-flop
        dealerIndex,
        winner: null,
        winningHand: null,
        lastAction: null,
        aiThinking: false,
        aiCommentary: null,
        showdownRevealed: false,
        isTie: false,
        tiedPlayers: undefined,
      };
    });
  }, []);

  const fold = useCallback(() => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    processAction('fold');
  }, [state.players, state.currentPlayerIndex, state.phase, processAction]);

  const check = useCallback(() => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    if (state.currentBet > currentPlayer.currentBet) return;
    processAction('check');
  }, [state.players, state.currentPlayerIndex, state.phase, state.currentBet, processAction]);

  const call = useCallback(() => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    processAction('call');
  }, [state.players, state.currentPlayerIndex, state.phase, processAction]);

  const raise = useCallback((amount: number) => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    processAction('raise', amount);
  }, [state.players, state.currentPlayerIndex, state.phase, processAction]);

  const allIn = useCallback(() => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    processAction('all-in');
  }, [state.players, state.currentPlayerIndex, state.phase, processAction]);

  const resetGame = useCallback(() => {
    setState(prev => {
      // Swap dealer position for next hand
      const newDealerIndex = (prev.dealerIndex + 1) % 2;
      
      // Calculate new chip counts
      const playerChips = prev.players.map((p, i) => {
        let chips = p.chips;
        
        if (prev.isTie && prev.tiedPlayers) {
          // Split pot for tie
          chips += Math.floor(prev.pot / prev.tiedPlayers.length);
        } else if (prev.winner?.id === p.id) {
          chips += prev.pot;
        }
        
        return chips;
      });

      // Check if either player is eliminated
      const anyEliminated = playerChips.some(c => c <= 0);

      return {
        ...createInitialState(initialBuyInRef.current),
        phase: anyEliminated ? 'waiting' : 'waiting',
        players: prev.players.map((p, i) => ({
          ...createInitialState(initialBuyInRef.current).players[i],
          chips: Math.max(0, playerChips[i]),
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
