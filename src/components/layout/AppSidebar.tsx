import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid, PlayCircle, Users, BarChart3, Trophy, History, Settings, Spade,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/lobby',       label: '大厅',     icon: LayoutGrid },
  { to: '/table',       label: '开始',     icon: PlayCircle },
  { to: '/agents',      label: '名人图鉴', icon: Users },
  { to: '/report',      label: '我的牌品', icon: BarChart3 },
  { to: '/leaderboard', label: '排行榜',   icon: Trophy },
  { to: '/history',     label: '历史',     icon: History },
  { to: '/settings',    label: '设置',     icon: Settings },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border/60 bg-card/60 backdrop-blur-xl sticky top-0 h-screen z-30">
      <NavLink to="/lobby" className="flex items-center gap-3 px-5 h-20 border-b border-border/60">
        <div className="w-9 h-9 rounded-lg bg-purple-gradient flex items-center justify-center glow-purple">
          <Spade className="h-4 w-4 text-white" />
        </div>
        <span className="font-display text-lg font-bold tracking-widest">
          <span className="text-glow-cyan text-secondary">Ai</span>{' '}
          <span className="text-glow-magenta text-accent">POKER</span>
        </span>
      </NavLink>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map(it => {
          const active = pathname === it.to || (it.to === '/lobby' && pathname === '/');
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-cn text-sm transition-all',
                active
                  ? 'bg-primary/15 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-primary/5',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary glow-purple" />
              )}
              <it.icon className={cn('h-4 w-4', active && 'text-primary')} />
              <span>{it.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border/60 text-[10px] font-mono tracking-widest text-muted-foreground">
        v1.0 · 纯游戏筹码
      </div>
    </aside>
  );
}
