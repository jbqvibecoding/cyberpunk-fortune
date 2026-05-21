import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import type { VerifiableDealRecord, DealPhase } from '@/hooks/useVerifiableDeal';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  record?: VerifiableDealRecord;
  phase?: DealPhase;
}

const steps: { label: string; doneAt: DealPhase[]; activeAt: DealPhase }[] = [
  { label: '链上开局', doneAt: ['started','committing','committed','revealing','revealed','ready'], activeAt: 'starting' },
  { label: '提交承诺', doneAt: ['committed','revealing','revealed','ready'], activeAt: 'committing' },
  { label: '揭示种子', doneAt: ['revealed','ready'], activeAt: 'revealing' },
  { label: '验证完成', doneAt: ['ready'], activeAt: 'revealed' },
];

const short = (h?: string | null) =>
  !h ? '—' : h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;

export default function FairnessModal({ open, onOpenChange, record, phase = 'idle' }: Props) {
  const hasData = !!record && phase !== 'idle';

  const rows = hasData
    ? [
        { k: '游戏 ID', v: record!.gameId ? `#${record!.gameId.toString()}` : '—' },
        { k: 'Client Seed', v: short(record!.clientSeed) },
        { k: '承诺哈希', v: short(record!.commitHash) },
        { k: '结果哈希 (链上)', v: short(record!.resultHash) },
        { k: '发牌种子', v: short(record!.dealSeed) },
        { k: '开局 Tx', v: short(record!.startTx) },
        { k: '承诺 Tx', v: short(record!.commitTx) },
        { k: '揭示 Tx', v: short(record!.revealTx) },
      ]
    : [
        { k: 'VRF 种子', v: '尚未开始可验证发牌' },
        { k: '承诺哈希', v: '请在牌桌点击「开始可验证发牌」' },
        { k: '验证状态', v: '⏳ 待执行' },
      ];

  const explorer = record?.revealTx
    ? `https://sepolia.etherscan.io/tx/${record.revealTx}`
    : record?.startTx
    ? `https://sepolia.etherscan.io/tx/${record.startTx}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cyber-card-neon max-w-lg p-0 overflow-hidden border-secondary/50">
        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="font-cn text-lg text-center">
              本局发牌<span className="text-secondary text-glow-cyan">公平性验证</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-1">
            {steps.map((s, i) => {
              const done = s.doneAt.includes(phase);
              const active = !done && phase === s.activeAt;
              return (
                <div key={s.label} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                      done ? 'bg-secondary/20 border-secondary text-secondary glow-cyan'
                           : active ? 'bg-primary/20 border-primary text-primary'
                           : 'bg-muted/30 border-border text-muted-foreground'
                    }`}>
                      {done ? <Check className="h-3.5 w-3.5" />
                       : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                       : <span className="font-mono text-[10px]">{i + 1}</span>}
                    </div>
                    <span className={`font-cn text-[10px] tracking-wider ${
                      done ? 'text-secondary' : active ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-px flex-1 -translate-y-3 ${done ? 'bg-secondary/60' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-border bg-background/60 divide-y divide-border/60 max-h-72 overflow-y-auto">
            {rows.map(r => (
              <div key={r.k} className="grid grid-cols-3 px-4 py-2.5 text-xs items-center">
                <span className="font-cn text-muted-foreground col-span-1">{r.k}</span>
                <span className="font-mono col-span-2 text-foreground/90 break-all">{r.v}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-cn text-muted-foreground leading-relaxed">
            发牌种子 = keccak256(clientSeed ‖ resultHash)。任何人可在 Sepolia 调用
            <code className="font-mono text-foreground/80 mx-1">SimplePoker.getGameInfo(gameId)</code>
            重新推导，验证本局牌序未被篡改。
          </p>

          {explorer ? (
            <a href={explorer} target="_blank" rel="noreferrer"
               className="cyber-btn-neon !py-2 w-full !text-xs">
              <ExternalLink className="h-3.5 w-3.5" /> 在 Sepolia 浏览器查看
            </a>
          ) : (
            <button disabled
              className="cyber-btn-neon !py-2 w-full !text-xs opacity-60 cursor-not-allowed">
              <ExternalLink className="h-3.5 w-3.5" /> 浏览器链接（待发牌后生成）
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
