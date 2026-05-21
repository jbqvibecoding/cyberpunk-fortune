import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, ExternalLink } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

const steps = ['VRF 种子', '洗牌承诺', '加密发牌', '揭示验证'];

const data = [
  { k: 'VRF 种子',  v: '0x9f3a...c2e1' },
  { k: '承诺哈希',  v: '0x7b1d...88af' },
  { k: '验证状态',  v: '✅ 已验证 — 本局牌序从开局起未被篡改' },
];

export default function FairnessModal({ open, onOpenChange }: Props) {
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
            {steps.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-7 h-7 rounded-full bg-secondary/20 border border-secondary text-secondary flex items-center justify-center glow-cyan">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-cn text-[10px] text-secondary tracking-wider">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="h-px flex-1 bg-secondary/60 -translate-y-3" />
                )}
              </div>
            ))}
          </div>

          {/* Data rows */}
          <div className="rounded-lg border border-border bg-background/60 divide-y divide-border/60">
            {data.map(r => (
              <div key={r.k} className="grid grid-cols-3 px-4 py-2.5 text-xs">
                <span className="font-cn text-muted-foreground col-span-1">{r.k}</span>
                <span className="font-mono col-span-2 text-foreground/90 break-all">{r.v}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-cn text-muted-foreground leading-relaxed">
            任何人都可在链上独立验证此局发牌。AI 行动时只能看到公共牌和它自己的底牌。
          </p>

          <a
            href="#"
            className="cyber-btn-neon !py-2 w-full !text-xs"
            onClick={e => e.preventDefault()}
          >
            <ExternalLink className="h-3.5 w-3.5" /> 在区块浏览器查看
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
