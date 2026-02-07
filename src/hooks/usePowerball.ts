import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { CyberPowerballABI } from '@/lib/contracts/CyberPowerballABI';

// ════════════════════════════════════════════════════════════════
// Types  (preserved from original – consumed by PowerballGame.tsx)
// ════════════════════════════════════════════════════════════════

export type PlayMode = 'standard' | 'double-play' | 'no-loss';

export interface PowerballTicket {
  id: string;
  numbers: number[];
  powerball: number;
  timestamp: Date;
  cost: number;
  matchedNumbers: number;
  matchedPowerball: boolean;
  prize: number;
  playMode: PlayMode;
  drawRound: number;
  principalRedeemable: boolean;
}

export interface DrawResult {
  id: string;
  numbers: number[];
  powerball: number;
  timestamp: Date;
  jackpot: number;
}

export interface PowerballState {
  selectedNumbers: number[];
  powerball: number | null;
  ticketCount: number;
  tickets: PowerballTicket[];
  currentJackpot: number;
  lastDraw: DrawResult | null;
  drawHistory: DrawResult[];
  isDrawing: boolean;
  countdown: { hours: number; minutes: number; seconds: number };
  totalTicketsSold: number;
  playMode: PlayMode;
  hasDoublePlayNFT: boolean;
  hasNoLossNFT: boolean;
  noLossPool: number;
  /** true while an on-chain buyTicket tx is pending */
  isBuyingOnChain: boolean;
  /** tx hash of the latest on-chain purchase */
  txHash: string | null;
  /** whether we're operating against the deployed contract */
  onChainMode: boolean;
}

const PRIZE_TIERS = [
  { numbers: 5, powerball: true,  multiplier: 1_000_000, label: 'JACKPOT' },
  { numbers: 5, powerball: false, multiplier: 10_000,    label: '5 NUMBERS' },
  { numbers: 4, powerball: true,  multiplier: 500,       label: '4 + POWERBALL' },
  { numbers: 4, powerball: false, multiplier: 100,       label: '4 NUMBERS' },
  { numbers: 3, powerball: true,  multiplier: 100,       label: '3 + POWERBALL' },
  { numbers: 3, powerball: false, multiplier: 7,         label: '3 NUMBERS' },
  { numbers: 2, powerball: true,  multiplier: 7,         label: '2 + POWERBALL' },
  { numbers: 1, powerball: true,  multiplier: 4,         label: '1 + POWERBALL' },
  { numbers: 0, powerball: true,  multiplier: 4,         label: 'POWERBALL ONLY' },
];

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// ════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════

