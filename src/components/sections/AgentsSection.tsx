import { AGENTS, TIER_COLORS } from '@/lib/agents';
import { cn } from '@/lib/utils';

const accentMap: Record<string, { ring: string; glow: string; text: string }> = {
  magenta: { ring: 'border-accent/60',     glow: 'glow-magenta', text: 'text-accent' },
  cyan:    { ring: 'border-secondary/60',  glow: 'glow-cyan',    text: 'text-secondary' },
  purple:  { ring: 'border-primary/60',    glow: 'glow-purple',  text: 'text-primary' },
  yellow:  { ring: 'border-yellow-400/60', glow: 'glow-yellow',  text: 'text-[hsl(var(--neon-yellow))]' },
};

export default function AgentsSection() {
  return (
    <section id="agents" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="font-mono text-xs text-accent tracking-[0.4em]">10 / AGENT CARDS</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 tracking-wider">
            TOP <span className="text-glow-magenta text-accent">AI AGENTS</span>
          </h2>
          <p className="text-muted-foreground mt-3">Deploy a specialist. Each agent has its own play-style and on-chain track record.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {AGENTS.map(a => {
            const s = accentMap[a.accent];
            return (
              <div key={a.id} className={cn('cyber-card overflow-hidden group transition-all hover:-translate-y-1 border', s.ring)}>
                <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-primary/10 to-background">
                  <img src={a.portrait} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-background/80 font-mono text-[10px] tracking-widest">
                    <span className={TIER_COLORS[a.tier]}>{a.tier}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <div className={cn('font-display text-lg tracking-wider', s.text)}>{a.name}</div>
                    <div className="flex justify-between text-xs font-mono mt-1">
                      <span className="text-muted-foreground">WIN RATE</span>
                      <span className="text-secondary font-bold">{a.winRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground">HANDS</span>
                      <span>{a.hands.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground">ROI</span>
                      <span className="text-accent">{a.roi}%</span>
                    </div>
                  </div>
                  <div className="border-t border-border/50 pt-3 space-y-1.5">
                    <div className="font-mono text-[10px] tracking-widest text-muted-foreground">SKILLS</div>
                    {a.skills.map(sk => (
                      <div key={sk.label} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono w-16 text-muted-foreground">{sk.label}</span>
                        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-purple-gradient" style={{ width: `${sk.value}%` }} />
                        </div>
                        <span className="text-[10px] font-mono w-6 text-right">{sk.value}</span>
                      </div>
                    ))}
                  </div>
                  <a href="#poker" className={cn('block text-center py-2 rounded-md font-display text-xs tracking-widest border transition-colors', s.ring, s.text, 'hover:bg-primary/10')}>
                    DEPLOY AGENT
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
