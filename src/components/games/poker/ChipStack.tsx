import { cn } from '@/lib/utils';

interface ChipStackProps {
  amount: number;
  label?: string;
  variant?: 'gold' | 'silver' | 'primary';
  className?: string;
}

export function ChipStack({ amount, label, variant = 'gold', className }: ChipStackProps) {
  const variantClasses = {
    gold: 'chip-gold',
    silver: 'chip-silver',
    primary: 'bg-primary/20 border-primary text-primary',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn('chip', variantClasses[variant])}>
        {label && <span className="text-xs font-display">{label}</span>}
      </div>
      <span className="font-mono text-sm text-muted-foreground">
        {amount.toLocaleString()}
      </span>
    </div>
  );
}
