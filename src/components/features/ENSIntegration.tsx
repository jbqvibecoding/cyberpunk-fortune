import { Globe, User, BadgeCheck, Link2, Search, Fingerprint, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const examplePlayers = [
  { ens: 'cryptowhale.eth', avatar: '🐋', chips: '12,450', status: 'online', color: 'text-primary' },
  { ens: 'neonrider.eth', avatar: '🏍️', chips: '8,200', status: 'in-game', color: 'text-secondary' },
  { ens: 'diamondhands.eth', avatar: '💎', chips: '25,000', status: 'online', color: 'text-accent' },
  { ens: 'luckyace.eth', avatar: '🃏', chips: '5,800', status: 'away', color: 'text-muted-foreground' },
];

const integrationFeatures = [
  {
    icon: User,
    title: 'HUMAN-READABLE NAMES',
    description: 'Replace cryptic wallet addresses with memorable ENS names at poker tables and leaderboards.',
    color: 'text-primary',
  },
  {
    icon: BadgeCheck,
    title: 'VERIFIED IDENTITY',
    description: 'ENS names serve as verified on-chain identities. Build reputation that follows you across Web3.',
    color: 'text-success',
  },
  {
    icon: Globe,
    title: 'AVATAR & PROFILE',
    description: 'ENS metadata powers your in-game avatar, bio, and social links — all decentralized.',
    color: 'text-secondary',
  },
  {
    icon: Link2,
    title: 'CROSS-PLATFORM',
    description: 'Your Pioneer reputation links to your ENS profile, visible across the entire Ethereum ecosystem.',
    color: 'text-accent',
  },
];

export default function ENSIntegration() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="font-mono text-sm text-primary tracking-widest">FEATURE 04</span>
        <h3 className="font-display text-3xl md:text-4xl font-bold mt-3 tracking-wider">
          ENS <span className="text-glow-cyan text-primary">IDENTITY</span>
        </h3>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Integrate Ethereum Name Service for seamless player identification. Replace wallet addresses
          with human-readable names, verified avatars, and cross-platform reputation.
        </p>
      </div>

      {/* Player List Preview */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-display text-sm tracking-wide text-muted-foreground">PLAYER LOBBY PREVIEW</h4>
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5 border border-border">
            <Search className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">Search ENS...</span>
          </div>
        </div>

        <div className="space-y-3">
          {examplePlayers.map((player, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-all group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-xl border border-border group-hover:border-primary/50 transition-colors">
                {player.avatar}
              </div>

              {/* ENS Name */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('font-display text-sm font-bold', player.color)}>
                    {player.ens}
                  </span>
                  <BadgeCheck className="h-3.5 w-3.5 text-success" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {player.chips} chips
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  player.status === 'online' && 'bg-success',
                  player.status === 'in-game' && 'bg-secondary animate-pulse',
                  player.status === 'away' && 'bg-muted-foreground',
                )} />
                <span className="font-mono text-xs text-muted-foreground capitalize">{player.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrationFeatures.map((feat, i) => (
          <div key={i} className="cyber-card p-5 flex gap-4 items-start hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
              <feat.icon className={cn('h-5 w-5', feat.color)} />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold tracking-wide">{feat.title}</h4>
              <p className="text-muted-foreground text-sm mt-1">{feat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Resolution Flow */}
      <div className="cyber-card p-6">
        <h4 className="font-display text-lg mb-4 tracking-wide">ENS RESOLUTION FLOW</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Fingerprint,
              step: '01',
              title: 'CONNECT WALLET',
              desc: 'Connect your Ethereum wallet. If an ENS name is linked, it is automatically detected.',
            },
            {
              icon: Globe,
              step: '02',
              title: 'RESOLVE ENS',
              desc: 'Pioneer resolves your ENS name, avatar, and metadata via on-chain lookups.',
            },
            {
              icon: Zap,
              step: '03',
              title: 'PLAY AS YOU',
              desc: 'Your ENS identity appears at tables, on leaderboards, and in hand histories.',
            },
          ].map((item, i) => (
            <div key={i} className="text-center p-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="font-mono text-xl text-primary font-bold">{item.step}</span>
              <h5 className="font-display text-sm mt-2 mb-1">{item.title}</h5>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="cyber-card p-5 border border-primary/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold tracking-wide">PRIVACY FIRST</h4>
            <p className="text-muted-foreground text-sm mt-1">
              ENS integration is fully optional. Players without ENS names are displayed with truncated
              wallet addresses. No personal data is stored — all identity resolution happens on-chain
              through Ethereum&apos;s decentralized name service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
