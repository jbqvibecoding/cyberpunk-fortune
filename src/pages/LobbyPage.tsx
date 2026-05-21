import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bosses, tables, tierOrder, TierName } from '@/lib/mockData';
import { Zap, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LobbyPage() {
  const [tier, setTier] = useState<TierName>('入门');
  const spotlight = bosses[0];
  const top = bosses.slice(0, 5);

  const filtered = tables.filter(t => t.tier === tier);

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto cyber-grid">
      {/* Hero */}
      <section className="grid lg:grid-cols-12 gap-6 mb-10">
        <div className="lg:col-span-8 cyber-card-neon p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent/15 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative">
            <span className="font-mono text-[11px] tracking-[0.4em] text-secondary">
              06 / WEB PAGE — LOBBY
            </span>
            <h1 className="mt-3 font-cn font-black text-3xl md:text-5xl leading-tight">
              挑战<span className="text-glow-magenta text-accent">名人 AI</span>，
              <br />
              坐上<span className="text-glow-cyan text-secondary">牌桌</span>。
            </h1>
            <p className="mt-3 font-cn text-muted-foreground max-w-lg">
              未来已来，智能代理，为你而战。
              <span className="font-display text-xs ml-2 tracking-widest">
                THE FUTURE IS NOW
              </span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/table" className="cyber-btn-primary animate-glow-breathe">
                <Zap className="h-4 w-4" /> 立即开始
              </Link>
              <Link to="/agents" className="cyber-btn-neon">
                查看名人图鉴
              </Link>
            </div>
          </div>
        </div>

        {/* Spotlight */}
        <div className="lg:col-span-4 cyber-card p-5 space-y-4 border-accent/40">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.3em] text-accent">
              AI AGENT SPOTLIGHT
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[hsl(48,100%,55%,0.15)] border border-[hsl(48,100%,55%,0.5)] text-[hsl(var(--neon-yellow))] font-cn text-[10px]">
              {spotlight.tier}
            </span>
          </div>
          <div className="flex gap-3">
            <img src={spotlight.portrait} alt={spotlight.name} className="w-20 h-20 rounded-xl object-cover border border-accent/40" />
            <div>
              <div className="font-display text-accent text-glow-magenta text-lg">{spotlight.name}</div>
              <div className="font-cn text-xs text-muted-foreground">对玩家胜率</div>
              <div className="font-display text-secondary text-glow-cyan text-2xl">
                {(spotlight.winRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <Link to="/agents" className="cyber-btn-neon !py-2 w-full !text-xs">
            查看牌风
          </Link>

          <div className="pt-3 border-t border-border/60 space-y-2">
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
              顶级 BOSS
            </div>
            {top.map((b, i) => (
              <div key={b.id} className="flex items-center justify-between text-xs font-cn">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span>{b.name}</span>
                </span>
                <span className="text-secondary font-mono">
                  {(b.winRate * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tables */}
      <section className="cyber-card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-cn text-lg flex items-center gap-2">
            <Trophy className="h-4 w-4 text-secondary" />
            桌台大厅
          </h2>
          <div className="flex flex-wrap gap-1">
            {tierOrder.map(t => (
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
        </div>

        {/* Header */}
        <div className="hidden md:grid lobby-row !py-2 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          <div className="col-span-3">桌台</div>
          <div className="col-span-3">盲注</div>
          <div className="col-span-3">在座 BOSS</div>
          <div className="col-span-1 flex items-center gap-1"><Users className="h-3 w-3" /> 玩家</div>
          <div className="col-span-2 text-right">操作</div>
        </div>

        <div className="space-y-1.5 mt-1">
          {filtered.length === 0 && (
            <div className="text-center py-12 font-cn text-muted-foreground text-sm">
              该难度暂无开放桌台
            </div>
          )}
          {filtered.map(t => (
            <div key={t.id} className="lobby-row hover:border-primary/40">
              <div className="col-span-12 md:col-span-3 font-cn">
                <span className="font-display tracking-wider">{t.name}</span>
              </div>
              <div className="col-span-6 md:col-span-3 font-mono text-secondary text-sm">{t.blinds}</div>
              <div className="col-span-6 md:col-span-3 font-cn text-sm text-muted-foreground">{t.bosses}</div>
              <div className="col-span-6 md:col-span-1 font-mono text-xs">{t.seats}</div>
              <div className="col-span-6 md:col-span-2 flex justify-end">
                <Link to="/table" className="cyber-btn-primary !py-1.5 !px-4 !text-[11px]">
                  加入
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
