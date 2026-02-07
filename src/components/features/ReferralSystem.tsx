import { Gift, Users, Vote, Share2, Coins, ArrowRight, Copy, ChevronRight, TrendingUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const tiers = [
  { level: 'BRONZE', referrals: '1-5', reward: '500 $PIONEER', color: 'text-accent' },
  { level: 'SILVER', referrals: '6-15', reward: '2,000 $PIONEER', color: 'text-muted-foreground' },
  { level: 'GOLD', referrals: '16-50', reward: '10,000 $PIONEER', color: 'text-accent' },
  { level: 'DIAMOND', referrals: '50+', reward: '50,000 $PIONEER', color: 'text-primary' },
];

const benefits = [
  {
    icon: Vote,
    title: 'GOVERNANCE VOTING',
    description: 'Earn $PIONEER tokens to participate in protocol governance. Shape game rules, fee structures, and platform direction.',
    color: 'text-primary',
  },
  {
    icon: Coins,
    title: 'REVENUE SHARING',
    description: 'Token holders receive a share of platform revenue, distributed proportionally based on staking amount.',
    color: 'text-accent',
  },
  {
    icon: TrendingUp,
    title: 'EARLY ACCESS',
    description: 'Top referrers unlock early access to new game modes, features, and exclusive NFT drops before public release.',
    color: 'text-secondary',
  },
  {
    icon: Shield,
    title: 'COMMUNITY TIER',
    description: 'Build your reputation in the Pioneer community. Higher tiers unlock enhanced table limits and reduced fees.',
    color: 'text-success',
  },
];

export default function ReferralSystem() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="font-mono text-sm text-success tracking-widest">FEATURE 03</span>
        <h3 className="font-display text-3xl md:text-4xl font-bold mt-3 tracking-wider">
          REFERRAL & <span className="text-glow-cyan text-primary">REWARDS</span>
        </h3>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Invite friends and earn $PIONEER tokens. Participate in community governance,
          revenue sharing, and unlock exclusive benefits as your network grows.
        </p>
      </div>

      {/* Referral Link Demo */}
      <div className="cyber-card p-6">
        <h4 className="font-display text-sm mb-4 text-muted-foreground tracking-wide">YOUR REFERRAL LINK</h4>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted/30 rounded-lg px-4 py-3 font-mono text-sm text-muted-foreground truncate border border-border">
            https://pioneer.game/ref/0x1a2B...3c4D
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              'cyber-btn-primary px-4 py-3 flex items-center gap-2 text-sm',
              copied && 'bg-success text-success-foreground'
            )}
          >
            <Copy className="h-4 w-4" />
            {copied ? 'COPIED!' : 'COPY'}
          </button>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-xs text-muted-foreground">Share via:</span>
          {['Twitter / X', 'Discord', 'Telegram'].map((platform) => (
            <button
              key={platform}
              className="font-mono text-xs px-3 py-1.5 rounded bg-muted/30 text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors border border-border"
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Tiers */}
      <div className="cyber-card p-6">
        <h4 className="font-display text-lg mb-6 tracking-wide">REWARD TIERS</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/50 transition-all text-center">
              <span className={cn('font-display text-lg font-bold', tier.color)}>{tier.level}</span>
              <div className="font-mono text-xs text-muted-foreground mt-1">{tier.referrals} referrals</div>
              <div className="mt-3 font-mono text-sm text-primary font-bold">{tier.reward}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, i) => (
          <div key={i} className="cyber-card p-5 flex gap-4 items-start hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
              <benefit.icon className={cn('h-5 w-5', benefit.color)} />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold tracking-wide">{benefit.title}</h4>
              <p className="text-muted-foreground text-sm mt-1">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Token Info */}
      <div className="cyber-card p-5 border border-primary/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold tracking-wide">$PIONEER TOKEN</h4>
            <p className="text-muted-foreground text-sm mt-1">
              The $PIONEER governance token empowers the community. Token holders vote on protocol upgrades,
              fee adjustments, new game proposals, and treasury allocation. Revenue sharing is distributed
              proportionally to staked $PIONEER holders on a quarterly basis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
