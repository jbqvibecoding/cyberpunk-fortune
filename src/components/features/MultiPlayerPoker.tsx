import { Users, Cpu, Shield, Clock, Spade, Crown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const seats = [
  { label: 'PLAYER 1', position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', isAI: false },
  { label: 'PLAYER 2', position: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2', isAI: false },
  { label: 'PLAYER 3', position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', isAI: false },
  { label: 'PLAYER 4', position: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2', isAI: false },
];

const features = [
  {
    icon: Users,
    title: 'UP TO 6 PLAYERS',
    description: 'Compete against other players in real-time multiplayer Texas Hold\'em with turn-based mechanics.',
    color: 'text-primary',
  },
  {
    icon: Cpu,
    title: 'AI DEALER',
    description: 'A provably fair AI manages dealing, pot calculations, and game flow. All actions verified on-chain.',
    color: 'text-secondary',
  },
  {
    icon: Shield,
    title: 'ANTI-COLLUSION',
    description: 'Encrypted card distribution via Chainlink VRF prevents any form of player collusion or cheating.',
    color: 'text-success',
  },
  {
    icon: Clock,
    title: 'TURN TIMER',
    description: 'Automatic 30-second turn timer ensures games move at a steady pace. Auto-fold on timeout.',
    color: 'text-accent',
  },
];

export default function MultiPlayerPoker() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="font-mono text-sm text-secondary tracking-widest">FEATURE 01</span>
        <h3 className="font-display text-3xl md:text-4xl font-bold mt-3 tracking-wider">
          MULTI-PLAYER <span className="text-glow-magenta text-secondary">POKER</span>
        </h3>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Join multiplayer tables with up to 6 players. AI acts as the impartial dealer, managing cards
          and enforcing rules through smart contracts. Every deal is provably fair.
        </p>
      </div>

      {/* Visual Table Diagram */}
      <div className="cyber-card p-8 md:p-12">
        <div className="relative w-full max-w-lg mx-auto aspect-square">
          {/* Table surface */}
          <div className="absolute inset-12 rounded-full bg-gradient-to-b from-success/15 to-success/5 border-2 border-success/30" />

          {/* AI Dealer center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center mx-auto glow-magenta">
              <Crown className="h-8 w-8 text-secondary" />
            </div>
            <span className="font-display text-xs text-secondary mt-2 block">AI DEALER</span>
          </div>

          {/* Player seats */}
          {seats.map((seat, i) => (
            <div key={i} className={cn('absolute w-20 text-center', seat.position)}>
              <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/50 flex items-center justify-center mx-auto hover:glow-cyan transition-all cursor-pointer">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground mt-1 block">{seat.label}</span>
            </div>
          ))}

          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(185 100% 50% / 0.1)" strokeWidth="0.3" strokeDasharray="2 2" />
          </svg>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feat, i) => (
          <div key={i} className="cyber-card p-5 flex gap-4 items-start hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
              <feat.icon className={cn('h-5 w-5', feat.color)} />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold tracking-wide">{feat.title}</h4>
              <p className="text-muted-foreground text-sm mt-1">{feat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="cyber-card p-6">
        <h4 className="font-display text-lg mb-4 tracking-wide">HOW IT WORKS</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'JOIN TABLE', desc: 'Select a table with your preferred stakes and buy in.' },
            { step: '02', title: 'AI DEALS', desc: 'Chainlink VRF generates verifiable random cards for all players.' },
            { step: '03', title: 'TAKE TURNS', desc: 'Players act in sequence — check, bet, raise, or fold.' },
            { step: '04', title: 'WIN POT', desc: 'Best hand wins. Smart contract distributes winnings instantly.' },
          ].map((item, i) => (
            <div key={i} className="text-center p-4">
              <span className="font-mono text-2xl text-primary font-bold">{item.step}</span>
              <h5 className="font-display text-sm mt-2 mb-1">{item.title}</h5>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              {i < 3 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-auto mt-3 hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
