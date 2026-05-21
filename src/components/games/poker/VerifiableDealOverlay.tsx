import { Check, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { DealPhase } from '@/hooks/useVerifiableDeal';
import { cn } from '@/lib/utils';

const orderedPhases: DealPhase[] = [
  'idle', 'starting', 'started', 'committing', 'committed', 'revealing', 'revealed', 'ready',
];

const steps: { key: DealPhase[]; label: string; desc: string }[] = [
  { key: ['starting', 'started'], label: '链上开局', desc: '锁定买入 · 创建牌局' },
  { key: ['committing', 'committed'], label: '提交承诺', desc: 'keccak256(clientSeed)' },
  { key: ['revealing', 'revealed'], label: '揭示种子', desc: '链上写入结果 · 生成 resultHash' },
  { key: ['ready'], label: '可验证发牌', desc: '从链上熵确定性洗牌' },
];

function statusOf(stepKeys: DealPhase[], phase: DealPhase) {
  const pi = orderedPhases.indexOf(phase);
  const max = Math.max(...stepKeys.map(k => orderedPhases.indexOf(k)));
  const min = Math.min(...stepKeys.map(k => orderedPhases.indexOf(k)));
  if (pi > max) return 'done';
  if (pi >= min) return 'active';
  return 'todo';
}

interface Props {
  phase: DealPhase;
  error: string | null;
  onRetry?: () => void;
}

export function VerifiableDealOverlay({ phase, error, onRetry }: Props) {
  if (phase === 'idle' || phase === 'ready') return null;
  const isError = phase === 'error';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/85 backdrop-blur-sm rounded-xl">
      <div className="cyber-card-neon w-[min(92%,560px)] p-6 space-y-5">
        <div className="flex items-center gap-2 justify-center">
          {isError
            ? <AlertTriangle className="h-5 w-5 text-destructive" />
            : <ShieldCheck className="h-5 w-5 text-secondary" />}
          <h3 className="font-cn text-base tracking-wider">
            {isError
              ? <span className="text-destructive">链上发牌失败</span>
              : <>正在执行 <span className="text-secondary text-glow-cyan">可验证发牌</span></>}
          </h3>
        </div>

        {isError ? (
          <>
            <p className="font-cn text-xs text-muted-foreground text-center break-all">
              {error || '未知错误，请重试'}
            </p>
            <button onClick={onRetry} className="cyber-btn-neon w-full">重试</button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              {steps.map(s => {
                const st = statusOf(s.key, phase);
                return (
                  <div
                    key={s.label}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      st === 'done' && 'border-secondary/50 bg-secondary/5',
                      st === 'active' && 'border-primary/60 bg-primary/10 glow-purple',
                      st === 'todo' && 'border-border/60 bg-background/40 opacity-60',
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border',
                      st === 'done' && 'border-secondary text-secondary bg-secondary/15',
                      st === 'active' && 'border-primary text-primary bg-primary/15',
                      st === 'todo' && 'border-border text-muted-foreground',
                    )}>
                      {st === 'done'
                        ? <Check className="h-3.5 w-3.5" />
                        : st === 'active'
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <span className="font-mono text-[10px]">·</span>}
                    </div>
                    <div className="flex-1">
                      <div className="font-cn text-sm tracking-wide">{s.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="font-cn text-[11px] text-muted-foreground text-center pt-1">
              请在钱包中确认交易 · 牌面将在链上验证后渲染
            </p>
          </>
        )}
      </div>
    </div>
  );
}
