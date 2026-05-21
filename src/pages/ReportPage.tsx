import { useState } from 'react';
import { myProfile, CommentatorKey } from '@/lib/mockData';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertTriangle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tagClass = (tag: string) => {
  if (tag === '高' || tag === '松')
    return 'bg-accent/15 text-accent border-accent/40';
  return 'bg-secondary/15 text-secondary border-secondary/40';
};

export default function ReportPage() {
  const [voice, setVoice] = useState<CommentatorKey>('CZ');
  const p = myProfile;

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1280px] mx-auto space-y-6">
      {/* Hero */}
      <section className="cyber-card-neon p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-10 w-72 h-72 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
        <span className="font-mono text-[11px] tracking-[0.4em] text-accent">
          PLAYER PROFILE · 牌品报告
        </span>
        <div className="mt-3 flex flex-wrap items-end gap-6">
          <div className="text-7xl md:text-8xl leading-none">{p.personality.emoji}</div>
          <div>
            <h1 className="font-cn text-4xl md:text-5xl font-black text-glow-magenta text-accent">
              {p.personality.name}
            </h1>
            <p className="font-cn text-muted-foreground mt-1">{p.personality.hook}</p>
          </div>
        </div>
        <p className="mt-5 font-cn text-foreground/90 leading-relaxed text-sm md:text-base max-w-2xl">
          {p.personality.verdict}
        </p>
      </section>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Radar */}
        <section className="cyber-card p-5 lg:col-span-2">
          <div className="font-cn text-sm mb-3 flex justify-between items-center">
            <span>风格画像</span>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent" /> 你
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary" /> 平均
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={p.radar} outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dim"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  name="平均"
                  dataKey="avg"
                  stroke="hsl(var(--secondary))"
                  fill="hsl(var(--secondary))"
                  fillOpacity={0.18}
                />
                <Radar
                  name="你"
                  dataKey="you"
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Metrics */}
        <section className="cyber-card p-5 lg:col-span-3">
          <div className="font-cn text-sm mb-3">核心指标对比</div>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2 bg-muted/30 font-mono text-[10px] tracking-widest text-muted-foreground">
              <div className="col-span-5">指标</div>
              <div className="col-span-3">你</div>
              <div className="col-span-3">平均</div>
              <div className="col-span-1 text-right">标签</div>
            </div>
            <div className="divide-y divide-border/60">
              {p.metrics.map(m => (
                <div key={m.name} className="grid grid-cols-12 px-4 py-2 text-xs items-center">
                  <div className="col-span-5 font-cn">{m.name}</div>
                  <div className="col-span-3 font-mono text-foreground">{m.you}</div>
                  <div className="col-span-3 font-mono text-muted-foreground">{m.avg}</div>
                  <div className="col-span-1 flex justify-end">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] border font-cn', tagClass(m.tag))}>
                      {m.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Leaks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="font-cn text-sm">主要 Leak 诊断</div>
          <div className="flex items-center gap-2 font-cn text-xs">
            <span className="text-muted-foreground">名人解说：</span>
            {(['CZ', '巴菲特', '孙宇晨'] as CommentatorKey[]).map(v => (
              <button
                key={v}
                onClick={() => setVoice(v)}
                className={cn(
                  'px-2.5 py-1 rounded-md border text-[11px] transition-all',
                  voice === v
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="cyber-card p-4 border-[hsl(48,100%,55%,0.4)] bg-[hsl(48,100%,55%,0.05)]">
          <div className="font-cn text-sm">
            <span className="text-[hsl(var(--neon-yellow))] mr-2">{voice} 解说：</span>
            <span className="italic">"{p.commentary[voice]}"</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {p.leaks.map(l => (
            <div key={l.t} className="cyber-card p-4 space-y-2 border-[hsl(48,100%,55%,0.35)]">
              <div className="flex items-center gap-2 font-cn">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--neon-yellow))]" />
                <span className="font-medium">{l.t}</span>
              </div>
              <p className="font-cn text-xs text-muted-foreground leading-relaxed">{l.d}</p>
              <div className="font-cn text-xs text-secondary">
                → {l.fix}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lifecycle */}
      <section className="cyber-card p-5">
        <div className="font-cn text-sm mb-4">成长循环</div>
        <div className="flex items-center">
          {p.lifecycle.map((s, i) => {
            const done = i < p.lifecycleCurrent;
            const active = i === p.lifecycleCurrent;
            return (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs border transition-all',
                      done && 'bg-secondary/20 border-secondary text-secondary',
                      active && 'bg-primary text-primary-foreground border-primary glow-purple animate-glow-breathe',
                      !done && !active && 'border-border text-muted-foreground',
                    )}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={cn(
                      'font-cn text-[11px]',
                      (active || done) ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {s}
                  </span>
                </div>
                {i < p.lifecycle.length - 1 && (
                  <div className={cn(
                    'h-px flex-1 -translate-y-3',
                    done ? 'bg-secondary/60' : 'bg-border',
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Share */}
      <section className="cyber-card-neon p-6 flex flex-col md:flex-row items-center gap-6 border-accent/50">
        <div className="text-6xl">{p.personality.emoji}</div>
        <div className="flex-1 space-y-1">
          <div className="font-cn text-xl text-accent text-glow-magenta">{p.personality.name}</div>
          <div className="font-cn text-sm text-muted-foreground">{p.personality.hook}</div>
          <div className="font-cn text-xs text-foreground/80">
            最戏剧化的 leak：{p.leaks[0].d}
          </div>
        </div>
        <button className="cyber-btn-primary">
          <Share2 className="h-4 w-4" /> 分享我的画像
        </button>
      </section>
    </div>
  );
}
