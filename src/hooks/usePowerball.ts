import { useState, useCallback, useEffect } from 'react';

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
  drawRound: number; // 1 = primary, 2 = second (double-play)
  principalRedeemable: boolean; // for no-loss tickets
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
  noLossPool: number; // DeFi yield pool balance
}

const PRIZE_TIERS = [
  { numbers: 5, powerball: true, multiplier: 1000000, label: 'JACKPOT' },
  { numbers: 5, powerball: false, multiplier: 10000, label: '5 NUMBERS' },
  { numbers: 4, powerball: true, multiplier: 500, label: '4 + POWERBALL' },
  { numbers: 4, powerball: false, multiplier: 100, label: '4 NUMBERS' },
  { numbers: 3, powerball: true, multiplier: 100, label: '3 + POWERBALL' },
  { numbers: 3, powerball: false, multiplier: 7, label: '3 NUMBERS' },
  { numbers: 2, powerball: true, multiplier: 7, label: '2 + POWERBALL' },
  { numbers: 1, powerball: true, multiplier: 4, label: '1 + POWERBALL' },
  { numbers: 0, powerball: true, multiplier: 4, label: 'POWERBALL ONLY' },
];

export function usePowerball() {
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
    hasDoublePlayNFT: true, // Simulated: true for demo
    hasNoLossNFT: true, // Simulated: true for demo
    noLossPool: 3.42, // Simulated DeFi yield pool
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        let { hours, minutes, seconds } = prev.countdown;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { ...prev, countdown: { hours, minutes, seconds } };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleNumber = useCallback((num: number) => {
    setState(prev => {
      if (prev.selectedNumbers.includes(num)) {
        return { ...prev, selectedNumbers: prev.selectedNumbers.filter(n => n !== num) };
      } else if (prev.selectedNumbers.length < 5) {
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
      
      return {
        ...prev,
        selectedNumbers: newNumbers,
        powerball: newPowerball,
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedNumbers: [], powerball: null }));
  }, []);

  const setPlayMode = useCallback((mode: PlayMode) => {
    setState(prev => ({ ...prev, playMode: mode }));
  }, []);

  const buyTickets = useCallback(() => {
    setState(prev => {
      if (prev.selectedNumbers.length !== 5 || prev.powerball === null) return prev;

      const isNoLoss = prev.playMode === 'no-loss' && prev.hasNoLossNFT;
      const isDoublePlay = prev.playMode === 'double-play' && prev.hasDoublePlayNFT;

      const newTickets: PowerballTicket[] = [];
      for (let i = 0; i < prev.ticketCount; i++) {
        // Primary ticket (draw round 1)
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

        // Double Play: add a second-round ticket with same numbers
        if (isDoublePlay) {
          newTickets.push({
            id: `ticket-${Date.now()}-${i}-r2`,
            numbers: [...prev.selectedNumbers],
            powerball: prev.powerball!,
            timestamp: new Date(),
            cost: 0, // No extra cost for second round
            matchedNumbers: 0,
            matchedPowerball: false,
            prize: 0,
            playMode: 'double-play',
            drawRound: 2,
            principalRedeemable: false,
          });
        }
      }

      // NoLoss: principal goes to DeFi yield pool, not jackpot
      const jackpotIncrease = isNoLoss
        ? 0
        : 0.01 * prev.ticketCount * 0.5;
      const noLossIncrease = isNoLoss
        ? 0.01 * prev.ticketCount
        : 0;

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
  }, []);

  const calculatePrize = useCallback((matchedNumbers: number, matchedPowerball: boolean, jackpot: number): { prize: number; tier: string } => {
    for (const tier of PRIZE_TIERS) {
      if (matchedNumbers >= tier.numbers && (tier.powerball === matchedPowerball || !tier.powerball)) {
        if (tier.numbers === 5 && tier.powerball) {
          return { prize: jackpot, tier: tier.label };
        }
        return { prize: 0.01 * tier.multiplier, tier: tier.label };
      }
    }
    return { prize: 0, tier: 'NO MATCH' };
  }, []);

  const simulateDraw = useCallback(() => {
    setState(prev => ({ ...prev, isDrawing: true }));

    // Simulate VRF delay
    setTimeout(() => {
      const winningNumbers = Array.from({ length: 69 }, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .sort((a, b) => a - b);
      const winningPowerball = Math.floor(Math.random() * 26) + 1;

      // Generate a second set of winning numbers for double-play round 2
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
        jackpot: state.currentJackpot,
      };

      setState(prev => {
        // Check tickets against draw
        const updatedTickets = prev.tickets.map(ticket => {
          // Round 2 tickets use the second set of winning numbers
          const drawNumbers = ticket.drawRound === 2 ? winningNumbers2 : winningNumbers;
          const drawPowerball = ticket.drawRound === 2 ? winningPowerball2 : winningPowerball;

          const matchedNumbers = ticket.numbers.filter(n => drawNumbers.includes(n)).length;
          const matchedPowerball = ticket.powerball === drawPowerball;

          // NoLoss tickets win from the interest pool, not the main jackpot
          const jackpotForCalc = ticket.playMode === 'no-loss'
            ? prev.noLossPool
            : prev.currentJackpot;
          const { prize } = calculatePrize(matchedNumbers, matchedPowerball, jackpotForCalc);

          return {
            ...ticket,
            matchedNumbers,
            matchedPowerball,
            prize,
          };
        });

        const jackpotWon = updatedTickets.some(
          t => t.matchedNumbers === 5 && t.matchedPowerball && t.playMode !== 'no-loss'
        );

        // Simulate DeFi yield: noLossPool grows slightly each draw
        const yieldGain = prev.noLossPool * 0.003; // ~0.3% per draw cycle

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
  }, [calculatePrize, state.currentJackpot]);

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
    },
    isComplete,
    prizeTiers: PRIZE_TIERS,
  };
}
