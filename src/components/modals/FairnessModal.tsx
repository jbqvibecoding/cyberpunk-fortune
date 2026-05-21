import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, ExternalLink, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { VerifiableDealRecord, DealPhase } from '@/hooks/useVerifiableDeal';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { useExplorer } from '@/lib/explorer';
import { toast } from 'sonner';

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

type RowKind = 'tx' | 'address' | 'hash' | 'plain';
interface Row {
  k: string;
  v?: string | null;       // raw value
  display?: string;        // override display
  kind: RowKind;
}

export default function FairnessModal({ open, onOpenChange, record, phase = 'idle' }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const explorer = useExplorer();
  const hasData = !!record && phase !== 'idle';

  const copy = async (val: string, key: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(key);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(c => (c === key ? null : c)), 1500);
    } catch {
      toast.error('复制失败');
    }
  };

  const linkFor = (row: Row): string | null => {
    if (!row.v) return null;
    if (row.kind === 'tx') return explorer.tx(row.v);
    if (row.kind === 'address') return explorer.address(row.v);
    return null;
  };

  const rows: Row[] = hasData
    ? [
        { k: '游戏 ID', v: record!.gameId?.toString() ?? null, display: record!.gameId ? `#${record!.gameId.toString()}` : '—', kind: 'plain' },
        { k: 'Client Seed', v: record!.clientSeed, kind: 'hash' },
        { k: '承诺哈希', v: record!.commitHash, kind: 'hash' },
        { k: '结果哈希 (链上)', v: record!.resultHash, kind: 'hash' },
        { k: '发牌种子', v: record!.dealSeed, kind: 'hash' },
        { k: '合约地址', v: CONTRACTS.SimplePoker, kind: 'address' },
        { k: '开局 Tx', v: record!.startTx, kind: 'tx' },
        { k: '承诺 Tx', v: record!.commitTx, kind: 'tx' },
        { k: '揭示 Tx', v: record!.revealTx, kind: 'tx' },
      ]
    : [
        { k: '合约地址', v: CONTRACTS.SimplePoker, kind: 'address' },
        { k: '验证状态', display: '⏳ 待执行 — 请在牌桌点击「开始可验证发牌」', kind: 'plain' },
      ];

  const primaryExplorer =
    explorer.tx(record?.revealTx) ??
    explorer.tx(record?.commitTx) ??
    explorer.tx(record?.startTx);

  const contractReadUrl = explorer.readContract(CONTRACTS.SimplePoker);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cyber-card-neon max-w-lg p-0 overflow-hidden border-secondary/50">
        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="font-cn text-lg text-center">
              本局发牌<span className="text-secondary text-glow-cyan">公平性验证</span>
            </DialogTitle>
          </DialogHeader>

          {/* Steps */}
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

          {/* Data rows */}
          <div className="rounded-lg border border-border bg-background/60 divide-y divide-border/60 max-h-80 overflow-y-auto">
            {rows.map(r => {
              const link = linkFor(r);
              const text = r.display ?? short(r.v);
              const canCopy = !!r.v && r.kind !== 'plain';
              return (
                <div key={r.k} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <span className="font-cn text-muted-foreground w-24 shrink-0">{r.k}</span>
                  <span className="font-mono flex-1 text-foreground/90 break-all">{text}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {canCopy && (
                      <button
                        onClick={() => copy(r.v!, r.k)}
                        className="p-1.5 rounded hover:bg-secondary/15 text-muted-foreground hover:text-secondary transition-colors"
                        title="复制"
                      >
                        {copied === r.k
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                          : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded hover:bg-secondary/15 text-muted-foreground hover:text-secondary transition-colors"
                        title={`在 ${explorer.chainName} ${explorer.name} 查看`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-cn text-muted-foreground leading-relaxed">
            发牌种子 = keccak256(clientSeed ‖ resultHash)。点击右侧
            <ExternalLink className="inline h-3 w-3 mx-0.5" />
            可在 {explorer.chainName} {explorer.name} 上验证每一笔交易，或调用
            <code className="font-mono text-foreground/80 mx-1">getGameInfo(gameId)</code>
            重新推导发牌种子。
          </p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={primaryExplorer ?? '#'}
              target={primaryExplorer ? '_blank' : undefined}
              rel="noreferrer"
              aria-disabled={!primaryExplorer}
              onClick={e => { if (!primaryExplorer) e.preventDefault(); }}
              className={`cyber-btn-neon !py-2 !text-xs ${!primaryExplorer ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ExternalLink className="h-3.5 w-3.5" /> 查看最近交易
            </a>
            <a
              href={contractReadUrl}
              target="_blank"
              rel="noreferrer"
              className="cyber-btn-neon !py-2 !text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" /> 调用 getGameInfo
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
