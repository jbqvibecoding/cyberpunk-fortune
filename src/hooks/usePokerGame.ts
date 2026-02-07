import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { GameState, GameActions, Player, Card, PlayerAction, GamePhase } from '@/lib/poker/types';
import { createDeck, shuffleDeck, dealCards } from '@/lib/poker/deck';
import { evaluateHand, compareHands } from '@/lib/poker/handEvaluator';
import { getAIDecision, getAICommentary } from '@/lib/poker/aiPlayer';
import { CONTRACTS, ZERO_ADDRESS } from '@/lib/contracts/addresses';
import { SimplePokerABI } from '@/lib/contracts/SimplePokerABI';

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

// ════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════

export function usePokerGame(buyIn: number = 1000): { state: GameState; actions: GameActions } {
  const { address, isConnected } = useAccount();
  const isContractDeployed = CONTRACTS.SimplePoker !== ZERO_ADDRESS;
  const isOnChain = isConnected && isContractDeployed;

  // ── Contract reads ──────────────────────────────────────────

  const { data: playerStats, refetch: refetchStats } = useReadContract({
    address: CONTRACTS.SimplePoker,
    abi: SimplePokerABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    query: { enabled: isOnChain && !!address },
  });

  const { data: minBuyInRaw } = useReadContract({
    address: CONTRACTS.SimplePoker,
    abi: SimplePokerABI,
    functionName: 'minBuyIn',
    query: { enabled: isOnChain },
  });

  const { data: maxBuyInRaw } = useReadContract({
    address: CONTRACTS.SimplePoker,
    abi: SimplePokerABI,
    functionName: 'maxBuyIn',
    query: { enabled: isOnChain },
  });

  // ── Contract write ──────────────────────────────────────────

  const {
    writeContract,
    isPending: isTxPending,
    reset: resetTx,
  } = useWriteContract();

  // ── Contract events ─────────────────────────────────────────

  useWatchContractEvent({
    address: CONTRACTS.SimplePoker,
    abi: SimplePokerABI,
    eventName: 'GameResult',
    enabled: isOnChain,
    onLogs(logs) {
      for (const log of logs) {
        const args = (log as any).args;
        if (!args) continue;
        // Show on-chain result in AI commentary
        const won = args.playerWon;
        const desc = args.handDescription ?? '';
        const payout = args.payout ? formatEther(args.payout as bigint) : '0';
        setState(prev => ({
          ...prev,
          aiCommentary: `On-chain result: ${won ? 'YOU WIN' : 'AI WINS'} - ${desc} (Payout: ${payout} ETH)`,
        }));
        refetchStats();
      }
    },
  });

  // ── Local state (simulation engine) ─────────────────────────

  const [state, setState] = useState<GameState>(() => createInitialState(buyIn));
  const aiThinkingRef = useRef(false);
  const initialBuyInRef = useRef(buyIn);

  useEffect(() => {
    initialBuyInRef.current = buyIn;
  }, [buyIn]);

  // ── Game logic helpers ──────────────────────────────────────

  const getNextActivePlayerIndex = useCallback(
    (players: Player[], currentIndex: number): number => {
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayer = players[nextIndex];
      if (nextPlayer.hasFolded || nextPlayer.isAllIn) return currentIndex;
      return nextIndex;
    },
    [],
  );

  const advanceToNextPhase = useCallback((prevState: GameState): GameState => {
    const phases: GamePhase[] = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
    const currentPhaseIndex = phases.indexOf(prevState.phase as GamePhase);
    if (currentPhaseIndex === -1 || currentPhaseIndex >= phases.length - 1) return prevState;

    const nextPhase = phases[currentPhaseIndex + 1];
    let newCommunityCards = [...prevState.communityCards];
    let newDeck = [...prevState.deck];

    if (nextPhase === 'flop') {
      const { cards, remainingDeck } = dealCards(newDeck, 3);
      newCommunityCards = cards;
      newDeck = remainingDeck;
    } else if (nextPhase === 'turn' || nextPhase === 'river') {
      const { cards, remainingDeck } = dealCards(newDeck, 1);
      newCommunityCards = [...newCommunityCards, ...cards];
      newDeck = remainingDeck;
    }

    const resetPlayers = prevState.players.map(p => ({
      ...p,
      currentBet: 0,
      hasActed: p.hasFolded || p.isAllIn,
    }));

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
      return {
        ...prevState,
        phase: 'finished',
        winner: activePlayers[0],
        winningHand: null,
        showdownRevealed: false,
      };
    }

    if (prevState.phase !== 'showdown') {
      return { ...prevState, phase: 'showdown', showdownRevealed: true };
    }

    const hands = activePlayers.map(p => ({
      player: p,
      hand: evaluateHand(p.cards, prevState.communityCards),
    }));
    hands.sort((a, b) => compareHands(b.hand, a.hand));

    if (hands.length > 1 && compareHands(hands[0].hand, hands[1].hand) === 0) {
      return {
        ...prevState,
        phase: 'finished',
        winner: null,
        winningHand: hands[0].hand,
        isTie: true,
        tiedPlayers: [hands[0].player, hands[1].player],
      };
    }

    return {
      ...prevState,
      phase: 'finished',
      winner: hands[0].player,
      winningHand: hands[0].hand,
      showdownRevealed: true,
    };
  }, []);

  // ── Process action ──────────────────────────────────────────

  const processAction = useCallback(
    (action: PlayerAction, amount?: number, commentary?: string) => {
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
            updatedPlayers[playerIndex] = { ...currentPlayer, hasFolded: true, hasActed: true };
            break;
          case 'check':
            if (prev.currentBet > currentPlayer.currentBet) return prev;
            updatedPlayers[playerIndex] = { ...currentPlayer, hasActed: true };
            break;
          case 'call': {
            const callAmt = Math.min(prev.currentBet - currentPlayer.currentBet, currentPlayer.chips);
            updatedPlayers[playerIndex] = {
              ...currentPlayer,
              chips: currentPlayer.chips - callAmt,
              currentBet: currentPlayer.currentBet + callAmt,
              totalBet: currentPlayer.totalBet + callAmt,
              hasActed: true,
              isAllIn: callAmt >= currentPlayer.chips,
            };
            newPot += callAmt;
            break;
          }
          case 'raise': {
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
            const otherIdx = (playerIndex + 1) % 2;
            if (!updatedPlayers[otherIdx].hasFolded && !updatedPlayers[otherIdx].isAllIn) {
              updatedPlayers[otherIdx].hasActed = false;
            }
            break;
          }
          case 'all-in': {
            const allInAmt = currentPlayer.chips;
            updatedPlayers[playerIndex] = {
              ...currentPlayer,
              chips: 0,
              currentBet: currentPlayer.currentBet + allInAmt,
              totalBet: currentPlayer.totalBet + allInAmt,
              hasActed: true,
              isAllIn: true,
            };
            newPot += allInAmt;
            if (updatedPlayers[playerIndex].currentBet > newCurrentBet) {
              newCurrentBet = updatedPlayers[playerIndex].currentBet;
              const otherIndex = (playerIndex + 1) % 2;
              if (!updatedPlayers[otherIndex].hasFolded && !updatedPlayers[otherIndex].isAllIn) {
                updatedPlayers[otherIndex].hasActed = false;
              }
            }
            break;
          }
        }

        const newState: GameState = {
          ...prev,
          players: updatedPlayers,
          pot: newPot,
          currentBet: newCurrentBet,
          lastAction: { player: currentPlayer.name, action, amount },
          aiCommentary: currentPlayer.isAI ? commentary || getAICommentary(action) : prev.aiCommentary,
        };

        if (updatedPlayers.some(p => p.hasFolded)) return determineWinner(newState);

        const activePlayers = updatedPlayers.filter(p => !p.hasFolded && !p.isAllIn);
        const allActed = activePlayers.every(p => p.hasActed);
        const betsEqual = activePlayers.every(p => p.currentBet === newCurrentBet) || activePlayers.length === 0;
        const allAllIn = updatedPlayers.filter(p => !p.hasFolded).every(p => p.isAllIn);

        if (allAllIn || (activePlayers.length <= 1 && updatedPlayers.filter(p => !p.hasFolded).length > 1)) {
          let runOut: GameState = newState;
          while (runOut.phase !== 'river' && runOut.phase !== 'showdown' && runOut.phase !== 'finished') {
            runOut = advanceToNextPhase(runOut);
          }
          if (runOut.phase === 'river') return determineWinner(runOut);
          return runOut;
        }

        if (allActed && betsEqual) {
          if (prev.phase === 'river') return determineWinner(newState);
          return advanceToNextPhase(newState);
        }

        return { ...newState, currentPlayerIndex: (playerIndex + 1) % 2 };
      });
    },
    [advanceToNextPhase, determineWinner],
  );

  // ── AI turn effect ──────────────────────────────────────────

  useEffect(() => {
    if (state.phase === 'waiting' || state.phase === 'finished' || state.phase === 'showdown') return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer?.isAI || currentPlayer.hasFolded || currentPlayer.isAllIn) return;
    if (aiThinkingRef.current) return;

    aiThinkingRef.current = true;
    setState(prev => ({ ...prev, aiThinking: true }));

    getAIDecision(state)
      .then(decision => {
        processAction(decision.action, decision.raiseAmount, decision.thinking);
        setState(prev => ({ ...prev, aiThinking: false }));
        aiThinkingRef.current = false;
      })
      .catch(() => {
        const canCheck = state.currentBet <= currentPlayer.currentBet;
        processAction(canCheck ? 'check' : 'fold');
        setState(prev => ({ ...prev, aiThinking: false }));
        aiThinkingRef.current = false;
      });
  }, [state.currentPlayerIndex, state.phase, processAction, state.currentBet]);

  // Auto-advance from showdown → finished
  useEffect(() => {
    if (state.phase === 'showdown' && state.showdownRevealed) {
      const timer = setTimeout(() => {
        setState(prev => determineWinner(prev));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.showdownRevealed, determineWinner]);

  // ── Actions ─────────────────────────────────────────────────

  const startGame = useCallback(() => {
    // ON-CHAIN: call quickPlay for instant result recording
    if (isOnChain) {
      const buyInWei = parseEther('0.001');
      writeContract({
        address: CONTRACTS.SimplePoker,
        abi: SimplePokerABI,
        functionName: 'quickPlay',
        value: buyInWei,
      });
    }

    // Local simulation (always runs for UX)
    const deck = shuffleDeck(createDeck());
    const { cards: playerCards, remainingDeck: deck1 } = dealCards(deck, 2);
    const { cards: aiCards, remainingDeck: deck2 } = dealCards(deck1, 2);

    setState(prev => {
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
        currentPlayerIndex: sbIndex,
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
  }, [isOnChain, writeContract]);

  const fold = useCallback(() => {
    const current = state.players[state.currentPlayerIndex];
    if (!current || current.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    processAction('fold');
  }, [state.players, state.currentPlayerIndex, state.phase, processAction]);

  const check = useCallback(() => {
    const current = state.players[state.currentPlayerIndex];
    if (!current || current.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    if (state.currentBet > current.currentBet) return;
    processAction('check');
  }, [state.players, state.currentPlayerIndex, state.phase, state.currentBet, processAction]);

  const call = useCallback(() => {
    const current = state.players[state.currentPlayerIndex];
    if (!current || current.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    processAction('call');
  }, [state.players, state.currentPlayerIndex, state.phase, processAction]);

  const raise = useCallback(
    (amount: number) => {
      const current = state.players[state.currentPlayerIndex];
      if (!current || current.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
      processAction('raise', amount);
    },
    [state.players, state.currentPlayerIndex, state.phase, processAction],
  );

  const allIn = useCallback(() => {
    const current = state.players[state.currentPlayerIndex];
    if (!current || current.isAI || state.phase === 'waiting' || state.phase === 'finished') return;
    processAction('all-in');
  }, [state.players, state.currentPlayerIndex, state.phase, processAction]);

  const resetGame = useCallback(() => {
    setState(prev => {
      const newDealerIndex = (prev.dealerIndex + 1) % 2;
      const playerChips = prev.players.map((p) => {
        let chips = p.chips;
        if (prev.isTie && prev.tiedPlayers) {
          chips += Math.floor(prev.pot / prev.tiedPlayers.length);
        } else if (prev.winner?.id === p.id) {
          chips += prev.pot;
        }
        return chips;
      });

      return {
        ...createInitialState(initialBuyInRef.current),
        phase: 'waiting' as GamePhase,
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
