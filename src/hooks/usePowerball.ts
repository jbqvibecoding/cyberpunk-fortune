import { useState, useCallback, useEffect } from 'react';

export interface PowerballTicket {
  id: string;
  numbers: number[];
  powerball: number;
  timestamp: Date;
  cost: number;
  matchedNumbers: number;
  matchedPowerball: boolean;
  prize: number;
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

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedNumbers: [], powerball: null }));
  }, []);

  const buyTickets = useCallback(() => {
    setState(prev => {
      if (prev.selectedNumbers.length !== 5 || prev.powerball === null) return prev;
      
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
        });
      }
      
      return {
        ...prev,
        tickets: [...newTickets, ...prev.tickets],
        selectedNumbers: [],
        powerball: null,
        totalTicketsSold: prev.totalTicketsSold + prev.ticketCount,
        currentJackpot: prev.currentJackpot + (0.01 * prev.ticketCount * 0.5), // 50% to jackpot
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
          const matchedNumbers = ticket.numbers.filter(n => winningNumbers.includes(n)).length;
          const matchedPowerball = ticket.powerball === winningPowerball;
          const { prize } = calculatePrize(matchedNumbers, matchedPowerball, prev.currentJackpot);
          
          return {
            ...ticket,
            matchedNumbers,
            matchedPowerball,
            prize,
          };
        });

        const jackpotWon = updatedTickets.some(t => t.matchedNumbers === 5 && t.matchedPowerball);

        return {
          ...prev,
          isDrawing: false,
          lastDraw: newDraw,
          drawHistory: [newDraw, ...prev.drawHistory].slice(0, 10),
          tickets: updatedTickets,
          currentJackpot: jackpotWon ? 10 : prev.currentJackpot * 1.1, // Reset or grow jackpot
          countdown: { hours: 23, minutes: 59, seconds: 59 },
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
      clearSelection,
      buyTickets,
      simulateDraw,
    },
    isComplete,
    prizeTiers: PRIZE_TIERS,
  };
}
