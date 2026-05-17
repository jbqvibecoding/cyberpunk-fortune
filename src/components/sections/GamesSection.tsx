import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Users, Coins, Lock } from 'lucide-react';

const tabs = [
  { id: 'cash', label: 'CASH GAME', icon: Coins },
  { id: 'tournament', label: 'TOURNAMENT', icon: Trophy },
  { id: 'sitgo', label: 'SIT & GO', icon: Users },
  { id: 'private', label: 'PRIVATE', icon: Lock },
] as const;

const tables = [
  { name: 'NEON 01',     blinds: '0.01 / 0.02 ETH', buyIn: '1–2 ETH',   players: '5 / 9', hot: true },
  { name: 'CYBER 09',    blinds: '0.05 / 0.10 ETH', buyIn: '5–10 ETH',  players: '8 / 9' },
  { name: 'METAL 22',    blinds: '0.10 / 0.20 ETH', buyIn: '10–20 ETH', players: '6 / 9' },
  { name: 'QUANTUM 88',  blinds: '0.50 / 1.00 ETH', buyIn: '50–100 ETH', players: '7 / 9', hot: true },
  { name: 'PHANTOM 47',  blinds: '0.02 / 0.05 ETH', buyIn: '2–5 ETH',   players: '4 / 9' },
];

const GamesSection = () => {
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('cash');

  return (
    <section id="games" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="font-mono text-xs text-secondary tracking-[0.4em]">06 / WEB PAGE — LOBBY</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 tracking-wider">
            JOIN <span className="bg-clip-text text-transparent bg-purple-gradient">AI AGENTS</span>
          </h2>
          <p className="text-muted-foreground mt-3">Dominate the table — pick a stake and sit down.</p>
        </div>

        <div className="cyber-card-neon max-w-5xl mx-auto p-6 md:p-8">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-primary/20 mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  'px-4 py-3 font-display text-xs tracking-widest flex items-center gap-2 transition-colors border-b-2 -mb-px',
                  active === t.id
                    ? 'border-secondary text-secondary text-glow-cyan'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 px-4 pb-3 text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            <div className="col-span-3">Table</div>
            <div className="col-span-3">Blinds</div>
            <div className="col-span-3">Buy-in</div>
            <div className="col-span-1">Players</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Rows */}
          <div className="space-y-1.5">
            {tables.map(t => (
              <div key={t.name} className="lobby-row group">
                <div className="col-span-3 flex items-center gap-2">
                  <span className="font-display text-base text-foreground group-hover:text-secondary transition-colors">{t.name}</span>
                  {t.hot && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/40">HOT</span>
                  )}
                </div>
                <div className="col-span-3 font-mono text-sm text-muted-foreground">{t.blinds}</div>
                <div className="col-span-3 font-mono text-sm text-muted-foreground">{t.buyIn}</div>
                <div className="col-span-1 font-mono text-sm text-secondary">{t.players}</div>
                <div className="col-span-2 flex justify-end">
                  <a href="#poker" className="px-5 py-1.5 rounded-md font-display text-xs tracking-widest bg-primary/20 border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                    JOIN
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
