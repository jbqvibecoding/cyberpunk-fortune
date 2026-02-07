import { Gem, ShieldCheck, RefreshCw, TrendingUp, Eye, Lock, Repeat, Coins, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACTS, ZERO_ADDRESS } from '@/lib/contracts/addresses';
import { GameNFTABI } from '@/lib/contracts/GameNFTABI';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sepolia } from 'wagmi/chains';

// ── localStorage helpers ─────────────────────────────────
const NFT_STORAGE_KEY = 'pioneer_nft_owned';

function getLocalNFTOwnership(address: string | undefined): { doublePlay: boolean; noLoss: boolean } {
  if (!address) return { doublePlay: false, noLoss: false };
  try {
    const raw = localStorage.getItem(`${NFT_STORAGE_KEY}_${address.toLowerCase()}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { doublePlay: false, noLoss: false };
}

function setLocalNFTOwnership(address: string, type: 'doublePlay' | 'noLoss') {
  const key = `${NFT_STORAGE_KEY}_${address.toLowerCase()}`;
  const current = getLocalNFTOwnership(address);
  current[type] = true;
  localStorage.setItem(key, JSON.stringify(current));
}

function clearLocalNFTOwnership(address: string | undefined) {
  if (!address) return;
  localStorage.removeItem(`${NFT_STORAGE_KEY}_${address.toLowerCase()}`);
}

const nftPasses = [
  {
    id: 'double-play',
    name: 'DOUBLE PLAY PASS',
    subtitle: 'Dual Draw Privilege',
    icon: Repeat,
    color: 'primary',
    glowClass: 'glow-cyan',
    textGlow: 'text-glow-cyan',
    borderColor: 'border-primary',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    description: 'Participate in two consecutive draws with the same number set. After the first draw concludes, your ticket automatically enters a second round — doubling your chances without re-purchasing.',
    features: [
      { icon: Repeat, label: 'Two draws per ticket entry' },
      { icon: Coins, label: 'Same numbers, double exposure' },
      { icon: ShieldCheck, label: 'Automatic second-round enrollment' },
      { icon: TrendingUp, label: '2× probability boost per purchase' },
    ],
    mechanics: [
      'Purchase a Powerball ticket while holding a Double Play Pass NFT.',
      'Your selected numbers enter the primary draw as normal.',
      'After the primary draw resolves, the same numbers automatically enter a second independent draw.',
      'Winnings from both draws are credited to your wallet.',
    ],
  },
  {
    id: 'noloss-play',
    name: 'NOLOSS PLAY PASS',
    subtitle: 'No-Loss Gameplay',
    icon: ShieldCheck,
    color: 'accent',
    glowClass: 'glow-yellow',
    textGlow: 'text-glow-yellow',
    borderColor: 'border-accent',
    bgColor: 'bg-accent/10',
    iconColor: 'text-accent',
    description: 'Your ticket principal is never at risk. Instead of entering the prize pool, funds are routed to DeFi yield strategies (Aave, Compound). Generated interest forms the prize pool — your principal is always redeemable.',
    features: [
      { icon: Lock, label: 'Principal always redeemable' },
      { icon: TrendingUp, label: 'Interest-funded prize pool' },
      { icon: Eye, label: 'On-chain transparent returns' },
      { icon: RefreshCw, label: 'DeFi yield via Aave / Compound' },
    ],
    mechanics: [
      'Activate NoLoss mode during ticket purchase (requires NFT pass).',
      'Ticket principal is deposited into custodied DeFi strategies (Aave, Compound).',
      'Generated interest aggregates into the NoLoss prize pool.',
      'Winners are selected via periodic random draws from the interest pool.',
      'Redeem your principal at any time — smart contract guarantees retrievability.',
    ],
  },
];

export default function NFTPasses() {
  const { address, isConnected } = useAccount();
  const isDeployed = CONTRACTS.GameNFT !== ZERO_ADDRESS;
  const { writeContract, isPending } = useWriteContract();
  const [mintingType, setMintingType] = useState<number | null>(null);
  const { toast } = useToast();
  const publicClient = usePublicClient({ chainId: sepolia.id });

  // ── Local fallback state from localStorage ──
  const [localOwned, setLocalOwned] = useState(() => getLocalNFTOwnership(address));

  useEffect(() => {
    setLocalOwned(getLocalNFTOwnership(address));
  }, [address]);

  // ── On-chain reads with explicit chainId ──
  const { data: hasDoublePlay, refetch: refetchDoublePlay } = useReadContract({
    address: CONTRACTS.GameNFT,
    abi: GameNFTABI,
    functionName: 'hasNFTType',
    args: address ? [address, 0] : undefined,
    chainId: sepolia.id,
    query: { enabled: isDeployed && !!address, refetchInterval: 5000 },
  });

  const { data: hasNoLoss, refetch: refetchNoLoss } = useReadContract({
    address: CONTRACTS.GameNFT,
    abi: GameNFTABI,
    functionName: 'hasNFTType',
    args: address ? [address, 1] : undefined,
    chainId: sepolia.id,
    query: { enabled: isDeployed && !!address, refetchInterval: 5000 },
  });

  // ── Direct RPC read as additional fallback ──
  const directReadNFT = useCallback(async () => {
    if (!publicClient || !address || !isDeployed) return;
    try {
      const [dp, nl] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.GameNFT,
          abi: GameNFTABI,
          functionName: 'hasNFTType',
          args: [address, 0],
        }),
        publicClient.readContract({
          address: CONTRACTS.GameNFT,
          abi: GameNFTABI,
          functionName: 'hasNFTType',
          args: [address, 1],
        }),
      ]);
      console.log('[NFT Direct Read]', { doublePlay: dp, noLoss: nl });
      if (dp === true) {
        setLocalOwned(prev => ({ ...prev, doublePlay: true }));
        setLocalNFTOwnership(address, 'doublePlay');
      }
      if (nl === true) {
        setLocalOwned(prev => ({ ...prev, noLoss: true }));
        setLocalNFTOwnership(address, 'noLoss');
      }
    } catch (err) {
      console.warn('[NFT Direct Read Error]', err);
    }
  }, [publicClient, address, isDeployed]);

  // Try direct read on mount and periodically
  useEffect(() => {
    directReadNFT();
    const interval = setInterval(directReadNFT, 8000);
    return () => clearInterval(interval);
  }, [directReadNFT]);

  // ── Combined ownership: on-chain OR localStorage ──
  const ownsDoublePlay = hasDoublePlay === true || localOwned.doublePlay;
  const ownsNoLoss = hasNoLoss === true || localOwned.noLoss;

  console.log('[NFT Debug]', {
    hasDoublePlay, hasNoLoss, localOwned,
    ownsDoublePlay, ownsNoLoss,
    address, contractAddr: CONTRACTS.GameNFT,
  });

  const handleMint = (passType: number) => {
    if (!isDeployed || !isConnected || !address) return;
    const alreadyMinted = passType === 0 ? ownsDoublePlay : ownsNoLoss;
    if (alreadyMinted) {
      toast({ title: 'Already Minted', description: 'You already own this pass.', variant: 'destructive' });
      return;
    }
    setMintingType(passType);
    writeContract(
      {
        address: CONTRACTS.GameNFT,
        abi: GameNFTABI,
        functionName: 'mintPass',
        args: [BigInt(passType)],
        gas: BigInt(200_000),
      },
      {
        onSuccess: () => {
          toast({ title: 'Mint Successful!', description: 'Your NFT Pass has been minted.' });
          // Immediately update local ownership
          const typeKey = passType === 0 ? 'doublePlay' : 'noLoss';
          setLocalNFTOwnership(address, typeKey as 'doublePlay' | 'noLoss');
          setLocalOwned(prev => ({ ...prev, [typeKey]: true }));
          // Also try to refetch on-chain data
          setTimeout(() => {
            refetchDoublePlay();
            refetchNoLoss();
            directReadNFT();
          }, 3000);
        },
        onError: (error) => {
          const msg = error?.message || '';
          if (msg.includes('User rejected') || msg.includes('denied')) {
            toast({ title: 'Cancelled', description: 'Transaction was rejected.' });
          } else {
            toast({ title: 'Mint Failed', description: 'Transaction failed. You may have already minted this pass.', variant: 'destructive' });
          }
        },
        onSettled: () => setMintingType(null),
      },
    );
  };

  const handleReset = () => {
    clearLocalNFTOwnership(address);
    setLocalOwned({ doublePlay: false, noLoss: false });
    refetchDoublePlay();
    refetchNoLoss();
    toast({ title: 'Reset Complete', description: 'Local NFT cache cleared. You can mint again after deploying a new contract.' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="font-mono text-sm text-accent tracking-widest">FEATURE 02</span>
        <h3 className="font-display text-3xl md:text-4xl font-bold mt-3 tracking-wider">
          NFT <span className="text-glow-yellow text-accent">GAME PASSES</span>
        </h3>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Unlock exclusive gameplay privileges with NFT-based passes. Each pass grants a unique advantage
          — from doubled draws to risk-free participation powered by DeFi yields.
        </p>
        {/* Reset button for demo */}
        {isConnected && (ownsDoublePlay || ownsNoLoss) && (
          <button
            onClick={handleReset}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-xs font-mono hover:bg-destructive/20 transition-all"
          >
            <Trash2 className="h-3 w-3" /> RESET DEMO (Clear Local Cache)
          </button>
        )}
      </div>

      {/* NFT Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nftPasses.map((pass) => (
          <div key={pass.id} className={cn('cyber-card p-6 border-2 transition-all hover:scale-[1.01]', pass.borderColor, `hover:${pass.glowClass}`)}>
            {/* NFT Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center border', pass.bgColor, pass.borderColor)}>
                <pass.icon className={cn('h-7 w-7', pass.iconColor)} />
              </div>
              <div>
                <h4 className={cn('font-display text-lg font-bold tracking-wide', pass.iconColor)}>{pass.name}</h4>
                <span className="font-mono text-xs text-muted-foreground">{pass.subtitle}</span>
              </div>
              <div className="ml-auto">
                <span className="font-mono text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground">ERC-721</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{pass.description}</p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {pass.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                  <feat.icon className={cn('h-4 w-4 shrink-0', pass.iconColor)} />
                  <span className="text-xs text-foreground">{feat.label}</span>
                </div>
              ))}
            </div>

            {/* Mechanics */}
            <div className="border-t border-border pt-4">
              <h5 className="font-display text-sm mb-3 text-muted-foreground tracking-wide">MECHANICS</h5>
              <ol className="space-y-2">
                {pass.mechanics.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className={cn('font-mono font-bold shrink-0', pass.iconColor)}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Mint Button */}
            <div className="border-t border-border pt-4 mt-4">
              {(() => {
                const passType = pass.id === 'double-play' ? 0 : 1;
                const alreadyHas = passType === 0 ? ownsDoublePlay : ownsNoLoss;
                const isMinting = mintingType === passType && isPending;

                if (!isConnected) {
                  return (
                    <div className="text-center text-xs text-muted-foreground font-mono py-2">
                      CONNECT WALLET TO MINT
                    </div>
                  );
                }
                if (!isDeployed) {
                  return (
                    <div className="text-center text-xs text-muted-foreground font-mono py-2">
                      CONTRACT NOT DEPLOYED
                    </div>
                  );
                }
                if (alreadyHas) {
                  return (
                    <div className="text-center text-xs text-success font-mono py-2 flex items-center justify-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> OWNED
                    </div>
                  );
                }
                return (
                  <button
                    onClick={() => handleMint(passType)}
                    disabled={isMinting}
                    className={cn(
                      'w-full py-3 rounded-lg font-display text-sm tracking-wide transition-all flex items-center justify-center gap-2',
                      pass.bgColor, pass.borderColor, 'border hover:opacity-80',
                      isMinting && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {isMinting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> MINTING...</>
                    ) : (
                      <>MINT {pass.name} (FREE)</>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* DeFi Integration Note */}
      <div className="cyber-card p-5 border border-accent/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Eye className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold tracking-wide">FULL ON-CHAIN TRANSPARENCY</h4>
            <p className="text-muted-foreground text-sm mt-1">
              All fund flows, DeFi deposits, interest accruals, and prize distributions are fully verifiable on-chain.
              Users can audit revenue sources at any time through block explorers. Smart contracts guarantee principal
              retrievability with no custodial risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
