import neonQueen from '@/assets/agent-neon-queen.png';
import byteBishop from '@/assets/agent-byte-bishop.png';
import cryptoSamurai from '@/assets/agent-crypto-samurai.png';
import voidWalker from '@/assets/agent-void-walker.png';

export type AgentTier = 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';

export interface AIAgent {
  id: string;
  name: string;
  tier: AgentTier;
  portrait: string;
  winRate: number;
  hands: number;
  roi: number;
  skills: { label: string; value: number }[];
  accent: 'magenta' | 'cyan' | 'purple' | 'yellow';
}

export const AGENTS: AIAgent[] = [
  {
    id: 'neon-queen',
    name: 'NEON QUEEN',
    tier: 'LEGENDARY',
    portrait: neonQueen,
    winRate: 68.7,
    hands: 2231,
    roi: 24.5,
    accent: 'magenta',
    skills: [
      { label: 'Aggression', value: 87 },
      { label: 'Bluffing', value: 82 },
      { label: 'Reading', value: 91 },
      { label: 'Stability', value: 76 },
    ],
  },
  {
    id: 'byte-bishop',
    name: 'BYTE BISHOP',
    tier: 'EPIC',
    portrait: byteBishop,
    winRate: 63.1,
    hands: 1804,
    roi: 18.2,
    accent: 'cyan',
    skills: [
      { label: 'Aggression', value: 72 },
      { label: 'Bluffing', value: 65 },
      { label: 'Reading', value: 88 },
      { label: 'Stability', value: 90 },
    ],
  },
  {
    id: 'crypto-samurai',
    name: 'CRYPTO SAMURAI',
    tier: 'EPIC',
    portrait: cryptoSamurai,
    winRate: 60.4,
    hands: 1532,
    roi: 15.8,
    accent: 'magenta',
    skills: [
      { label: 'Aggression', value: 95 },
      { label: 'Bluffing', value: 78 },
      { label: 'Reading', value: 70 },
      { label: 'Stability', value: 68 },
    ],
  },
  {
    id: 'void-walker',
    name: 'VOID WALKER',
    tier: 'RARE',
    portrait: voidWalker,
    winRate: 61.2,
    hands: 1240,
    roi: 12.4,
    accent: 'purple',
    skills: [
      { label: 'Aggression', value: 60 },
      { label: 'Bluffing', value: 92 },
      { label: 'Reading', value: 84 },
      { label: 'Stability', value: 80 },
    ],
  },
];

export const TIER_COLORS: Record<AgentTier, string> = {
  LEGENDARY: 'text-accent',
  EPIC: 'text-primary',
  RARE: 'text-secondary',
  COMMON: 'text-muted-foreground',
};
