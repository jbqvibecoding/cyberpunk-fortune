import { useState } from 'react';
import { Users, Gem, Gift, Globe, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiPlayerPoker from '@/components/features/MultiPlayerPoker';
import NFTPasses from '@/components/features/NFTPasses';
import ReferralSystem from '@/components/features/ReferralSystem';
import ENSIntegration from '@/components/features/ENSIntegration';

const tabs = [
  {
    id: 'multiplayer',
    label: 'MULTI-PLAYER',
    icon: Users,
    color: 'text-secondary',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary/10',
    glowClass: 'glow-magenta',
    description: 'Multiplayer poker tables with AI dealer',
  },
  {
    id: 'nft-passes',
    label: 'NFT PASSES',
    icon: Gem,
    color: 'text-accent',
    borderColor: 'border-accent',
    bgColor: 'bg-accent/10',
    glowClass: 'glow-yellow',
    description: 'Double Play & NoLoss game privileges',
  },
  {
    id: 'referral',
    label: 'REFERRALS',
    icon: Gift,
    color: 'text-success',
    borderColor: 'border-success',
    bgColor: 'bg-success/10',
    glowClass: '',
    description: 'Earn tokens by inviting friends',
  },
  {
    id: 'ens',
    label: 'ENS IDENTITY',
    icon: Globe,
    color: 'text-primary',
    borderColor: 'border-primary',
    bgColor: 'bg-primary/10',
    glowClass: 'glow-cyan',
    description: 'Ethereum Name Service integration',
  },
];

const featureComponents: Record<string, React.FC> = {
  multiplayer: MultiPlayerPoker,
  'nft-passes': NFTPasses,
  referral: ReferralSystem,
  ens: ENSIntegration,
};

export default function AdvancedFeatures() {
  const [activeTab, setActiveTab] = useState('multiplayer');
  const ActiveComponent = featureComponents[activeTab];

  return (
    <section id="features" className="py-24 relative bg-gradient-to-b from-background via-primary/3 to-background">
      {/* Background grid */}
      <div className="absolute inset-0 cyber-grid opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="font-mono text-sm text-primary tracking-widest">PLATFORM FEATURES</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 tracking-wider">
            ADVANCED <span className="text-glow-cyan text-primary">FEATURES</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Next-generation gaming powered by smart contracts, NFTs, and decentralized identity.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'cyber-card p-4 text-center transition-all duration-300 cursor-pointer group',
                activeTab === tab.id
                  ? `${tab.borderColor} border-2 ${tab.glowClass}`
                  : 'border border-border hover:border-primary/30'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors',
                activeTab === tab.id ? tab.bgColor : 'bg-muted/30 group-hover:bg-muted/50'
              )}>
                <tab.icon className={cn('h-5 w-5', activeTab === tab.id ? tab.color : 'text-muted-foreground group-hover:text-foreground')} />
              </div>
              <span className={cn(
                'font-display text-xs font-bold tracking-wide block',
                activeTab === tab.id ? tab.color : 'text-muted-foreground'
              )}>
                {tab.label}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground mt-1 block hidden md:block">
                {tab.description}
              </span>
            </button>
          ))}
        </div>

        {/* Active Feature Content */}
        <div className="max-w-5xl mx-auto animate-fade-in" key={activeTab}>
          <ActiveComponent />
        </div>
      </div>
    </section>
  );
}
