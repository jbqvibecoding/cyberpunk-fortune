import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bosses, disclaimer, tierOrder, TierName, Boss } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const tierBadgeClass: Record<TierName, string> = {
  '入门': 'bg-muted/40 text-muted-foreground border-border',
  '进阶': 'bg-secondary/15 text-secondary border-secondary/40',
  '中坚': 'bg-primary/15 text-primary border-primary/40',
  '硬核': 'bg-accent/15 text-accent border-accent/40',
  '宗师': 'bg-[hsl(48,100%,55%,0.15)] text-[hsl(var(--neon-yellow))] border-[hsl(48,100%,55%,0.5)]',
  '传说': 'bg-[hsl(48,100%,55%,0.18)] text-[hsl(var(--neon-yellow))] border-[hsl(48,100%,55%,0.7)] shadow-[0_0_18px_hsl(48,100%,55%,0.35)]',
};

const dimRow = (label: string, v: number) => (
  <div key={label} className="space-y-1">
    <div className="flex justify-between font-cn text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{v.toFixed(2)}</span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-secondary to-primary"
        style={{ width: `${v * 100}%` }}
      />
    </div>
  </div>
);

function AgentCard({ b }: { b: Boss }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cyber-card p-5 space-y-4 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start gap-3">
        <img src={b.portrait} alt={b.name} className="w-16 h-16 rounded-xl object-cover border border-primary/40 glow-purple" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-lg text-glow-cyan tracking-wider">{b.name}</span>
            <span className={cn('px-2 py-0.5 rounded-full border font-cn text-[10px]', tierBadgeClass[b.tier])}>
              {b.tier}
            </span>
          </div>
          <p className="font-cn text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{b.hook}</p>
        </div>
      </div>

      <div className="flex justify-between font-cn text-[11px]">
        <span className="text-muted-foreground">对玩家胜率
          <span className="ml-1.5 font-mono text-secondary">{(b.winRate * 100).toFixed(1)}%</span>
        </span>
        <span className="text-muted-foreground">已对局
          <span className="ml-1.5 font-mono text-foreground">{b.hands.toLocaleString()}</span>
        </span>
      </div>

      <div className="space-y-1.5">
        {dimRow('侵略性', b.stats.aggression)}
        {dimRow('诈唬频率', b.stats.bluff)}
        {dimRow('紧手程度', b.stats.tight)}
        {dimRow('Cbet 频率', b.stats.cbet)}
        {dimRow('追加投入', b.stats.continue)}
      </div>

      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-[11px] font-cn text-muted-foreground hover:text-primary transition-colors"
      >
        <span>招牌打法</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <p className="font-cn text-xs text-foreground/80 leading-relaxed bg-primary/5 border border-primary/20 rounded-md p-3 animate-fade-in">
          {b.signature}
        </p>
      )}

      <p className="font-cn text-[10px] text-muted-foreground/80 leading-relaxed italic">
        {disclaimer}
      </p>

      <Link to="/table" className="cyber-btn-primary w-full !py-2 !text-xs">
        挑战 {b.name}
      </Link>
    </div>
  );
}

export default function AgentsPage() {
  const [tier, setTier] = useState<TierName | '全部'>('全部');
  const list = tier === '全部' ? bosses : bosses.filter(b => b.tier === tier);

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <span className="font-mono text-[11px] tracking-[0.4em] text-accent">10 / AGENT CARDS</span>
        <h1 className="font-cn text-3xl md:text-4xl mt-2">
          名人 <span className="text-glow-magenta text-accent">AI 图鉴</span>
        </h1>
        <p className="font-cn text-sm text-muted-foreground mt-2">
          研究对手的牌风，挑选你想挑战的名人 Boss。
        </p>
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {(['全部', ...tierOrder] as const).map(t => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={cn(
              'px-3 py-1.5 rounded-md font-cn text-xs border transition-all',
              tier === t
                ? 'border-primary bg-primary/15 text-primary glow-purple'
                : 'border-border text-muted-foreground hover:border-primary/50',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map(b => (
          <AgentCard key={b.id} b={b} />
        ))}
      </div>
    </div>
  );
}