export function usePowerball() {
  const { address, isConnected } = useAccount();
  const isContractDeployed = CONTRACTS.CyberPowerball !== ZERO_ADDRESS;
  const isOnChain = isConnected && isContractDeployed;

  // ── Contract reads (enabled only when on-chain) ─────────────

  const { data: currentRoundId, refetch: refetchRound } = useReadContract({
    address: CONTRACTS.CyberPowerball as `0x${string}`,
    abi: CyberPowerballABI,
    functionName: 'currentRoundId',
    query: { enabled: isOnChain },
  });

  const { data: ticketPriceRaw } = useReadContract({
    address: CONTRACTS.CyberPowerball as `0x${string}`,
    abi: CyberPowerballABI,
    functionName: 'ticketPrice',
    query: { enabled: isOnChain },
  });

  const { data: nextDrawTimeRaw } = useReadContract({
    address: CONTRACTS.CyberPowerball as `0x${string}`,
    abi: CyberPowerballABI,
    functionName: 'nextDrawTime',
    query: { enabled: isOnChain },
  });

  const { data: roundInfo, refetch: refetchRoundInfo } = useReadContract({
    address: CONTRACTS.CyberPowerball as `0x${string}`,
    abi: CyberPowerballABI,
    functionName: 'getRoundInfo',
    args: currentRoundId !== undefined ? [currentRoundId as bigint] : undefined,
    query: { enabled: isOnChain && currentRoundId !== undefined },
  });

  const { data: playerTicketIds, refetch: refetchPlayerTickets } = useReadContract({
    address: CONTRACTS.CyberPowerball as `0x${string}`,
    abi: CyberPowerballABI,
    functionName: 'getPlayerTickets',
    args:
      currentRoundId !== undefined && address
        ? [currentRoundId as bigint, address]
        : undefined,
    query: { enabled: isOnChain && currentRoundId !== undefined && !!address },
  });

  // ── Contract write ──────────────────────────────────────────

  const {
    writeContract,
    data: txHash,
    isPending: isBuyingOnChain,
    reset: resetTx,
  } = useWriteContract();

  // ── Contract events ─────────────────────────────────────────

  useWatchContractEvent({
    address: CONTRACTS.CyberPowerball as `0x${string}`,
    abi: CyberPowerballABI,
    eventName: 'TicketPurchased',
    enabled: isOnChain,
    onLogs() {
      refetchPlayerTickets();
      refetchRoundInfo();
    },
  });

  useWatchContractEvent({
    address: CONTRACTS.CyberPowerball as `0x${string}`,
    abi: CyberPowerballABI,
    eventName: 'DrawCompleted',
    enabled: isOnChain,
    onLogs(logs) {
      for (const log of logs) {
        const args = (log as any).args;
        if (!args) continue;
        const winningNumbers = Array.from(args.winningMainNumbers as number[]);
        const winningPowerball = Number(args.winningPowerball);

        setState(prev => {
          const newDraw: DrawResult = {
            id: `draw-${args.roundId?.toString() ?? Date.now()}`,
            numbers: winningNumbers,
            powerball: winningPowerball,
            timestamp: new Date(),
            jackpot: prev.currentJackpot,
          };
          return {
            ...prev,
            isDrawing: false,
            lastDraw: newDraw,
            drawHistory: [newDraw, ...prev.drawHistory].slice(0, 10),
            countdown: { hours: 23, minutes: 59, seconds: 59 },
          };
        });
      }
      refetchRound();
      refetchRoundInfo();
      refetchPlayerTickets();
    },
  });

  useWatchContractEvent({
    address: CONTRACTS.CyberPowerball as `0x${string}`,
    abi: CyberPowerballABI,
    eventName: 'PrizeClaimed',
    enabled: isOnChain,
    onLogs() {
      refetchPlayerTickets();
    },
  });

  // ── Derived on-chain data ───────────────────────────────────

  const onChainJackpot = useMemo(() => {
    if (!roundInfo) return undefined;
    const info = roundInfo as any;
    const prizePool = info[4] ?? info.prizePool;
    return prizePool ? Number(formatEther(prizePool as bigint)) : undefined;
  }, [roundInfo]);

  const onChainTicketCount = useMemo(() => {
    if (!roundInfo) return undefined;
    const info = roundInfo as any;
    const count = info[5] ?? info.ticketCount;
    return count !== undefined ? Number(count) : undefined;
  }, [roundInfo]);

  // ── Local state (UI + simulation fallback) ──────────────────

  const [state, setState] = useState<PowerballState>({
    selectedNumbers: [],
    powerball: null,
    ticketCount: 1,
    tickets: [],
    currentJackpot: 247.85,
    lastDraw: null,
    drawHistory: [],
    isDrawing: false,
    countdown: { hours: 12, minutes: 34, seconds: 56 },
    totalTicketsSold: 4892,
    playMode: 'standard',
    hasDoublePlayNFT: true,
    hasNoLossNFT: true,
    noLossPool: 3.42,
    isBuyingOnChain: false,
    txHash: null,
    onChainMode: false,
  });

  // Sync on-chain values into local state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      onChainMode: isOnChain,
      isBuyingOnChain,
      txHash: txHash ?? null,
      ...(onChainJackpot !== undefined ? { currentJackpot: onChainJackpot } : {}),
      ...(onChainTicketCount !== undefined ? { totalTicketsSold: onChainTicketCount } : {}),
    }));
  }, [isOnChain, isBuyingOnChain, txHash, onChainJackpot, onChainTicketCount]);

  // ── Countdown timer ─────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        // When on-chain, derive from nextDrawTime
        if (nextDrawTimeRaw && isOnChain) {
          const target = Number(nextDrawTimeRaw) * 1000;
          const diff = Math.max(0, target - Date.now());
          const totalSec = Math.floor(diff / 1000);
          return {
            ...prev,
            countdown: {
              hours: Math.floor(totalSec / 3600),
              minutes: Math.floor((totalSec % 3600) / 60),
              seconds: totalSec % 60,
            },
          };
        }
        // Simulation countdown
        let { hours, minutes, seconds } = prev.countdown;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { ...prev, countdown: { hours, minutes, seconds } };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrawTimeRaw, isOnChain]);

  // ── UI selection actions (always local) ─────────────────────

  const toggleNumber = useCallback((num: number) => {
    setState(prev => {
      if (prev.selectedNumbers.includes(num)) {
        return { ...prev, selectedNumbers: prev.selectedNumbers.filter(n => n !== num) };
      }
      if (prev.selectedNumbers.length < 5) {
        return { ...prev, selectedNumbers: [...prev.selectedNumbers, num].sort((a, b) => a - b) };
      }
      return prev;
    });
  }, []);

  const togglePowerball = useCallback((num: number) => {
    setState(prev => ({
      ...prev,
      powerball: prev.powerball === num ? null : num,
    }));
  }, []);

  const setTicketCount = useCallback((count: number) => {
    setState(prev => ({ ...prev, ticketCount: count }));
  }, []);

  const quickPick = useCallback(() => {
    const shuffled = Array.from({ length: 69 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setState(prev => ({
      ...prev,
      selectedNumbers: shuffled.slice(0, 5).sort((a, b) => a - b),
      powerball: Math.floor(Math.random() * 26) + 1,
    }));
  }, []);

  const fillRemaining = useCallback(() => {
    setState(prev => {
      if (prev.selectedNumbers.length >= 5) return prev;
      const remaining = 5 - prev.selectedNumbers.length;
      const available = Array.from({ length: 69 }, (_, i) => i + 1)
        .filter(n => !prev.selectedNumbers.includes(n))
        .sort(() => Math.random() - 0.5);
      const newNumbers = [...prev.selectedNumbers, ...available.slice(0, remaining)].sort(
        (a, b) => a - b,
      );
      const newPowerball = prev.powerball ?? Math.floor(Math.random() * 26) + 1;
      return { ...prev, selectedNumbers: newNumbers, powerball: newPowerball };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedNumbers: [], powerball: null }));
  }, []);

  const setPlayMode = useCallback((mode: PlayMode) => {
    setState(prev => ({ ...prev, playMode: mode }));
  }, []);

  // ── Buy tickets ─────────────────────────────────────────────

  const buyTickets = useCallback(() => {
    if (state.selectedNumbers.length !== 5 || state.powerball === null) return;

    // ▸▸ ON-CHAIN: send tx to CyberPowerball contract
    if (isOnChain) {
      const price = ticketPriceRaw
        ? (ticketPriceRaw as bigint)
        : parseEther('0.01');

      writeContract({
        address: CONTRACTS.CyberPowerball as `0x${string}`,
        abi: CyberPowerballABI,
        functionName: 'buyTicket',
        args: [
          state.selectedNumbers as unknown as readonly [number, number, number, number, number],
          state.powerball,
        ],
        value: price,
      });

      // Clear selection after initiating tx
      setState(prev => ({ ...prev, selectedNumbers: [], powerball: null }));
      return;
    }

    // ▸▸ SIMULATION fallback (unchanged original logic)
    setState(prev => {
      if (prev.selectedNumbers.length !== 5 || prev.powerball === null) return prev;

      const isNoLoss = prev.playMode === 'no-loss' && prev.hasNoLossNFT;
      const isDoublePlay = prev.playMode === 'double-play' && prev.hasDoublePlayNFT;

      const newTickets: PowerballTicket[] = [];
      for (let i = 0; i < prev.ticketCount; i++) {
        newTickets.push({
          id: `ticket-${Date.now()}-${i}`,
          numbers: [...prev.selectedNumbers],
          powerball: prev.powerball!,
          timestamp: new Date(),
          cost: 0.01,
          matchedNumbers: 0,
          matchedPowerball: false,
          prize: 0,
          playMode: prev.playMode,
          drawRound: 1,
          principalRedeemable: isNoLoss,
        });
        if (isDoublePlay) {
          newTickets.push({
            id: `ticket-${Date.now()}-${i}-r2`,
            numbers: [...prev.selectedNumbers],
            powerball: prev.powerball!,
            timestamp: new Date(),
            cost: 0,
            matchedNumbers: 0,
            matchedPowerball: false,
            prize: 0,
            playMode: 'double-play',
            drawRound: 2,
            principalRedeemable: false,
          });
        }
      }

      const jackpotIncrease = isNoLoss ? 0 : 0.01 * prev.ticketCount * 0.5;
      const noLossIncrease = isNoLoss ? 0.01 * prev.ticketCount : 0;

      return {
        ...prev,
        tickets: [...newTickets, ...prev.tickets],
        selectedNumbers: [],
        powerball: null,
        totalTicketsSold: prev.totalTicketsSold + prev.ticketCount,
        currentJackpot: prev.currentJackpot + jackpotIncrease,
        noLossPool: prev.noLossPool + noLossIncrease,
      };
    });
  }, [state.selectedNumbers, state.powerball, isOnChain, ticketPriceRaw, writeContract]);

  // ── Claim prize (on-chain only) ─────────────────────────────

  const claimPrize = useCallback(
    (ticketId: bigint) => {
      if (!isOnChain) return;
      writeContract({
        address: CONTRACTS.CyberPowerball as `0x${string}`,
        abi: CyberPowerballABI,
        functionName: 'claimPrize',
        args: [ticketId],
      });
    },
    [isOnChain, writeContract],
  );

  // ── Simulate draw (local fallback only) ─────────────────────

  const calculatePrize = useCallback(
    (matchedNumbers: number, matchedPowerball: boolean, jackpot: number) => {
      for (const tier of PRIZE_TIERS) {
        if (
          matchedNumbers >= tier.numbers &&
          (tier.powerball === matchedPowerball || !tier.powerball)
        ) {
          if (tier.numbers === 5 && tier.powerball) return { prize: jackpot, tier: tier.label };
          return { prize: 0.01 * tier.multiplier, tier: tier.label };
        }
      }
      return { prize: 0, tier: 'NO MATCH' };
    },
    [],
  );

  const simulateDraw = useCallback(() => {
    // On-chain: draws are triggered by Chainlink Automation, not manually
    if (isOnChain) return;

    setState(prev => ({ ...prev, isDrawing: true }));

    setTimeout(() => {
      const winningNumbers = Array.from({ length: 69 }, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .sort((a, b) => a - b);
      const winningPowerball = Math.floor(Math.random() * 26) + 1;

      const winningNumbers2 = Array.from({ length: 69 }, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .sort((a, b) => a - b);
      const winningPowerball2 = Math.floor(Math.random() * 26) + 1;

      const newDraw: DrawResult = {
        id: `draw-${Date.now()}`,
        numbers: winningNumbers,
        powerball: winningPowerball,
        timestamp: new Date(),
        jackpot: 0,
      };

      setState(prev => {
        newDraw.jackpot = prev.currentJackpot;

        const updatedTickets = prev.tickets.map(ticket => {
          const drawNumbers = ticket.drawRound === 2 ? winningNumbers2 : winningNumbers;
          const drawPowerball = ticket.drawRound === 2 ? winningPowerball2 : winningPowerball;
          const matchedNumbers = ticket.numbers.filter(n => drawNumbers.includes(n)).length;
          const matchedPowerball = ticket.powerball === drawPowerball;
          const jackpotForCalc =
            ticket.playMode === 'no-loss' ? prev.noLossPool : prev.currentJackpot;
          const { prize } = calculatePrize(matchedNumbers, matchedPowerball, jackpotForCalc);
          return { ...ticket, matchedNumbers, matchedPowerball, prize };
        });

        const jackpotWon = updatedTickets.some(
          t => t.matchedNumbers === 5 && t.matchedPowerball && t.playMode !== 'no-loss',
        );
        const yieldGain = prev.noLossPool * 0.003;

        return {
          ...prev,
          isDrawing: false,
          lastDraw: newDraw,
          drawHistory: [newDraw, ...prev.drawHistory].slice(0, 10),
          tickets: updatedTickets,
          currentJackpot: jackpotWon ? 10 : prev.currentJackpot * 1.1,
          countdown: { hours: 23, minutes: 59, seconds: 59 },
          noLossPool: prev.noLossPool + yieldGain,
        };
      });
    }, 3000);
  }, [isOnChain, calculatePrize]);

  // ── Return value (preserves interface for PowerballGame.tsx) ─

  const isComplete = state.selectedNumbers.length === 5 && state.powerball !== null;

  return {
    state,
    actions: {
      toggleNumber,
      togglePowerball,
      setTicketCount,
      quickPick,
      fillRemaining,
      clearSelection,
      buyTickets,
      simulateDraw,
      setPlayMode,
      claimPrize,
    },
    isComplete,
    prizeTiers: PRIZE_TIERS,
  };
}
