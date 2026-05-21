import { leaderboard } from '@/lib/mockData';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
      <h1 className="font-cn text-3xl mb-2 flex items-center gap-3">
        <Trophy className="h-7 w-7 text-[hsl(var(--neon-yellow))]" />
        排行榜
      </h1>
      <p className="font-cn text-muted-foreground text-sm mb-6">
        按对玩家胜率排序的名人 Boss 实时榜单（mock 数据）。
      </p>

      <div className="cyber-card divide-y divide-border/60">
        {leaderboard.map(r => (
          <div key={r.name} className="flex items-center gap-4 px-5 py-4">
            <div className={`font-display text-2xl w-10 ${r.rank === 1 ? 'text-[hsl(var(--neon-yellow))]' : 'text-muted-foreground'}`}>
              #{r.rank}
            </div>
            <div className="flex-1 font-cn">{r.name}</div>
            <div className="font-cn text-xs text-muted-foreground">{r.tier}</div>
            <div className="font-mono text-secondary">{(r.winRate * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
