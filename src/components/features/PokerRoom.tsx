import { useEffect, useMemo, useState } from 'react';
import { useMultiplayerPokerRoom } from '@/hooks/useMultiplayerPokerRoom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { PlayingCard } from '@/components/games/poker/PlayingCard';
import { Copy, LogOut, Crown, Check, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { RoomPlayer } from '@/lib/poker/multiplayerEngine';
import { TURN_MS } from '@/lib/poker/multiplayerEngine';

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export default function PokerRoom() {
  const room = useMultiplayerPokerRoom();
  const [joinCode, setJoinCode] = useState('');
  const [nameDraft, setNameDraft] = useState(room.identity.name);
  const [raiseAmt, setRaiseAmt] = useState(0);

  // Auto-join via ?room=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('room');
    if (r && !room.roomCode) {
      setJoinCode(r);
    }
  }, [room.roomCode]);

  const me = room.state.players.find(p => p.id === room.identity.id);
  const isMyTurn = !!me && me.seat === room.state.turnSeat && room.state.phase !== 'waiting' && room.state.phase !== 'showdown' && !me.hasFolded && !me.isAllIn;
  const callAmt = me ? Math.max(0, room.state.currentBet - me.currentBet) : 0;
  const canCheck = callAmt === 0;
  const minRaiseTo = room.state.currentBet + room.state.minRaise;
  const maxRaiseTo = me ? me.currentBet + me.chips : 0;

  useEffect(() => {
    setRaiseAmt(Math.min(maxRaiseTo, minRaiseTo));
  }, [minRaiseTo, maxRaiseTo, room.state.turnSeat, room.state.phase]);

  const inviteUrl = useMemo(() => {
    if (!room.roomCode) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', room.roomCode);
    url.hash = 'features';
    return url.toString();
  }, [room.roomCode]);

  if (!room.roomCode) {
    return (
      <div className="cyber-card p-6 md:p-8 space-y-6">
        <div className="text-center">
          <h4 className="font-display text-2xl tracking-wider">JOIN A LIVE TABLE</h4>
          <p className="text-muted-foreground text-sm mt-2">
            Create a room and invite friends, or join one with a 6-character code.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="space-y-3">
            <label className="font-mono text-xs text-muted-foreground tracking-widest">YOUR DISPLAY NAME</label>
            <Input
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value.slice(0, 20))}
              onBlur={() => room.setName(nameDraft || room.identity.name)}
              placeholder="Display name"
            />
          </div>
          <div className="space-y-3">
            <label className="font-mono text-xs text-muted-foreground tracking-widest">ROOM CODE</label>
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                className="font-mono uppercase"
              />
              <Button onClick={() => { room.setName(nameDraft || room.identity.name); room.joinRoom(joinCode); }}>
                JOIN
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => { room.setName(nameDraft || room.identity.name); room.createRoom(); }}
            className="cyber-btn-primary text-base px-8"
          >
            CREATE NEW ROOM
          </Button>
        </div>
      </div>
    );
  }

  const phase = room.state.phase;
  const timerActive = phase !== 'waiting' && phase !== 'showdown' && room.state.turnDeadline > 0;
  const now = useNow(timerActive);
  const secondsLeft = timerActive ? Math.max(0, Math.ceil((room.state.turnDeadline - now) / 1000)) : 0;
  const pctLeft = timerActive ? Math.max(0, Math.min(100, ((room.state.turnDeadline - now) / TURN_MS) * 100)) : 0;
  const turnName = room.state.players[room.state.turnSeat]?.name ?? '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="cyber-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs text-muted-foreground tracking-widest">ROOM</div>
          <div className="font-display text-xl text-primary tracking-widest">{room.roomCode}</div>
          <div className={cn('text-xs font-mono px-2 py-0.5 rounded', room.connected ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive')}>
            {room.connected ? 'LIVE' : 'OFFLINE'}
          </div>
          {room.isHost && (
            <div className="text-xs font-mono px-2 py-0.5 rounded bg-secondary/20 text-secondary flex items-center gap-1">
              <Crown className="h-3 w-3" /> HOST
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success('Invite link copied'); }}
          >
            <Copy className="h-4 w-4" /> COPY INVITE
          </Button>
          <Button size="sm" variant="outline" onClick={room.leaveRoom}>
            <LogOut className="h-4 w-4" /> LEAVE
          </Button>
        </div>
      </div>

      {/* Table state */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-xs text-muted-foreground tracking-widest">
            PHASE: <span className="text-primary">{phase.toUpperCase()}</span>
          </div>
          <div className="font-mono text-sm">
            POT: <span className="text-accent font-bold">{room.state.pot}</span>
            <span className="ml-4 text-muted-foreground">CURRENT BET:</span> <span className="text-primary">{room.state.currentBet}</span>
          </div>
        </div>

        {/* Community cards */}
        <div className="flex justify-center gap-2 min-h-[6rem] items-center bg-success/5 border border-success/20 rounded-lg p-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => {
            const c = room.state.community[i];
            return c ? <PlayingCard key={i} card={c} size="md" /> : <div key={i} className="w-16 h-24 rounded-md border border-dashed border-muted-foreground/20" />;
          })}
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {room.state.players.map(p => (
            <PlayerSeat key={p.id} player={p} state={room.state} meId={room.identity.id} present={room.presentIds.includes(p.id)} />
          ))}
          {Array.from({ length: Math.max(0, 6 - room.state.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="border border-dashed border-muted-foreground/20 rounded-lg p-3 text-center text-xs text-muted-foreground/50 font-mono">
              EMPTY SEAT
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="cyber-card p-4">
        {phase === 'waiting' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {room.state.players.length < 2
                ? 'Waiting for at least 2 players...'
                : room.isHost ? 'Ready to start.' : 'Waiting for host to start the hand.'}
            </p>
            {room.isHost && (
              <Button onClick={room.startHand} disabled={room.state.players.length < 2} className="cyber-btn-primary">
                START HAND
              </Button>
            )}
          </div>
        )}

        {phase === 'showdown' && (
          <div className="text-center space-y-3">
            {room.state.winners.map(w => (
              <div key={w.id} className="font-display text-lg">
                <span className="text-accent">{w.name}</span> wins <span className="text-primary">{w.amount}</span>
                {w.description && <span className="block text-sm text-muted-foreground">{w.description}</span>}
              </div>
            ))}
            {room.isHost && (
              <Button onClick={room.nextHand} className="cyber-btn-primary">NEXT HAND</Button>
            )}
            {!room.isHost && <p className="text-xs text-muted-foreground">Waiting for host to deal next hand...</p>}
          </div>
        )}

        {phase !== 'waiting' && phase !== 'showdown' && (
          <div className="space-y-3">
            {/* Turn timer */}
            {timerActive && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Timer className="h-3 w-3" /> {isMyTurn ? 'YOUR TURN' : `${turnName}'S TURN`}
                  </span>
                  <span className={cn(secondsLeft <= 5 ? 'text-destructive' : 'text-primary')}>
                    {secondsLeft}s
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-[width] duration-200',
                      secondsLeft <= 5 ? 'bg-destructive' : 'bg-primary'
                    )}
                    style={{ width: `${pctLeft}%` }}
                  />
                </div>
              </div>
            )}

            {/* Default-action picker (always visible) */}
            <div className="flex items-center justify-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">ON TIMEOUT:</span>
              {(['check-fold', 'call-any'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => room.setDefaultPref(opt)}
                  className={cn(
                    'px-2 py-1 rounded border transition-colors',
                    room.defaultPref === opt
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground'
                  )}
                >
                  {opt === 'check-fold' ? 'CHECK / FOLD' : 'CALL ANY'}
                </button>
              ))}
            </div>

            {!me ? (
              <p className="text-center text-sm text-muted-foreground">Spectating — wait for the next hand to be seated.</p>
            ) : !isMyTurn ? (
              <p className="text-center text-sm text-muted-foreground">
                Locked — waiting for {turnName} to act...
              </p>
            ) : (
              <>
                <div className="text-center text-xs font-mono text-primary tracking-widest">YOUR TURN</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button variant="outline" className="border-destructive text-destructive" onClick={() => room.act('fold')}>FOLD</Button>
                  {canCheck ? (
                    <Button variant="outline" onClick={() => room.act('check')}>CHECK</Button>
                  ) : (
                    <Button variant="outline" className="border-primary text-primary" onClick={() => room.act('call')}>
                      CALL {Math.min(callAmt, me.chips)}
                    </Button>
                  )}
                  <Button
                    onClick={() => room.act('raise', raiseAmt)}
                    disabled={maxRaiseTo < minRaiseTo}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    RAISE → {raiseAmt}
                  </Button>
                  <Button onClick={() => room.act('all-in')} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    ALL-IN {me.chips}
                  </Button>
                </div>
                {maxRaiseTo >= minRaiseTo && (
                  <div className="px-2">
                    <Slider
                      value={[raiseAmt]}
                      onValueChange={([v]) => setRaiseAmt(v)}
                      min={minRaiseTo}
                      max={maxRaiseTo}
                      step={room.state.bigBlind}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                      <span>{minRaiseTo}</span>
                      <span>{maxRaiseTo}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Log */}
      <div className="cyber-card p-4">
        <div className="font-mono text-xs text-muted-foreground tracking-widest mb-2">EVENT LOG</div>
        <div className="max-h-32 overflow-y-auto space-y-1 text-xs font-mono">
          {room.state.log.slice().reverse().map((line, i) => (
            <div key={i} className="text-muted-foreground">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerSeat({ player, state, meId, present }: {
  player: RoomPlayer;
  state: ReturnType<typeof useMultiplayerPokerRoom>['state'];
  meId: string;
  present: boolean;
}) {
  const isMe = player.id === meId;
  const isTurn = player.seat === state.turnSeat && state.phase !== 'waiting' && state.phase !== 'showdown';
  const isDealer = player.seat === state.dealerSeat && state.phase !== 'waiting';
  const showCards = isMe || state.phase === 'showdown';

  return (
    <div className={cn(
      'rounded-lg border p-3 transition-all',
      isTurn ? 'border-primary glow-cyan' : 'border-border',
      player.hasFolded && 'opacity-50',
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', present ? 'bg-success' : 'bg-muted-foreground')} />
          <span className="font-display text-sm truncate max-w-[8rem]">{player.name}</span>
          {isMe && <span className="text-[10px] text-primary font-mono">(YOU)</span>}
          {isDealer && <span className="text-[10px] text-accent font-mono">D</span>}
        </div>
        {player.hasActed && !player.hasFolded && <Check className="h-3 w-3 text-success" />}
      </div>
      <div className="flex gap-1 mb-2 min-h-[3.5rem]">
        {player.cards.length > 0 ? (
          player.cards.map((c, i) =>
            showCards
              ? <PlayingCard key={i} card={c} size="sm" />
              : <PlayingCard key={i} faceDown size="sm" />
          )
        ) : (
          <div className="text-xs text-muted-foreground font-mono">—</div>
        )}
      </div>
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">CHIPS</span>
        <span className="text-primary">{player.chips}</span>
      </div>
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">BET</span>
        <span className="text-accent">{player.currentBet}</span>
      </div>
      {player.lastAction && (
        <div className="mt-1 text-[10px] font-mono text-muted-foreground uppercase">
          {player.hasFolded ? 'FOLDED' : player.isAllIn ? 'ALL-IN' : player.lastAction}
        </div>
      )}
    </div>
  );
}
