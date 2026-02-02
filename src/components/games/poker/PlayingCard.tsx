import { Card } from '@/lib/poker/types';
import { getSuitSymbol, isRedSuit } from '@/lib/poker/deck';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  highlight?: boolean;
}

const sizeClasses = {
  sm: 'w-12 h-18 text-sm',
  md: 'w-16 h-24 text-base',
  lg: 'w-20 h-30 text-lg',
};

export function PlayingCard({ 
  card, 
  faceDown = false, 
  size = 'md', 
  className,
  highlight = false,
}: PlayingCardProps) {
  if (faceDown || !card) {
    return (
      <div 
        className={cn(
          'playing-card face-down',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  const isRed = isRedSuit(card.suit);
  const symbol = getSuitSymbol(card.suit);

  return (
    <div 
      className={cn(
        'playing-card',
        sizeClasses[size],
        isRed ? 'text-destructive' : 'text-primary-foreground',
        highlight && 'ring-2 ring-accent ring-offset-2 ring-offset-background',
        className
      )}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <span className="font-bold">{card.rank}</span>
        <span className="text-xl">{symbol}</span>
      </div>
    </div>
  );
}
