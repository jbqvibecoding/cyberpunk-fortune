import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

const wallets = [
  { id: 'phantom',  name: 'Phantom',  color: 'from-[#ab9ff2] to-[#7b68ee]', glyph: 'P' },
  { id: 'solflare', name: 'Solflare', color: 'from-[#ffb547] to-[#ff7a00]', glyph: 'S' },
  { id: 'backpack', name: 'Backpack', color: 'from-[#ff4b6e] to-[#c1185c]', glyph: 'B' },
];

export default function WalletModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cyber-card-neon max-w-md p-0 overflow-hidden border-primary/50">
        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-center text-xl">
              <span className="text-glow-cyan text-secondary">连接钱包</span>
              <span className="text-muted-foreground"> · 可选</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground font-cn text-center leading-relaxed">
            钱包仅用于亲手签收发牌的公平性证明，不涉及任何资金、充值或交易。<br />
            不连接也能正常游玩。
          </p>

          <div className="grid grid-cols-3 gap-3">
            {wallets.map(w => (
              <button
                key={w.id}
                className="cyber-card p-4 flex flex-col items-center gap-2 hover:border-primary/70 transition-all hover:-translate-y-0.5"
                onClick={() => onOpenChange(false)}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${w.color} flex items-center justify-center font-display font-bold text-white text-lg shadow-lg`}>
                  {w.glyph}
                </div>
                <span className="font-cn text-xs">{w.name}</span>
              </button>
            ))}
          </div>

          <div className="text-center font-mono text-[10px] tracking-widest text-muted-foreground">
            SOLANA WALLETS ONLY · NO FUNDS REQUIRED
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
