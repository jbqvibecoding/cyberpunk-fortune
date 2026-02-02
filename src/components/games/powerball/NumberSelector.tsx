import { RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberSelectorProps {
  selectedNumbers: number[];
  powerball: number | null;
  lastDrawNumbers?: number[];
  lastDrawPowerball?: number;
  onToggleNumber: (num: number) => void;
  onTogglePowerball: (num: number) => void;
  onQuickPick: () => void;
  onClear: () => void;
  onFillRemaining: () => void;
}

export const NumberSelector = ({
  selectedNumbers,
  powerball,
  lastDrawNumbers = [],
  lastDrawPowerball,
  onToggleNumber,
  onTogglePowerball,
  onQuickPick,
  onClear,
  onFillRemaining,
}: NumberSelectorProps) => {
  const remainingNumbers = 5 - selectedNumbers.length;
  const needsPowerball = powerball === null;

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onQuickPick}
          className="cyber-btn bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          QUICK PICK ALL
        </button>
        {remainingNumbers > 0 && remainingNumbers < 5 && (
          <button
            onClick={onFillRemaining}
            className="cyber-btn bg-accent/20 text-accent border border-accent/50 hover:bg-accent/30 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            FILL REMAINING ({remainingNumbers})
          </button>
        )}
        {(selectedNumbers.length > 0 || powerball !== null) && (
          <button
            onClick={onClear}
            className="cyber-btn bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-foreground flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            CLEAR ALL
          </button>
        )}
      </div>

      {/* Main Number Selection */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">
            SELECT 5 NUMBERS <span className="text-primary">(1-69)</span>
          </h3>
          <div className="flex items-center gap-2">
            {lastDrawNumbers.length > 0 && (
              <span className="text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full bg-success/30 border border-success mr-1" />
                Last Draw
              </span>
            )}
            <span className={cn(
              "font-mono px-2 py-1 rounded",
              selectedNumbers.length === 5 
                ? "bg-success/20 text-success" 
                : "bg-primary/20 text-primary"
            )}>
              {selectedNumbers.length}/5
            </span>
          </div>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2">
          {Array.from({ length: 69 }, (_, i) => i + 1).map(num => {
            const isSelected = selectedNumbers.includes(num);
            const isLastDraw = lastDrawNumbers.includes(num);
            const isDisabled = !isSelected && selectedNumbers.length >= 5;

            return (
              <button
                key={num}
                onClick={() => onToggleNumber(num)}
                disabled={isDisabled}
                className={cn(
                  'relative aspect-square rounded-lg font-mono text-sm font-bold transition-all duration-200',
                  'flex items-center justify-center',
                  'border-2',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] scale-105'
                    : isLastDraw
                    ? 'bg-success/10 border-success/50 text-success hover:bg-success/20'
                    : 'bg-muted/50 border-border text-foreground hover:bg-muted hover:border-primary/50',
                  isDisabled && !isSelected && 'opacity-40 cursor-not-allowed hover:bg-muted/50 hover:border-border'
                )}
              >
                {num}
                {isLastDraw && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-success animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Powerball Selection */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">
            SELECT POWERBALL <span className="text-secondary">(1-26)</span>
          </h3>
          <div className="flex items-center gap-2">
            {lastDrawPowerball && (
              <span className="text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full bg-success/30 border border-success mr-1" />
                Last Draw
              </span>
            )}
            <span className={cn(
              "font-mono px-2 py-1 rounded",
              powerball !== null
                ? "bg-success/20 text-success" 
                : "bg-secondary/20 text-secondary"
            )}>
              {powerball ? '1/1' : '0/1'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-9 sm:grid-cols-13 gap-1.5 sm:gap-2">
          {Array.from({ length: 26 }, (_, i) => i + 1).map(num => {
            const isSelected = powerball === num;
            const isLastDraw = lastDrawPowerball === num;

            return (
              <button
                key={`pb-${num}`}
                onClick={() => onTogglePowerball(num)}
                className={cn(
                  'relative aspect-square rounded-lg font-mono text-sm font-bold transition-all duration-200',
                  'flex items-center justify-center',
                  'border-2',
                  isSelected
                    ? 'bg-secondary text-secondary-foreground border-secondary shadow-[0_0_15px_rgba(var(--secondary-rgb),0.5)] scale-105'
                    : isLastDraw
                    ? 'bg-success/10 border-success/50 text-success hover:bg-success/20'
                    : 'bg-muted/50 border-border text-foreground hover:bg-muted hover:border-secondary/50'
                )}
              >
                {num}
                {isLastDraw && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-success animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="cyber-card p-6">
        <h3 className="font-display text-lg mb-4">YOUR SELECTION</h3>
        <div className="flex flex-wrap items-center gap-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-xl border-2 transition-all duration-300',
                selectedNumbers[i]
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]'
                  : 'bg-muted/30 border-border/50 text-muted-foreground animate-pulse'
              )}
            >
              {selectedNumbers[i] || '?'}
            </div>
          ))}
          <div className="text-2xl text-muted-foreground font-display px-2">+</div>
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-xl border-2 transition-all duration-300',
              powerball
                ? 'bg-secondary text-secondary-foreground border-secondary shadow-[0_0_20px_rgba(var(--secondary-rgb),0.4)]'
                : 'bg-muted/30 border-border/50 text-muted-foreground animate-pulse'
            )}
          >
            {powerball || '?'}
          </div>
        </div>

        {/* Selection Status */}
        <div className="mt-4 pt-4 border-t border-border/50">
          {selectedNumbers.length === 5 && powerball !== null ? (
            <div className="flex items-center gap-2 text-success">
              <Sparkles className="h-4 w-4" />
              <span className="font-mono text-sm">SELECTION COMPLETE - READY TO BUY!</span>
            </div>
          ) : (
            <div className="text-muted-foreground font-mono text-sm">
              {remainingNumbers > 0 && (
                <span>Select {remainingNumbers} more number{remainingNumbers > 1 ? 's' : ''}</span>
              )}
              {remainingNumbers > 0 && needsPowerball && <span> and </span>}
              {needsPowerball && <span>pick your Powerball</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
