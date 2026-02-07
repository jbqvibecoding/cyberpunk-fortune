import { Repeat, ShieldCheck, Zap, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlayMode = 'standard' | 'double-play' | 'no-loss';

interface PlayModeSelectorProps {
  selectedMode: PlayMode;
  onSelectMode: (mode: PlayMode) => void;
  hasDoublePlayNFT: boolean;
  hasNoLossNFT: boolean;
}

const playModes = [
  {
    id: 'double-play' as PlayMode,
    name: 'DOUBLE PLAY PASS',
    shortName: 'DOUBLE PLAY',
    icon: Repeat,
    description: 'Enter two consecutive draws with the same numbers. After the first draw, your ticket automatically enters a second round.',
    nftRequired: true,
    nftKey: 'hasDoublePlayNFT' as const,
    activeColor: 'border-primary bg-primary/10 text-primary',
    iconColor: 'text-primary',
    glowClass: 'glow-cyan',
    tag: 'ERC-721',
  },
  {
    id: 'no-loss' as PlayMode,
    name: 'NOLOSS PLAY PASS',
    shortName: 'NOLOSS PLAY',
    icon: ShieldCheck,
    description: 'Principal routed to DeFi yield (Aave/Compound). Interest funds the prize pool — your principal is always redeemable.',
    nftRequired: true,
    nftKey: 'hasNoLossNFT' as const,
    activeColor: 'border-accent bg-accent/10 text-accent',
    iconColor: 'text-accent',
    glowClass: 'glow-yellow',
    tag: 'ERC-721',
  },
  {
    id: 'standard' as PlayMode,
    name: 'STANDARD PLAY',
    shortName: 'STANDARD',
    icon: Zap,
    description: 'Classic gameplay. Your ticket enters the prize pool directly for the upcoming draw.',
    nftRequired: false,
    nftKey: null,
    activeColor: 'border-secondary bg-secondary/10 text-secondary',
    iconColor: 'text-secondary',
    glowClass: 'glow-magenta',
    tag: 'DEFAULT',
  },
];

export function PlayModeSelector({
  selectedMode,
  onSelectMode,
  hasDoublePlayNFT,
  hasNoLossNFT,
}: PlayModeSelectorProps) {
  const nftStatus: Record<string, boolean> = {
    hasDoublePlayNFT,
    hasNoLossNFT,
  };

  return (
    <div className="cyber-card p-5">
      <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-4">
        SELECT PLAY MODE
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {playModes.map((mode) => {
          const hasNFT = mode.nftKey ? nftStatus[mode.nftKey] : true;
          const isSelected = selectedMode === mode.id;
          const isDisabled = mode.nftRequired && !hasNFT;

          return (
            <button
              key={mode.id}
              onClick={() => !isDisabled && onSelectMode(mode.id)}
              disabled={isDisabled}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all text-left',
                'hover:scale-[1.02] active:scale-[0.98]',
                isSelected
                  ? mode.activeColor
                  : 'border-border bg-muted/20 text-muted-foreground',
                isDisabled && 'opacity-40 cursor-not-allowed hover:scale-100'
              )}
            >
              {/* Tag */}
              <div className="flex items-center justify-between mb-3">
                <mode.icon
                  className={cn(
                    'h-6 w-6',
                    isSelected ? mode.iconColor : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.5 rounded',
                    isSelected
                      ? 'bg-foreground/10 text-foreground'
                      : 'bg-muted/50 text-muted-foreground'
                  )}
                >
                  {mode.tag}
                </span>
              </div>

              {/* Name */}
              <h5 className="font-display text-sm font-bold tracking-wide mb-1">
                {mode.shortName}
              </h5>

              {/* Description */}
              <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                {mode.description}
              </p>

              {/* NFT Lock Overlay */}
              {isDisabled && (
                <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                  <div className="flex flex-col items-center gap-1 text-center px-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      NFT REQUIRED
                    </span>
                  </div>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div
                  className={cn(
                    'absolute top-2 right-2 w-2 h-2 rounded-full',
                    mode.id === 'double-play' && 'bg-primary',
                    mode.id === 'no-loss' && 'bg-accent',
                    mode.id === 'standard' && 'bg-secondary'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active mode info bar */}
      {selectedMode === 'double-play' && hasDoublePlayNFT && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
          <Repeat className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">
            Your ticket will enter <span className="text-primary font-semibold">2 consecutive draws</span> automatically.
          </span>
        </div>
      )}
      {selectedMode === 'no-loss' && hasNoLossNFT && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-accent/5 border border-accent/20 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-muted-foreground">
            Principal sent to DeFi yield. <span className="text-accent font-semibold">Redeemable anytime</span>. Interest funds prize pool.
          </span>
        </div>
      )}

      {/* Wallet NFT detection hint */}
      {(!hasDoublePlayNFT || !hasNoLossNFT) && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            {!hasDoublePlayNFT && !hasNoLossNFT
              ? 'No NFT passes detected in connected wallet.'
              : !hasDoublePlayNFT
              ? 'Double Play Pass NFT not detected.'
              : 'NoLoss Play Pass NFT not detected.'}
            {' '}Connect a wallet holding the required NFT to unlock.
          </span>
        </div>
      )}
    </div>
  );
}
