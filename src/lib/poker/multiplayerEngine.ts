import { Card } from './types';
import { createDeck, shuffleDeck } from './deck';
import { evaluateHand, compareHands } from './handEvaluator';

export type RoomPhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type RoomAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface RoomPlayer {
  id: string;
  name: string;
  seat: number;
  chips: number;
  cards: Card[];
  currentBet: number;
  totalBet: number;
  hasFolded: boolean;
  hasActed: boolean;
  isAllIn: boolean;
  lastAction?: RoomAction;
  lastAmount?: number;
}

export interface RoomState {
  version: number;
  phase: RoomPhase;
  players: RoomPlayer[];
  community: Card[];
  deck: Card[];
  pot: number;
  currentBet: number;
  minRaise: number;
  turnSeat: number;
  dealerSeat: number;
  smallBlind: number;
  bigBlind: number;
  winners: { id: string; name: string; amount: number; description?: string }[];
  log: string[];
  turnDeadline: number; // epoch ms; 0 when no active turn
}

const START_CHIPS = 1000;
const SB = 10;
const BB = 20;
export const TURN_MS = 30000;

function withDeadline<T extends RoomState>(s: T, active: boolean): T {
  return { ...s, turnDeadline: active ? Date.now() + TURN_MS : 0 };
}

export function createWaitingState(): RoomState {
  return {
    version: 0,
    phase: 'waiting',
    players: [],
    community: [],
    deck: [],
    pot: 0,
    currentBet: 0,
    minRaise: BB,
    turnSeat: 0,
    dealerSeat: 0,
    smallBlind: SB,
    bigBlind: BB,
    winners: [],
    log: ['Room created. Waiting for players...'],
    turnDeadline: 0,
  };
}

export function addPlayer(state: RoomState, id: string, name: string): RoomState {
  if (state.players.find(p => p.id === id)) return state;
  if (state.phase !== 'waiting') return state;
  const seat = state.players.length;
  const player: RoomPlayer = {
    id, name, seat,
    chips: START_CHIPS,
    cards: [],
    currentBet: 0, totalBet: 0,
    hasFolded: false, hasActed: false, isAllIn: false,
  };
  return {
    ...state,
    version: state.version + 1,
    players: [...state.players, player],
    log: [...state.log, `${name} joined seat ${seat + 1}`].slice(-30),
  };
}

export function removePlayer(state: RoomState, id: string): RoomState {
  if (state.phase !== 'waiting') return state;
  return {
    ...state,
    version: state.version + 1,
    players: state.players.filter(p => p.id !== id).map((p, i) => ({ ...p, seat: i })),
  };
}

export function startHand(state: RoomState): RoomState {
  if (state.players.length < 2) return state;
  const deck = shuffleDeck(createDeck());
  const players = state.players.map(p => ({
    ...p,
    cards: [],
    currentBet: 0,
    totalBet: 0,
    hasFolded: false,
    hasActed: false,
    isAllIn: false,
    lastAction: undefined,
    lastAmount: undefined,
  }));

  let d = [...deck];
  for (let r = 0; r < 2; r++) {
    for (const p of players) {
      p.cards.push(d.shift()!);
    }
  }

  const n = players.length;
  const dealerSeat = (state.dealerSeat + 1) % n;
  const sbSeat = (dealerSeat + 1) % n;
  const bbSeat = (dealerSeat + 2) % n;

  const sb = Math.min(SB, players[sbSeat].chips);
  players[sbSeat].chips -= sb;
  players[sbSeat].currentBet = sb;
  players[sbSeat].totalBet = sb;
  const bb = Math.min(BB, players[bbSeat].chips);
  players[bbSeat].chips -= bb;
  players[bbSeat].currentBet = bb;
  players[bbSeat].totalBet = bb;

  const turnSeat = (bbSeat + 1) % n;

  return withDeadline({
    ...state,
    version: state.version + 1,
    phase: 'preflop' as const,
    players,
    community: [],
    deck: d,
    pot: sb + bb,
    currentBet: bb,
    minRaise: BB,
    turnSeat,
    dealerSeat,
    winners: [],
    log: [...state.log, `--- New hand --- Dealer: ${players[dealerSeat].name}`].slice(-30),
    turnDeadline: 0,
  }, true);
}

function activePlayers(state: RoomState): RoomPlayer[] {
  return state.players.filter(p => !p.hasFolded);
}

function nextSeat(state: RoomState, from: number): number {
  const n = state.players.length;
  for (let i = 1; i <= n; i++) {
    const s = (from + i) % n;
    const p = state.players[s];
    if (!p.hasFolded && !p.isAllIn) return s;
  }
  return from;
}

function bettingRoundComplete(state: RoomState): boolean {
  const active = activePlayers(state);
  if (active.length <= 1) return true;
  const canAct = active.filter(p => !p.isAllIn);
  if (canAct.length === 0) return true;
  return canAct.every(p => p.hasActed && p.currentBet === state.currentBet);
}

