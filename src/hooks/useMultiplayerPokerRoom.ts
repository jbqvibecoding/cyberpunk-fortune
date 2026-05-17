import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  RoomState, RoomAction, createWaitingState,
  addPlayer, removePlayer, startHand, applyAction,
} from '@/lib/poker/multiplayerEngine';
import type { RealtimeChannel } from '@supabase/supabase-js';

function getOrCreateIdentity(): { id: string; name: string } {
  const stored = localStorage.getItem('poker_identity');
  if (stored) return JSON.parse(stored);
  const id = crypto.randomUUID();
  const name = `Player-${id.slice(0, 4).toUpperCase()}`;
  const identity = { id, name };
  localStorage.setItem('poker_identity', JSON.stringify(identity));
  return identity;
}

function setIdentityName(name: string) {
  const id = getOrCreateIdentity().id;
  localStorage.setItem('poker_identity', JSON.stringify({ id, name }));
}

export interface UseRoomResult {
  identity: { id: string; name: string };
  setName: (n: string) => void;
  roomCode: string | null;
  state: RoomState;
  isHost: boolean;
  connected: boolean;
  presentIds: string[];
  createRoom: () => string;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  startHand: () => void;
  nextHand: () => void;
  act: (action: RoomAction, amount?: number) => void;
}

export function useMultiplayerPokerRoom(): UseRoomResult {
  const [identity, setIdentity] = useState(() => getOrCreateIdentity());
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [state, setState] = useState<RoomState>(createWaitingState());
  const [connected, setConnected] = useState(false);
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const isHost = presentIds.length > 0 && presentIds[0] === identity.id;
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const broadcastState = useCallback((s: RoomState) => {
    channelRef.current?.send({ type: 'broadcast', event: 'state', payload: s });
  }, []);

  const updateState = useCallback((updater: (s: RoomState) => RoomState) => {
    if (!isHostRef.current) return;
    const next = updater(stateRef.current);
    if (next === stateRef.current) return;
    setState(next);
    broadcastState(next);
  }, [broadcastState]);

  const teardown = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setConnected(false);
    setPresentIds([]);
  }, []);

  const connect = useCallback((code: string) => {
    teardown();
    const channel = supabase.channel(`poker-room-${code}`, {
      config: { presence: { key: identity.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState() as Record<string, { id: string; name: string }[]>;
      const entries = Object.values(presenceState).flat();
      // sort by join order (use id sort as deterministic host election)
      const ids = entries.map(e => e.id).sort();
      setPresentIds(ids);

      // Host responsibility: ensure all present users are in state
      const amHost = ids[0] === identity.id;
      if (amHost) {
        const current = stateRef.current;
        const knownIds = new Set(current.players.map(p => p.id));
        const missing = entries.filter(e => !knownIds.has(e.id));
        if (missing.length && current.phase === 'waiting') {
          let next = current;
          for (const m of missing) next = addPlayer(next, m.id, m.name);
          setState(next);
          broadcastState(next);
        }
      }
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const amHost = isHostRef.current;
      if (!amHost) return;
      const current = stateRef.current;
      if (current.phase !== 'waiting') return;
      let next = current;
      for (const p of leftPresences as unknown as { id: string }[]) {
        next = removePlayer(next, p.id);
      }
      if (next !== current) {
        setState(next);
        broadcastState(next);
      }
    });

    channel.on('broadcast', { event: 'state' }, ({ payload }) => {
      const incoming = payload as RoomState;
      if (incoming.version >= stateRef.current.version) setState(incoming);
    });

    channel.on('broadcast', { event: 'action' }, ({ payload }) => {
      if (!isHostRef.current) return;
      const { playerId, action, amount } = payload as { playerId: string; action: RoomAction; amount?: number };
      const next = applyAction(stateRef.current, playerId, action, amount);
      if (next !== stateRef.current) {
        setState(next);
        broadcastState(next);
      }
    });

    channel.on('broadcast', { event: 'request-state' }, () => {
      if (isHostRef.current) broadcastState(stateRef.current);
    });

    channel.on('broadcast', { event: 'control' }, ({ payload }) => {
      if (!isHostRef.current) return;
      const { command } = payload as { command: 'start' | 'next' };
      if (command === 'start' || command === 'next') {
        const next = startHand(stateRef.current);
        if (next !== stateRef.current) {
          setState(next);
          broadcastState(next);
        }
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ id: identity.id, name: identity.name });
        setConnected(true);
        // Request current state in case room already exists
        setTimeout(() => {
          channel.send({ type: 'broadcast', event: 'request-state', payload: {} });
        }, 300);
      }
    });

    channelRef.current = channel;
  }, [identity.id, identity.name, broadcastState, teardown]);

  const createRoom = useCallback(() => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoomCode(code);
    const initial = addPlayer(createWaitingState(), identity.id, identity.name);
    setState(initial);
    connect(code);
    return code;
  }, [identity.id, identity.name, connect]);

  const joinRoom = useCallback((code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setRoomCode(c);
    setState(createWaitingState());
    connect(c);
  }, [connect]);

  const leaveRoom = useCallback(() => {
    teardown();
    setRoomCode(null);
    setState(createWaitingState());
  }, [teardown]);

  const startHandAction = useCallback(() => {
    if (isHostRef.current) {
      updateState(s => startHand(s));
    } else {
      channelRef.current?.send({ type: 'broadcast', event: 'control', payload: { command: 'start' } });
    }
  }, [updateState]);

  const act = useCallback((action: RoomAction, amount?: number) => {
    if (isHostRef.current) {
      updateState(s => applyAction(s, identity.id, action, amount));
    } else {
      channelRef.current?.send({
        type: 'broadcast', event: 'action',
        payload: { playerId: identity.id, action, amount },
      });
    }
  }, [identity.id, updateState]);

  const setName = useCallback((n: string) => {
    setIdentityName(n);
    setIdentity({ id: identity.id, name: n });
  }, [identity.id]);

  useEffect(() => () => teardown(), [teardown]);

  return {
    identity,
    setName,
    roomCode,
    state,
    isHost,
    connected,
    presentIds,
    createRoom,
    joinRoom,
    leaveRoom,
    startHand: startHandAction,
    nextHand: startHandAction,
    act,
  };
}
