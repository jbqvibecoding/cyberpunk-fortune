import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, ZERO_ADDRESS } from '@/lib/contracts/addresses';
import { SimpleLotteryABI } from '@/lib/contracts/SimpleLotteryABI';
import { GameNFTABI } from '@/lib/contracts/GameNFTABI';
import { sepolia } from 'wagmi/chains';

// ════════════════════════════════════════════════════════════════
// Types (consumed by PowerballGame.tsx)
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
  isBuyingOnChain: boolean;
  txHash: string | null;
  onChainMode: boolean;
  randomnessProof: string | null;
  vrfPending: boolean;
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

// ════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════

export function usePowerball() {
  const { address, isConnected } = useAccount();
  const isContractDeployed = CONTRACTS.SimpleLottery !== ZERO_ADDRESS;
  const isOnChain = isConnected && isContractDeployed;

  // ── Contract reads ──────────────────────────────────────────

  const { data: currentRoundId, refetch: refetchRound } = useReadContract({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    functionName: 'currentRoundId',
    query: { enabled: isOnChain },
  });

  const { data: ticketPriceRaw } = useReadContract({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    functionName: 'ticketPrice',
    query: { enabled: isOnChain },
  });

  const { data: nextDrawTimeRaw } = useReadContract({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    functionName: 'nextDrawTime',
    query: { enabled: isOnChain },
  });

  const { data: totalTicketsRaw } = useReadContract({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    functionName: 'totalTickets',
    query: { enabled: isOnChain },
  });

  const { data: vrfPendingRaw } = useReadContract({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    functionName: 'vrfPending',
    query: { enabled: isOnChain },
  });

  const { data: roundInfo, refetch: refetchRoundInfo } = useReadContract({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    functionName: 'getRoundInfo',
    args: currentRoundId !== undefined ? [currentRoundId as bigint] : undefined,
    query: { enabled: isOnChain && currentRoundId !== undefined },
  });

  const { data: playerTicketIds, refetch: refetchPlayerTickets } = useReadContract({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    functionName: 'getPlayerTickets',
    args:
      currentRoundId !== undefined && address
        ? [currentRoundId as bigint, address]
        : undefined,
    query: { enabled: isOnChain && currentRoundId !== undefined && !!address },
  });

  // ── NFT Pass ownership checks ───────────────────────────────

  const isNFTDeployed = CONTRACTS.GameNFT !== ZERO_ADDRESS;

  const { data: hasDoublePlayNFT } = useReadContract({
    address: CONTRACTS.GameNFT,
    abi: GameNFTABI,
    functionName: 'hasNFTType',
    args: address ? [address, 0] : undefined,
    chainId: sepolia.id,
    query: { enabled: isNFTDeployed && !!address, refetchInterval: 5000 },
  });

  const { data: hasNoLossNFT } = useReadContract({
    address: CONTRACTS.GameNFT,
    abi: GameNFTABI,
    functionName: 'hasNFTType',
    args: address ? [address, 1] : undefined,
    chainId: sepolia.id,
    query: { enabled: isNFTDeployed && !!address, refetchInterval: 5000 },
  });

  // localStorage fallback for NFT ownership
  const localNFT = useMemo(() => {
    if (!address) return { doublePlay: false, noLoss: false };
    try {
      const raw = localStorage.getItem(`pioneer_nft_owned_${address.toLowerCase()}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { doublePlay: false, noLoss: false };
  }, [address]);

  // ── Contract write ──────────────────────────────────────────

  const {
    writeContract,
    data: txHash,
    isPending: isBuyingOnChain,
    reset: resetTx,
  } = useWriteContract();

  // ── Contract events ─────────────────────────────────────────

  useWatchContractEvent({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    eventName: 'TicketPurchased',
    enabled: isOnChain,
    onLogs(logs) {
      for (const log of logs) {
        const args = (log as any).args;
        if (!args) continue;
        // Only add own tickets to local state
        if (args.player?.toLowerCase() !== address?.toLowerCase()) continue;

        const mainNumbers = Array.from(args.mainNumbers as number[]).map(Number);
        const powerball = Number(args.powerball);
        const ticketId = args.ticketId !== undefined ? Number(args.ticketId) : Date.now();

        const newTicket: PowerballTicket = {
          id: `ticket-${ticketId}`,
          numbers: mainNumbers,
          powerball,
          timestamp: new Date(),
          cost: 0.001,
          matchedNumbers: 0,
          matchedPowerball: false,
          prize: 0,
          playMode: 'standard',
          drawRound: args.roundId !== undefined ? Number(args.roundId) : 1,
          principalRedeemable: false,
        };

        setState(prev => {
          // Avoid duplicates
          if (prev.tickets.some(t => t.id === newTicket.id)) return prev;
          return {
            ...prev,
            tickets: [newTicket, ...prev.tickets],
            totalTicketsSold: prev.totalTicketsSold + 1,
            currentJackpot: prev.currentJackpot + 0.001 * 0.98 * 0.5,
          };
        });
      }
      refetchPlayerTickets();
      refetchRoundInfo();
    },
  });

  useWatchContractEvent({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
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
            countdown: { hours: 0, minutes: 5, seconds: 0 },
          };
        });
      }
      refetchRound();
      refetchRoundInfo();
      refetchPlayerTickets();
    },
  });

  useWatchContractEvent({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
    eventName: 'RandomnessRevealed',
    enabled: isOnChain,
    onLogs(logs) {
      for (const log of logs) {
        const args = (log as any).args;
        if (!args) continue;
        setState(prev => ({
          ...prev,
          randomnessProof: args.randomnessProof as string,
        }));
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACTS.SimpleLottery,
    abi: SimpleLotteryABI,
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
    if (totalTicketsRaw !== undefined) return Number(totalTicketsRaw);
    if (!roundInfo) return undefined;
    const info = roundInfo as any;
    const count = info[5] ?? info.ticketCount;
    return count !== undefined ? Number(count) : undefined;
  }, [roundInfo, totalTicketsRaw]);

  const onChainRandomnessProof = useMemo(() => {
    if (!roundInfo) return null;
    const info = roundInfo as any;
    const proof = info[9] ?? info.randomnessProof;
    if (!proof || proof === '0x0000000000000000000000000000000000000000000000000000000000000000') return null;
    return proof as string;
  }, [roundInfo]);

  // ── Local state ─────────────────────────────────────────────

  const [state, setState] = useState<PowerballState>({
    selectedNumbers: [],
    powerball: null,
    ticketCount: 1,
    tickets: [],
    currentJackpot: 0,
    lastDraw: null,
    drawHistory: [],
    isDrawing: false,
    countdown: { hours: 0, minutes: 5, seconds: 0 },
    totalTicketsSold: 0,
    playMode: 'standard',
    hasDoublePlayNFT: false,
    hasNoLossNFT: false,
    noLossPool: 0,
    isBuyingOnChain: false,
    txHash: null,
    onChainMode: false,
    randomnessProof: null,
    vrfPending: false,
  });

  // Sync on-chain values into local state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      onChainMode: isOnChain,
      isBuyingOnChain,
      txHash: txHash ?? null,
      vrfPending: vrfPendingRaw ? Boolean(vrfPendingRaw) : false,
      ...(onChainJackpot !== undefined ? { currentJackpot: onChainJackpot } : {}),
      ...(onChainTicketCount !== undefined ? { totalTicketsSold: onChainTicketCount } : {}),
      ...(onChainRandomnessProof ? { randomnessProof: onChainRandomnessProof } : {}),
      hasDoublePlayNFT: hasDoublePlayNFT === true || localNFT.doublePlay,
      hasNoLossNFT: hasNoLossNFT === true || localNFT.noLoss,
    }));
  }, [isOnChain, isBuyingOnChain, txHash, onChainJackpot, onChainTicketCount, onChainRandomnessProof, vrfPendingRaw, hasDoublePlayNFT, hasNoLossNFT, localNFT]);

  // ── Countdown timer ─────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
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
        let { hours, minutes, seconds } = prev.countdown;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 0; minutes = 5; seconds = 0; }
        return { ...prev, countdown: { hours, minutes, seconds } };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrawTimeRaw, isOnChain]);

  // ── UI selection actions ────────────────────────────────────

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
      const newNumbers = [...prev.selectedNumbers, ...available.slice(0, remaining)].sort((a, b) => a - b);
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

    // ON-CHAIN: send tx to SimpleLottery contract
    if (isOnChain) {
      const price = ticketPriceRaw
        ? (ticketPriceRaw as bigint)
        : parseEther('0.001');

      writeContract({
        address: CONTRACTS.SimpleLottery,
        abi: SimpleLotteryABI,
        functionName: 'buyTicket',
        args: [
          state.selectedNumbers as unknown as readonly [number, number, number, number, number],
          state.powerball,
        ],
        value: price,
      });

      setState(prev => ({ ...prev, selectedNumbers: [], powerball: null }));
      return;
    }

    // SIMULATION fallback
    setState(prev => {
      if (prev.selectedNumbers.length !== 5 || prev.powerball === null) return prev;

      const newTickets: PowerballTicket[] = [];
      for (let i = 0; i < prev.ticketCount; i++) {
        newTickets.push({
          id: `ticket-${Date.now()}-${i}`,
          numbers: [...prev.selectedNumbers],
          powerball: prev.powerball!,
          timestamp: new Date(),
          cost: 0.001,
          matchedNumbers: 0,
          matchedPowerball: false,
          prize: 0,
          playMode: prev.playMode,
          drawRound: 1,
          principalRedeemable: false,
        });
      }

      return {
        ...prev,
        tickets: [...newTickets, ...prev.tickets],
        selectedNumbers: [],
        powerball: null,
        totalTicketsSold: prev.totalTicketsSold + prev.ticketCount,
        currentJackpot: prev.currentJackpot + 0.001 * prev.ticketCount * 0.5,
      };
    });
  }, [state.selectedNumbers, state.powerball, isOnChain, ticketPriceRaw, writeContract]);

  // ── Claim prize ─────────────────────────────────────────────

  const claimPrize = useCallback(
    (ticketId: bigint) => {
      if (!isOnChain) return;
      writeContract({
        address: CONTRACTS.SimpleLottery,
        abi: SimpleLotteryABI,
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
        if (matchedNumbers >= tier.numbers && (tier.powerball === matchedPowerball || !tier.powerball)) {
          if (tier.numbers === 5 && tier.powerball) return { prize: jackpot, tier: tier.label };
          return { prize: 0.001 * tier.multiplier, tier: tier.label };
        }
      }
      return { prize: 0, tier: 'NO MATCH' };
    },
    [],
  );

  const simulateDraw = useCallback(() => {
    // Simulate draw works in both modes for demo purposes
    setState(prev => ({ ...prev, isDrawing: true }));

    setTimeout(() => {
      const winningNumbers = Array.from({ length: 69 }, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .sort((a, b) => a - b);
      const winningPowerball = Math.floor(Math.random() * 26) + 1;

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
          const matchedNumbers = ticket.numbers.filter(n => winningNumbers.includes(n)).length;
          const matchedPowerball = ticket.powerball === winningPowerball;
          const { prize } = calculatePrize(matchedNumbers, matchedPowerball, prev.currentJackpot);
          return { ...ticket, matchedNumbers, matchedPowerball, prize };
        });

        const jackpotWon = updatedTickets.some(t => t.matchedNumbers === 5 && t.matchedPowerball);
        return {
          ...prev,
          isDrawing: false,
          lastDraw: newDraw,
          drawHistory: [newDraw, ...prev.drawHistory].slice(0, 10),
          tickets: updatedTickets,
          currentJackpot: jackpotWon ? 0.01 : prev.currentJackpot * 1.1,
          countdown: { hours: 0, minutes: 5, seconds: 0 },
          randomnessProof: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        };
      });
    }, 3000);
  }, [calculatePrize]);

  // ── Return ──────────────────────────────────────────────────

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