function advancePhase(state: RoomState): RoomState {
  let s = { ...state, players: state.players.map(p => ({ ...p, currentBet: 0, hasActed: false })) };
  s.currentBet = 0;
  s.minRaise = state.bigBlind;
  let d = [...s.deck];
  if (s.phase === 'preflop') {
    s.community = [d.shift()!, d.shift()!, d.shift()!];
    s.phase = 'flop';
  } else if (s.phase === 'flop') {
    s.community = [...s.community, d.shift()!];
    s.phase = 'turn';
  } else if (s.phase === 'turn') {
    s.community = [...s.community, d.shift()!];
    s.phase = 'river';
  } else if (s.phase === 'river') {
    s.phase = 'showdown';
    return resolveShowdown(s);
  }
  s.deck = d;
  s.turnSeat = nextSeat(s, s.dealerSeat);
  s.log = [...s.log, `>> ${s.phase.toUpperCase()}`].slice(-30);
  return withDeadline(s, true);
}

function resolveShowdown(state: RoomState): RoomState {
  const active = activePlayers(state);
  if (active.length === 1) {
    const w = active[0];
    const players = state.players.map(p => p.id === w.id ? { ...p, chips: p.chips + state.pot } : p);
    return {
      ...state,
      players,
      winners: [{ id: w.id, name: w.name, amount: state.pot }],
      pot: 0,
      log: [...state.log, `${w.name} wins ${state.pot} (others folded)`].slice(-30),
      turnDeadline: 0,
    };
  }
  const evaluated = active.map(p => ({ p, hand: evaluateHand(p.cards, state.community) }));
  evaluated.sort((a, b) => compareHands(b.hand, a.hand));
  const best = evaluated[0];
  const winners = evaluated.filter(e => compareHands(e.hand, best.hand) === 0);
  const share = Math.floor(state.pot / winners.length);
  const winnerIds = new Set(winners.map(w => w.p.id));
  const players = state.players.map(p => winnerIds.has(p.id) ? { ...p, chips: p.chips + share } : p);
  return {
    ...state,
    players,
    winners: winners.map(w => ({ id: w.p.id, name: w.p.name, amount: share, description: w.hand.description })),
    pot: 0,
    log: [...state.log, ...winners.map(w => `${w.p.name} wins ${share} — ${w.hand.description}`)].slice(-30),
    turnDeadline: 0,
  };
}

function maybeEndEarly(state: RoomState): RoomState | null {
  const active = activePlayers(state);
  if (active.length === 1) {
    return resolveShowdown({ ...state, phase: 'showdown' });
  }
  return null;
}

export function applyAction(state: RoomState, playerId: string, action: RoomAction, amount?: number): RoomState {
  if (state.phase === 'waiting' || state.phase === 'showdown') return state;
  const idx = state.players.findIndex(p => p.id === playerId);
  if (idx < 0) return state;
  if (idx !== state.turnSeat) return state;
  const players = state.players.map(p => ({ ...p }));
  const p = players[idx];
  if (p.hasFolded || p.isAllIn) return state;

  let pot = state.pot;
  let currentBet = state.currentBet;
  let minRaise = state.minRaise;
  let logMsg = '';

  if (action === 'fold') {
    p.hasFolded = true;
    p.hasActed = true;
    logMsg = `${p.name} folds`;
  } else if (action === 'check') {
    if (p.currentBet !== currentBet) return state;
    p.hasActed = true;
    logMsg = `${p.name} checks`;
  } else if (action === 'call') {
    const toCall = Math.min(currentBet - p.currentBet, p.chips);
    p.chips -= toCall;
    p.currentBet += toCall;
    p.totalBet += toCall;
    pot += toCall;
    if (p.chips === 0) p.isAllIn = true;
    p.hasActed = true;
    logMsg = `${p.name} calls ${toCall}`;
  } else if (action === 'raise') {
    const target = Math.max(amount ?? 0, currentBet + minRaise);
    const need = Math.min(target - p.currentBet, p.chips);
    p.chips -= need;
    p.currentBet += need;
    p.totalBet += need;
    pot += need;
    if (p.chips === 0) p.isAllIn = true;
    const raiseSize = p.currentBet - currentBet;
    if (raiseSize >= minRaise) minRaise = raiseSize;
    currentBet = Math.max(currentBet, p.currentBet);
    players.forEach(pl => { if (pl.id !== p.id && !pl.hasFolded && !pl.isAllIn) pl.hasActed = false; });
    p.hasActed = true;
    logMsg = `${p.name} raises to ${p.currentBet}`;
  } else if (action === 'all-in') {
    const all = p.chips;
    p.currentBet += all;
    p.totalBet += all;
    pot += all;
    p.chips = 0;
    p.isAllIn = true;
    if (p.currentBet > currentBet) {
      const raiseSize = p.currentBet - currentBet;
      if (raiseSize >= minRaise) minRaise = raiseSize;
      currentBet = p.currentBet;
      players.forEach(pl => { if (pl.id !== p.id && !pl.hasFolded && !pl.isAllIn) pl.hasActed = false; });
    }
    p.hasActed = true;
    logMsg = `${p.name} goes all-in (${all})`;
  }
  p.lastAction = action;
  p.lastAmount = amount;

  let next: RoomState = {
    ...state,
    version: state.version + 1,
    players,
    pot,
    currentBet,
    minRaise,
    log: [...state.log, logMsg].slice(-30),
  };

  const early = maybeEndEarly(next);
  if (early) return { ...early, version: next.version };

  if (bettingRoundComplete(next)) {
    return advancePhase(next);
  }

  next.turnSeat = nextSeat(next, idx);
  return withDeadline(next, true);
}
